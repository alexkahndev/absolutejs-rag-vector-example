import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import {
  buildRAGUpsertInputFromDocuments,
  loadRAGDocumentsFromDirectory,
  prepareRAGDocument,
  type RAGChunkingStrategy,
  type RAGContentFormat,
  type RAGDocumentIngestInput,
  type RAGIngestDocument,
  type RAGPreparedDocument,
  type RAGVectorStore,
} from "@absolutejs/absolute/ai";
import { createSQLiteRAG } from "@absolutejs/absolute-rag-sqlite";
import { createPostgresRAG } from "@absolutejs/absolute-rag-postgresql";
import type { SQLiteRAG } from "@absolutejs/absolute-rag-sqlite";
import type { PostgreSQLRAG } from "@absolutejs/absolute-rag-postgresql";
import type { Database } from "bun:sqlite";
import { ragDemoExtractors } from "./ragDemoExtractors";

export type RagDocumentKind = "seed" | "custom";
export type DemoBackendMode = "sqlite-native" | "sqlite-fallback" | "postgres";
export type DemoContentFormat = RAGContentFormat;
export type DemoChunkingStrategy = RAGChunkingStrategy;

export type RagSeedDocument = {
  id: string;
  text: string;
  title?: string;
  source?: string;
  format?: DemoContentFormat;
  chunkStrategy?: DemoChunkingStrategy;
  kind?: RagDocumentKind;
  metadata?: Record<string, unknown>;
};

export type DemoBackendDescriptor = {
  id: DemoBackendMode;
  label: string;
  path: string;
  available: boolean;
  reason?: string;
};

type SQLiteRagAdapter = SQLiteRAG;
type PostgresRagAdapter = PostgreSQLRAG;
export type DemoRAGAdapter = SQLiteRagAdapter | PostgresRagAdapter;

export type DemoRAGBackend = DemoBackendDescriptor & {
  rag?: DemoRAGAdapter;
};

export const DEFAULT_BACKEND_MODE: DemoBackendMode = "sqlite-native";
export const RAG_DEMO_TABLE_NAME = "rag_demo_vectors";
export const RAG_DEMO_DOCUMENT_TABLE_NAME = "rag_demo_documents";
export const RAG_DEMO_DEFAULT_CHUNK_SIZE = 420;
export const RAG_DEMO_DEFAULT_CUSTOM_CHUNK_SIZE = 320;
export const RAG_DEMO_BACKEND_ORDER: DemoBackendMode[] = [
  "sqlite-native",
  "sqlite-fallback",
  "postgres",
];
export const DEMO_CORPUS_DIR = resolve(
  fileURLToPath(new URL("../../../rag-demo-corpus", import.meta.url)),
);

const SQLITE_NATIVE_TABLE_NAME = "rag_demo_vectors_native_vec0";
const SQLITE_NATIVE_CHUNK_TABLE_NAME = "rag_demo_vectors_native_chunks";
const SQLITE_FALLBACK_TABLE_NAME = "rag_demo_vectors_fallback";

const DEFAULT_SEED_STRATEGY: DemoChunkingStrategy = "source_aware";
const DEFAULT_CUSTOM_STRATEGY: DemoChunkingStrategy = "paragraphs";

const createChunkingDefaults = (
  strategy: DemoChunkingStrategy,
  maxChunkLength: number,
) => ({
  chunkOverlap: strategy === "fixed" ? 0 : Math.min(80, Math.floor(maxChunkLength / 6)),
  maxChunkLength,
  minChunkLength: 40,
  strategy,
});

const toPreparedDocument = (
  doc: RagSeedDocument,
  kind: RagDocumentKind = doc.kind ?? "seed",
): RAGPreparedDocument => {
  const format = doc.format ?? (doc.source?.endsWith(".html") || doc.source?.endsWith(".htm")
    ? "html"
    : doc.source?.endsWith(".md") || doc.source?.endsWith(".mdx")
      ? "markdown"
      : "text");
  const strategy = doc.chunkStrategy ?? (kind === "seed" ? DEFAULT_SEED_STRATEGY : DEFAULT_CUSTOM_STRATEGY);
  const maxChunkLength = kind === "seed"
    ? RAG_DEMO_DEFAULT_CHUNK_SIZE
    : RAG_DEMO_DEFAULT_CUSTOM_CHUNK_SIZE;

  return prepareRAGDocument(
    {
      format,
      id: doc.id,
      metadata: {
        ...(doc.metadata ?? {}),
        documentId: doc.id,
        kind,
      },
      source: doc.source,
      text: doc.text,
      title: doc.title,
      chunking: createChunkingDefaults(strategy, maxChunkLength),
    },
  );
};

export const countPreparedChunks = (
  doc: RagSeedDocument,
  kind: RagDocumentKind = doc.kind ?? "seed",
) => toPreparedDocument(doc, kind).chunks.length;

const loadSeedCorpusInput = async (): Promise<RAGDocumentIngestInput> =>
  loadRAGDocumentsFromDirectory({
    directory: DEMO_CORPUS_DIR,
    defaultChunking: createChunkingDefaults(DEFAULT_SEED_STRATEGY, RAG_DEMO_DEFAULT_CHUNK_SIZE),
    baseMetadata: {
      kind: "seed",
      sourceKind: "rag-demo-corpus",
    },
    extractors: ragDemoExtractors,
  });

export const getSeedDocuments = async (): Promise<RagSeedDocument[]> => {
  const loaded = await loadSeedCorpusInput();
  return loaded.documents.map((doc) => {
    const prepared = prepareRAGDocument(doc, createChunkingDefaults(DEFAULT_SEED_STRATEGY, RAG_DEMO_DEFAULT_CHUNK_SIZE));
    return {
      chunkStrategy: DEFAULT_SEED_STRATEGY,
      format: prepared.format,
      id: prepared.documentId,
      source: prepared.source,
      text: doc.text,
      title: prepared.title,
      kind: "seed",
      metadata: prepared.metadata,
    } satisfies RagSeedDocument;
  });
};

type RAGStoreOptions = {
  path?: string;
  db?: Database;
};

const createSQLiteNativeRAG = (opts: RAGStoreOptions = {}): SQLiteRagAdapter =>
  createSQLiteRAG({
    storeOptions: {
      dimensions: 24,
      path: opts.path,
      db: opts.db,
      tableName: SQLITE_NATIVE_CHUNK_TABLE_NAME,
      native: {
        mode: "vec0",
        distanceMetric: "cosine",
        tableName: SQLITE_NATIVE_TABLE_NAME,
        requireAvailable: false,
      },
    },
  });

const createSQLiteFallbackRAG = (opts: RAGStoreOptions = {}): SQLiteRagAdapter =>
  createSQLiteRAG({
    storeOptions: {
      dimensions: 24,
      path: opts.path,
      db: opts.db,
      tableName: SQLITE_FALLBACK_TABLE_NAME,
    },
  });

const createPostgresDemoRAG = (connectionString: string): PostgresRagAdapter =>
  createPostgresRAG({
    connectionString,
    vector: {
      provider: "pgvector",
      dimensions: 24,
      distanceMetric: "cosine",
      autoCreateExtension: true,
      autoCreateSchema: true,
      autoCreateTables: true,
      autoCreateIndex: true,
      index: {
        type: "hnsw",
        m: 16,
        efConstruction: 64,
        efSearch: 80,
      },
    },
    schema: {
      schemaName: "absolute_rag_demo",
      chunkTableName: "chunks",
      migrationTableName: "migrations",
    },
  });

export const getBackendPath = (mode: DemoBackendMode) => {
  switch (mode) {
    case "sqlite-fallback":
      return "/rag/sqlite-fallback";
    case "postgres":
      return "/rag/postgres";
    case "sqlite-native":
    default:
      return "/rag/sqlite-native";
  }
};

export const createRAGBackends = (opts: RAGStoreOptions & { postgresUrl?: string }) => {
  const sqliteNative = createSQLiteNativeRAG(opts);
  const sqliteFallback = createSQLiteFallbackRAG(opts);
  const postgresUrl = typeof opts.postgresUrl === "string" ? opts.postgresUrl.trim() : "";

  const backends: Record<DemoBackendMode, DemoRAGBackend> = {
    "sqlite-native": {
      id: "sqlite-native",
      label: "SQLite Native",
      path: getBackendPath("sqlite-native"),
      available: true,
      rag: sqliteNative,
    },
    "sqlite-fallback": {
      id: "sqlite-fallback",
      label: "SQLite Fallback",
      path: getBackendPath("sqlite-fallback"),
      available: true,
      rag: sqliteFallback,
    },
    postgres:
      postgresUrl.length > 0
        ? {
            id: "postgres",
            label: "PostgreSQL",
            path: getBackendPath("postgres"),
            available: true,
            rag: createPostgresDemoRAG(postgresUrl),
          }
        : {
            id: "postgres",
            label: "PostgreSQL",
            path: getBackendPath("postgres"),
            available: false,
            reason:
              "Set RAG_POSTGRES_URL or DATABASE_URL to enable the PostgreSQL pgvector backend.",
          },
  };

  const list = (): DemoBackendDescriptor[] =>
    RAG_DEMO_BACKEND_ORDER.map((id) => {
      const backend = backends[id];
      return {
        id: backend.id,
        label: backend.label,
        path: backend.path,
        available: backend.available,
        reason: backend.reason,
      };
    });

  const active = (): DemoRAGBackend[] => list().flatMap((descriptor) => {
    const backend = backends[descriptor.id];
    return backend.available && backend.rag ? [backend] : [];
  });

  return {
    backends,
    defaultMode: DEFAULT_BACKEND_MODE,
    list,
    active,
  };
};

export const seedRAGStore = async (
  ragStore: RAGVectorStore,
  documents: RagSeedDocument[],
) => {
  const upsert = buildRAGUpsertInputFromDocuments({
    documents: documents.map((document) => {
      const kind = document.kind ?? "seed";
      const strategy = document.chunkStrategy ?? (kind === "seed" ? DEFAULT_SEED_STRATEGY : DEFAULT_CUSTOM_STRATEGY);
      const maxChunkLength = kind === "seed"
        ? RAG_DEMO_DEFAULT_CHUNK_SIZE
        : RAG_DEMO_DEFAULT_CUSTOM_CHUNK_SIZE;

      return {
        format: document.format,
        id: document.id,
        metadata: {
          ...(document.metadata ?? {}),
          documentId: document.id,
          kind,
        },
        source: document.source,
        text: document.text,
        title: document.title,
        chunking: createChunkingDefaults(strategy, maxChunkLength),
      } satisfies RAGIngestDocument;
    }),
  });

  await ragStore.upsert(upsert);

  return upsert.chunks.length;
};

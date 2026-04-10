import { file } from "bun";
import { Database } from "bun:sqlite";
import { networking, prepare } from "@absolutejs/absolute";
import {
  buildRAGAnswerGroundingCaseDifficultyLeaderboard,
  buildRAGContext,
  compareRAGRetrievalStrategies,
  compareRAGRerankers,
  createRAGFileAnswerGroundingCaseDifficultyHistoryStore,
  createRAGFileAnswerGroundingEvaluationHistoryStore,
  createRAGFileEvaluationHistoryStore,
  evaluateRAGAnswerGrounding,
  loadRAGAnswerGroundingCaseDifficultyHistory,
  loadRAGAnswerGroundingEvaluationHistory,
  loadRAGEvaluationHistory,
  persistRAGAnswerGroundingCaseDifficultyRun,
  persistRAGAnswerGroundingEvaluationRun,
  persistRAGEvaluationSuiteRun,
  createRAGSyncScheduler,
  createHeuristicRAGQueryTransform,
  createHeuristicRAGReranker,
  createRAGCollection,
  createRAGHTMXConfig,
  ragPlugin,
} from "@absolutejs/absolute/ai";
import { join } from "node:path";
import { Elysia, status } from "elysia";
import { createDemoAIProviderCatalog } from "./handlers/ragAiProvider";
import { createHtmxAIStreamRenderConfig, createHtmxWorkflowRenderConfig, renderHtmxOpsPanel, renderHtmxQualityPanel } from "./handlers/htmxRagWorkflow";
import { createRAGBackends } from "./handlers/ragBackends";
import { ragDemoExtractors } from "./handlers/ragDemoExtractors";
import { createRagDemoState } from "./handlers/ragDemoState";
import { pagesPlugin } from "./plugins/pagesPlugin";
import {
  type DemoBackendMode,
  type DemoFrameworkId,
  type DemoGroundingProviderComparison,
  type DemoRetrievalQualityResponse,
  buildDemoEvaluationInput,
  buildDemoEvaluationSuite,
  buildDemoUploadIngestInput,
  getDemoUploadPreset,
  isBackendMode,
  isFrameworkId,
} from "../frontend/demo-backends";

const { absolutejs, manifest } = await prepare();

const ragDb = new Database("./rag-store.sqlite");
ragDb.exec(`
  CREATE TABLE IF NOT EXISTS demo_ui_state (
    scope TEXT NOT NULL,
    id TEXT NOT NULL,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (scope, id)
  )
`);
const postgresUrl = process.env.RAG_POSTGRES_URL ?? process.env.DATABASE_URL;
const ragBackends = createRAGBackends({
  path: "./rag-store.sqlite",
  db: ragDb,
  postgresUrl,
});
const ragDemoState = createRagDemoState({ ragDb, ragBackends });
const demoAIProvider = createDemoAIProviderCatalog();
const indexManager = ragDemoState.createIndexManager();
const syncScheduler = createRAGSyncScheduler({
  manager: {
    ...indexManager,
    syncAllSources: (options) => indexManager.syncAllSources({ ...(options ?? {}), background: true }),
    syncSource: (id, options) => indexManager.syncSource(id, { ...(options ?? {}), background: true }),
  },
  schedules: [
    {
      id: "directory-sync",
      label: "Directory sync fixtures",
      sourceIds: ["sync-directory"],
      intervalMs: 15_000,
      runImmediately: true,
    },
  ],
});
const startup = await ragDemoState.initialize();
await syncScheduler.start();
const demoReranker = createHeuristicRAGReranker();
const demoQueryTransform = createHeuristicRAGQueryTransform();
const qualityHistoryRoot = join(process.cwd(), ".absolute", "quality-history");

const createQualityHistoryStore = (mode: DemoBackendMode, kind: string, id: string) =>
  createRAGFileEvaluationHistoryStore(join(qualityHistoryRoot, mode, `${kind}-${id}.json`));
const createGroundingHistoryStore = (mode: DemoBackendMode, kind: string, id: string) =>
  createRAGFileAnswerGroundingEvaluationHistoryStore(join(qualityHistoryRoot, mode, `${kind}-${id}.json`));
const createGroundingDifficultyHistoryStore = (mode: DemoBackendMode, id: string) =>
  createRAGFileAnswerGroundingCaseDifficultyHistoryStore(join(qualityHistoryRoot, mode, `provider-grounding-difficulty-${id}.json`));

const buildGroundingAnswerDetail = (metadata?: Record<string, unknown>) => {
  if (typeof metadata?.page === "number") {
    return `page ${metadata.page}`;
  }
  if (typeof metadata?.sheetName === "string") {
    return `sheet ${metadata.sheetName}`;
  }
  if (typeof metadata?.slideNumber === "number") {
    return `slide ${metadata.slideNumber}`;
  }
  if (typeof metadata?.startMs === "number") {
    return `timestamp ${(metadata.startMs / 1000).toFixed(0)}s`;
  }
  if (typeof metadata?.threadTopic === "string") {
    return `thread ${metadata.threadTopic}`;
  }
  if (typeof metadata?.archiveEntryPath === "string") {
    return `archive entry ${metadata.archiveEntryPath}`;
  }

  return "retrieved evidence";
};

const getRecentQueryStateId = (framework: DemoFrameworkId, mode: DemoBackendMode) =>
  `${framework}:${mode}`;

const readUIState = ragDb.query<
  { value: string },
  [string, string]
>("SELECT value FROM demo_ui_state WHERE scope = ?1 AND id = ?2");

const writeUIState = ragDb.query<
  never,
  [string, string, string, number]
>(`
  INSERT INTO demo_ui_state (scope, id, value, updated_at)
  VALUES (?1, ?2, ?3, ?4)
  ON CONFLICT(scope, id) DO UPDATE SET
    value = excluded.value,
    updated_at = excluded.updated_at
`);

const buildProviderGroundingComparison = async ({
  collection,
  suite,
}: {
  collection: ReturnType<typeof createRAGCollection>;
  suite: ReturnType<typeof buildDemoEvaluationSuite>;
}): Promise<DemoGroundingProviderComparison | null> => {
  if (!demoAIProvider || demoAIProvider.models.length === 0) {
    return null;
  }

  const providerCandidates = Array.from(
    new Map(
      demoAIProvider.models.map((model) => [model.providerId, model] as const),
    ).values(),
  );

  if (providerCandidates.length === 0) {
    return null;
  }

  const entries = await Promise.all(
    providerCandidates.map(async (model) => {
      const startedAt = performance.now();
      let response;
      try {
        const provider = demoAIProvider.provider(model.providerId);
        response = evaluateRAGAnswerGrounding({
          cases: await Promise.all(
            suite.input.cases.map(async (caseInput) => {
              const results = await collection.search({
                query: caseInput.query,
                topK: caseInput.topK ?? suite.input.topK ?? 4,
                retrieval: "hybrid",
                queryTransform: demoQueryTransform,
                rerank: demoReranker,
              });
              const prompt = `Question: ${caseInput.query}\n\n${buildRAGContext(results)}\n\nAnswer in one or two sentences. Use only the provided context. Cite every claim inline with [1], [2].`;
              let answer = "";

              for await (const chunk of provider.stream({
                model: model.modelId,
                messages: [{ role: "user", content: prompt }],
                systemPrompt:
                  "You are evaluating RAG grounding quality. Use only provided context and keep citations precise.",
              })) {
                if (chunk.type === "text") {
                  answer += chunk.content;
                }
              }

              return {
                answer: answer.trim() || "No provider answer was returned.",
                expectedChunkIds: caseInput.expectedChunkIds,
                expectedDocumentIds: caseInput.expectedDocumentIds,
                expectedSources: caseInput.expectedSources,
                id: caseInput.id,
                label: caseInput.label,
                query: caseInput.query,
                sources: results.map((result) => ({
                  chunkId: result.chunkId,
                  metadata: result.metadata,
                  score: result.score,
                  source: result.source,
                  text: result.chunkText,
                  title: result.title,
                })),
              };
            }),
          ),
        });
      } catch (error) {
        response = evaluateRAGAnswerGrounding({
          cases: suite.input.cases.map((caseInput) => ({
            answer: `Provider generation failed: ${error instanceof Error ? error.message : String(error)}`,
            expectedChunkIds: caseInput.expectedChunkIds,
            expectedDocumentIds: caseInput.expectedDocumentIds,
            expectedSources: caseInput.expectedSources,
            id: caseInput.id,
            label: caseInput.label,
            query: caseInput.query,
            sources: [],
          })),
        });
      }
      const elapsedMs = performance.now() - startedAt;

      return {
        elapsedMs,
        label: `${model.providerLabel} · ${model.label}`,
        modelId: model.modelId,
        providerId: model.providerId,
        providerKey: model.key,
        providerLabel: model.providerLabel,
        response,
      };
    }),
  );

  const byPassingRate = [...entries].sort((left, right) => {
    if (right.response.passingRate !== left.response.passingRate) {
      return right.response.passingRate - left.response.passingRate;
    }
    if (
      right.response.summary.averageCitationF1 !==
      left.response.summary.averageCitationF1
    ) {
      return (
        right.response.summary.averageCitationF1 -
        left.response.summary.averageCitationF1
      );
    }

    return left.elapsedMs - right.elapsedMs;
  });
  const byCitationF1 = [...entries].sort(
    (left, right) =>
      right.response.summary.averageCitationF1 -
      left.response.summary.averageCitationF1,
  );
  const byResolvedRate = [...entries].sort(
    (left, right) =>
      right.response.summary.averageResolvedCitationRate -
      left.response.summary.averageResolvedCitationRate,
  );
  const byLatency = [...entries].sort((left, right) => left.elapsedMs - right.elapsedMs);

  const caseComparisons = suite.input.cases.map((caseInput) => {
    const caseEntries = entries.map((entry) => {
      const result = entry.response.cases.find((candidate) => candidate.caseId === caseInput.id);
      return {
        providerKey: entry.providerKey,
        label: entry.label,
        status: result?.status ?? "fail",
        coverage: result?.coverage ?? "ungrounded",
        citationF1: result?.citationF1 ?? 0,
        resolvedCitationRate: result?.resolvedCitationRate ?? 0,
        matchedIds: result?.matchedIds ?? [],
        missingIds: result?.missingIds ?? [],
        extraIds: result?.extraIds ?? [],
        answerExcerpt: result?.answer ?? "No provider answer was returned.",
      };
    });
    const statusRank = (status: "pass" | "partial" | "fail") => status === "pass" ? 2 : status === "partial" ? 1 : 0;
    const byStatus = [...caseEntries].sort((left, right) => {
      if (statusRank(right.status) != statusRank(left.status)) {
        return statusRank(right.status) - statusRank(left.status);
      }
      if (right.citationF1 !== left.citationF1) {
        return right.citationF1 - left.citationF1;
      }
      return right.resolvedCitationRate - left.resolvedCitationRate;
    });
    const byCitationF1 = [...caseEntries].sort((left, right) => right.citationF1 - left.citationF1);
    const byResolvedRate = [...caseEntries].sort((left, right) => right.resolvedCitationRate - left.resolvedCitationRate);

    return {
      caseId: caseInput.id,
      entries: caseEntries,
      label: caseInput.label ?? caseInput.id,
      summary: {
        bestByCitationF1: byCitationF1[0]?.providerKey,
        bestByResolvedCitationRate: byResolvedRate[0]?.providerKey,
        bestByStatus: byStatus[0]?.providerKey,
      },
    };
  });

  return {
    caseComparisons,
    difficultyLeaderboard: buildRAGAnswerGroundingCaseDifficultyLeaderboard(entries),
    entries,
    summary: {
      bestByAverageCitationF1: byCitationF1[0]?.providerKey,
      bestByPassingRate: byPassingRate[0]?.providerKey,
      bestByResolvedCitationRate: byResolvedRate[0]?.providerKey,
      fastest: byLatency[0]?.providerKey,
    },
  };
};

const persistQualityHistories = async <TEntry extends { label: string; response: { elapsedMs: number } }>(
  mode: DemoBackendMode,
  suite: ReturnType<typeof buildDemoEvaluationSuite>,
  kind: string,
  entries: TEntry[],
  getId: (entry: TEntry) => string,
) =>
  Object.fromEntries(
    await Promise.all(
      entries.map(async (entry) => {
        const id = getId(entry);
        const finishedAt = Date.now();
        const suiteId = `${suite.id}:${kind}:${id}`;
        const store = createQualityHistoryStore(mode, kind, id);
        await persistRAGEvaluationSuiteRun({
          store,
          run: {
            id: crypto.randomUUID(),
            suiteId,
            label: entry.label,
            startedAt: finishedAt - entry.response.elapsedMs,
            finishedAt,
            elapsedMs: entry.response.elapsedMs,
            response: entry.response as never,
            metadata: {
              backendMode: mode,
              benchmarkKind: kind,
              candidateId: id,
            },
          },
        });

        return [
          id,
          await loadRAGEvaluationHistory({
            store,
            suite: {
              id: suiteId,
              label: `${entry.label} benchmark history`,
              input: suite.input,
            },
            limit: 8,
          }),
        ] as const;
      }),
    ),
  );

const persistProviderGroundingHistories = async (
  mode: DemoBackendMode,
  suite: ReturnType<typeof buildDemoEvaluationSuite>,
  entries: DemoGroundingProviderComparison["entries"],
) =>
  Object.fromEntries(
    await Promise.all(
      entries.map(async (entry) => {
        const finishedAt = Date.now();
        const suiteId = `${suite.id}:provider-grounding:${entry.providerKey}`;
        const store = createGroundingHistoryStore(mode, "provider-grounding", entry.providerKey);
        await persistRAGAnswerGroundingEvaluationRun({
          store,
          run: {
            id: crypto.randomUUID(),
            suiteId,
            label: entry.label,
            startedAt: finishedAt - entry.elapsedMs,
            finishedAt,
            elapsedMs: entry.elapsedMs,
            response: entry.response,
            metadata: {
              backendMode: mode,
              benchmarkKind: "provider-grounding",
              candidateId: entry.providerKey,
              modelId: entry.modelId,
              providerId: entry.providerId,
            },
          },
        });

        return [
          entry.providerKey,
          await loadRAGAnswerGroundingEvaluationHistory({
            store,
            suite: {
              id: suiteId,
              label: `${entry.label} provider grounding history`,
            },
            limit: 8,
          }),
        ] as const;
      }),
    ),
  );

const persistProviderGroundingDifficultyHistory = async (
  mode: DemoBackendMode,
  suite: ReturnType<typeof buildDemoEvaluationSuite>,
  comparison: DemoGroundingProviderComparison,
) => {
  const finishedAt = Date.now();
  const suiteId = `${suite.id}:provider-grounding:difficulty`;
  const store = createGroundingDifficultyHistoryStore(mode, "leaderboard");
  await persistRAGAnswerGroundingCaseDifficultyRun({
    store,
    run: {
      id: crypto.randomUUID(),
      suiteId,
      label: "Provider grounding difficulty",
      startedAt: finishedAt,
      finishedAt,
      entries: comparison.difficultyLeaderboard,
      metadata: {
        backendMode: mode,
        benchmarkKind: "provider-grounding-difficulty",
      },
    },
  });

  return loadRAGAnswerGroundingCaseDifficultyHistory({
    store,
    suite: {
      id: suiteId,
      label: "Provider grounding difficulty history",
    },
    limit: 8,
  });
};

const buildDemoQualityResponse = async (mode: DemoBackendMode): Promise<DemoRetrievalQualityResponse> => {
  const backend = ragBackends.backends[mode];
  const suite = buildDemoEvaluationSuite();
  const collection = createRAGCollection({ store: backend.rag!.store });
  const rerankerComparison = await compareRAGRerankers({
    collection,
    rerankers: [
      { id: "vector-order", label: "Vector order only" },
      { id: "absolute-heuristic", label: "Absolute heuristic", rerank: demoReranker },
    ],
    suite,
  });
  const retrievalComparison = await compareRAGRetrievalStrategies({
    collection,
    retrievals: [
      { id: "vector", label: "Vector retrieval", retrieval: "vector" },
      { id: "hybrid", label: "Hybrid fusion", retrieval: "hybrid" },
      { id: "hybrid-transform", label: "Hybrid + query transform", retrieval: "hybrid", queryTransform: demoQueryTransform },
    ],
    suite,
  });
  const groundingEvaluation = evaluateRAGAnswerGrounding({
    cases: await Promise.all(
      suite.input.cases.map(async (caseInput) => {
        const results = await collection.search({
          query: caseInput.query,
          topK: caseInput.topK ?? suite.input.topK ?? 4,
          retrieval: "hybrid",
          queryTransform: demoQueryTransform,
          rerank: demoReranker,
        });
        const bestResult = results[0];
        const answer =
          bestResult
            ? `${bestResult.title ?? bestResult.source ?? bestResult.chunkId} supports this answer with ${buildGroundingAnswerDetail(bestResult.metadata)} [1].`
            : "No retrieved evidence was available for this answer.";

        return {
          answer,
          expectedChunkIds: caseInput.expectedChunkIds,
          expectedDocumentIds: caseInput.expectedDocumentIds,
          expectedSources: caseInput.expectedSources,
          id: caseInput.id,
          label: caseInput.label,
          query: caseInput.query,
          sources: results.map((result) => ({
            chunkId: result.chunkId,
            metadata: result.metadata,
            score: result.score,
            source: result.source,
            text: result.chunkText,
            title: result.title,
          })),
        };
      }),
    ),
  });
  const providerGroundingComparison = await buildProviderGroundingComparison({
    collection,
    suite,
  });
  const retrievalHistories = await persistQualityHistories(mode, suite, "retrieval", retrievalComparison.entries, (entry) => entry.retrievalId);
  const rerankerHistories = await persistQualityHistories(mode, suite, "reranker", rerankerComparison.entries, (entry) => entry.rerankerId);
  const providerGroundingHistories = providerGroundingComparison
    ? await persistProviderGroundingHistories(mode, suite, providerGroundingComparison.entries)
    : {};
  const providerGroundingDifficultyHistory = providerGroundingComparison
    ? await persistProviderGroundingDifficultyHistory(mode, suite, providerGroundingComparison)
    : undefined;

  return {
    suite,
    comparison: rerankerComparison,
    groundingEvaluation,
    providerGroundingComparison,
    providerGroundingDifficultyHistory,
    providerGroundingHistories,
    retrievalComparison,
    rerankerComparison,
    retrievalHistories,
    rerankerHistories,
  };
};

process.once("exit", () => {
  syncScheduler.stop();
});

const server = new Elysia()
  .use(absolutejs)
  .use(pagesPlugin(manifest, { backends: ragBackends.list() }));

for (const backend of ragBackends.active()) {
  server.use(
    ragPlugin({
      path: backend.path,
      parseProvider: demoAIProvider?.parseMessage,
      provider: demoAIProvider?.provider ?? ragDemoState.unavailableProvider,
      readinessProviderName: demoAIProvider ? "runtime AI provider registry" : "demo fallback provider",
      model: (providerName) => demoAIProvider?.defaultModel(providerName) ?? "gpt-4.1-mini",
      collection: createRAGCollection({
        store: backend.rag!.store,
        rerank: demoReranker,
      }),
      extractors: ragDemoExtractors,
      indexManager,
      htmx: createRAGHTMXConfig({
        render: createHtmxAIStreamRenderConfig(),
        workflowRender: createHtmxWorkflowRenderConfig(backend.path),
      }),
    }),
  );
}

server
  .get("/demo/sync-fixtures/workflow-source.md", () =>
    new Response(
      "# URL Sync Workflow Source\n\nURL sync keeps the same AbsoluteJS knowledge base fresh when remote source content changes.\n\nThe synced URL should appear in the indexed source list and the knowledge-base operations panel after a sync run.\n",
      {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
        },
      },
    ),
  )
  .get("/demo/ai-models", () => ({
    defaultModelKey: demoAIProvider?.defaultModelKey ?? null,
    models: demoAIProvider?.models ?? [],
  }))
  .get("/demo/ui-state/recent-queries/:framework/:mode", ({ params }) => {
    if (!isFrameworkId(params.framework)) {
      return status(400, "Invalid framework id");
    }

    if (!isBackendMode(params.mode)) {
      return status(400, "Invalid backend mode");
    }

    const state = readUIState.get("recent-queries", getRecentQueryStateId(params.framework, params.mode));
    if (!state) {
      return [];
    }

    try {
      const parsed = JSON.parse(state.value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })
  .post("/demo/ui-state/recent-queries/:framework/:mode", async ({ params, request }) => {
    if (!isFrameworkId(params.framework)) {
      return status(400, "Invalid framework id");
    }

    if (!isBackendMode(params.mode)) {
      return status(400, "Invalid backend mode");
    }

    const payload = await request.json().catch(() => null);
    if (!Array.isArray(payload)) {
      return status(400, "Invalid recent query payload");
    }

    writeUIState.run(
      "recent-queries",
      getRecentQueryStateId(params.framework, params.mode),
      JSON.stringify(payload),
      Date.now(),
    );
    return { ok: true };
  })
  .get("/demo/ui-state/active-retrieval/:framework/:mode", ({ params }) => {
    if (!isFrameworkId(params.framework)) {
      return status(400, "Invalid framework id");
    }

    if (!isBackendMode(params.mode)) {
      return status(400, "Invalid backend mode");
    }

    const state = readUIState.get("active-retrieval", getRecentQueryStateId(params.framework, params.mode));
    if (!state) {
      return null;
    }

    try {
      return JSON.parse(state.value);
    } catch {
      return null;
    }
  })
  .post("/demo/ui-state/active-retrieval/:framework/:mode", async ({ params, request }) => {
    if (!isFrameworkId(params.framework)) {
      return status(400, "Invalid framework id");
    }

    if (!isBackendMode(params.mode)) {
      return status(400, "Invalid backend mode");
    }

    const payload = await request.json().catch(() => null);
    if (!payload || typeof payload !== "object") {
      return status(400, "Invalid active retrieval payload");
    }

    writeUIState.run(
      "active-retrieval",
      getRecentQueryStateId(params.framework, params.mode),
      JSON.stringify(payload),
      Date.now(),
    );
    return { ok: true };
  })
  .get("/demo/ai-models/htmx", () => {
    const models = demoAIProvider?.models ?? [];
    const defaultModelKey = demoAIProvider?.defaultModelKey ?? "";
    if (models.length === 0) {
      return '<div id="stream-model-picker"><p class="demo-error">Configure an AI provider to enable retrieval streaming.</p></div>';
    }

    return [
      '<div id="stream-model-picker">',
      '<label for="stream-model-key">Answer model</label>',
      '<select id="stream-model-key" name="modelKey">',
      ...models.map((model) => `<option value="${model.key}"${model.key === defaultModelKey ? ' selected' : ''}>${model.providerLabel} · ${model.label}</option>`),
      '</select>',
      '<p class="demo-metadata">Model switching stays on the official AbsoluteJS plugin path by selecting the provider and model sent with the retrieval stream request.</p>',
      '</div>',
    ].join('');
  })
  .post("/demo/message/:mode", async ({ params, request }) => {
    if (!isBackendMode(params.mode)) {
      return status(400, "Invalid backend mode");
    }

    const backend = ragBackends.backends[params.mode];
    if (!backend.available) {
      return status(503, backend.reason ?? `Backend mode ${params.mode} is not available`);
    }

    const form = await request.formData();
    const content = typeof form.get("content") === "string" ? String(form.get("content")) : "";
    const modelKey = typeof form.get("modelKey") === "string" ? String(form.get("modelKey")) : (demoAIProvider?.defaultModelKey ?? "");
    const firstColon = modelKey.indexOf(":");
    const providerId = firstColon > 0 ? modelKey.slice(0, firstColon) : "";
    const modelId = firstColon > 0 ? modelKey.slice(firstColon + 1) : "";
    const prefixedContent = providerId && modelId ? `${providerId}:${modelId}:${content}` : content;
    const body = new URLSearchParams();
    body.set("content", prefixedContent);

    const response = await server.handle(
      new Request(`http://absolute.local${backend.path}/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "HX-Request": "true",
        },
        body,
      }),
    );

    return new Response(response.body, {
      headers: response.headers,
      status: response.status,
    });
  })
  .get("/demo/quality/:mode", async ({ params }) => {
    if (!isBackendMode(params.mode)) {
      return status(400, "Invalid backend mode");
    }

    const backend = ragBackends.backends[params.mode];
    if (!backend.available) {
      return status(503, backend.reason ?? `Backend mode ${params.mode} is not available`);
    }

    return buildDemoQualityResponse(params.mode);
  })
  .get("/demo/quality/:mode/htmx", async ({ params }) => {
    if (!isBackendMode(params.mode)) {
      return status(400, "Invalid backend mode");
    }

    const backend = ragBackends.backends[params.mode];
    if (!backend.available) {
      return status(503, backend.reason ?? `Backend mode ${params.mode} is not available`);
    }

    return renderHtmxQualityPanel(await buildDemoQualityResponse(params.mode));
  })
  .post("/demo/upload/:mode/:id", async ({ params }) => {
    if (!isBackendMode(params.mode)) {
      return status(400, "Invalid backend mode");
    }

    const backend = ragBackends.backends[params.mode];
    if (!backend.available) {
      return status(503, backend.reason ?? `Backend mode ${params.mode} is not available`);
    }

    const preset = getDemoUploadPreset(params.id);
    if (!preset) {
      return status(404, `Unknown upload fixture ${params.id}`);
    }

    const bytes = await file(join(process.cwd(), "rag-demo-corpus", preset.fixturePath)).arrayBuffer();
    const base64Content = Buffer.from(new Uint8Array(bytes)).toString("base64");
    const response = await server.handle(
      new Request(`http://absolute.local${backend.path}/ingest`, {
        body: JSON.stringify(buildDemoUploadIngestInput(preset, base64Content)),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      }),
    );

    if (!response.ok) {
      return status(response.status, await response.text());
    }

    return [
      "<div id=\"upload-status\" class=\"demo-results\">",
      "<p class=\"demo-banner\">Uploaded fixture through the extractor-backed ingest route.</p>",
      "<p class=\"demo-metadata\"><strong>" + preset.label + "</strong> is now queryable through " + backend.path + ".</p>",
      "<p class=\"demo-metadata\">Verification query: " + preset.query + "</p>",
      "<p class=\"demo-metadata\">Expected uploaded source: " + preset.expectedSources.join(", ") + "</p>",
      "</div>",
    ].join("");
  })
  .get("/demo/ops/:mode", async ({ params }) => {
    if (!isBackendMode(params.mode)) {
      return status(400, "Invalid backend mode");
    }

    const backend = ragBackends.backends[params.mode];
    if (!backend.available) {
      return status(503, backend.reason ?? `Backend mode ${params.mode} is not available`);
    }

    const response = await server.handle(
      new Request(`http://absolute.local${backend.path}/ops`, {
        method: "GET",
      }),
    );

    if (!response.ok) {
      return status(response.status, await response.text());
    }

    const ops = await response.json();
    return renderHtmxOpsPanel(ops, params.mode);
  })
  .post("/demo/sync/:mode", async ({ params, request }) => {
    if (!isBackendMode(params.mode)) {
      return status(400, "Invalid backend mode");
    }

    const backend = ragBackends.backends[params.mode];
    if (!backend.available) {
      return status(503, backend.reason ?? `Backend mode ${params.mode} is not available`);
    }

    const form = await request.formData().catch(() => null);
    const background = typeof form?.get("background") === "string" && form.get("background") === "true";
    const syncResponse = await server.handle(
      new Request(`http://absolute.local${backend.path}/sync`, {
        body: background ? JSON.stringify({ background: true }) : undefined,
        headers: background ? { "Content-Type": "application/json" } : undefined,
        method: "POST",
      }),
    );

    if (!syncResponse.ok) {
      return status(syncResponse.status, await syncResponse.text());
    }

    const opsResponse = await server.handle(
      new Request(`http://absolute.local${backend.path}/ops`, {
        method: "GET",
      }),
    );

    if (!opsResponse.ok) {
      return status(opsResponse.status, await opsResponse.text());
    }

    const summary = background ? 'Queued background sync for all sources.' : 'Synced all configured sources.';
    return [
      '<div id="mutation-status" hx-swap-oob="innerHTML">',
      '<div class="demo-results">',
      `<p class="demo-banner">${summary}</p>`,
      '<ul class="demo-detail-list">',
      '<li>Knowledge base operations refreshed with the latest sync state.</li>',
      '<li>Diagnostics and indexed sources continue to refresh automatically on this route.</li>',
      '</ul>',
      '</div>',
      '</div>',
      '<div id="htmx-ops" hx-swap-oob="innerHTML">',
      renderHtmxOpsPanel(await opsResponse.json(), params.mode),
      '</div>',
    ].join('');
  })
  .post("/demo/sync/:mode/:id", async ({ params, request }) => {
    if (!isBackendMode(params.mode)) {
      return status(400, "Invalid backend mode");
    }

    const backend = ragBackends.backends[params.mode];
    if (!backend.available) {
      return status(503, backend.reason ?? `Backend mode ${params.mode} is not available`);
    }

    const form = await request.formData().catch(() => null);
    const background = typeof form?.get("background") === "string" && form.get("background") === "true";
    const syncResponse = await server.handle(
      new Request(`http://absolute.local${backend.path}/sync/${encodeURIComponent(params.id)}`, {
        body: background ? JSON.stringify({ background: true }) : undefined,
        headers: background ? { "Content-Type": "application/json" } : undefined,
        method: "POST",
      }),
    );

    if (!syncResponse.ok) {
      return status(syncResponse.status, await syncResponse.text());
    }

    const opsResponse = await server.handle(
      new Request(`http://absolute.local${backend.path}/ops`, {
        method: "GET",
      }),
    );

    if (!opsResponse.ok) {
      return status(opsResponse.status, await opsResponse.text());
    }

    const summary = background ? `Queued ${params.id} for background sync.` : `Synced ${params.id}.`;
    return [
      '<div id="mutation-status" hx-swap-oob="innerHTML">',
      '<div class="demo-results">',
      `<p class="demo-banner">${summary}</p>`,
      '<ul class="demo-detail-list">',
      '<li>Knowledge base operations refreshed with the latest source-level sync state.</li>',
      '<li>Diagnostics and indexed sources continue to refresh automatically on this route.</li>',
      '</ul>',
      '</div>',
      '</div>',
      '<div id="htmx-ops" hx-swap-oob="innerHTML">',
      renderHtmxOpsPanel(await opsResponse.json(), params.mode),
      '</div>',
    ].join('');
  })
  .post("/demo/evaluate/:mode", async ({ params }) => {
    if (!isBackendMode(params.mode)) {
      return status(400, "Invalid backend mode");
    }

    const backend = ragBackends.backends[params.mode];
    if (!backend.available) {
      return status(503, backend.reason ?? `Backend mode ${params.mode} is not available`);
    }

    return server.handle(
      new Request(`http://absolute.local${backend.path}/evaluate`, {
        body: JSON.stringify(buildDemoEvaluationInput()),
        headers: {
          "Content-Type": "application/json",
          "HX-Request": "true",
        },
        method: "POST",
      }),
    );
  })
  .use(networking)
  .on("error", (error) => {
    const { request } = error;
    console.error(`Server error on ${request.method} ${request.url}: ${error.message}`);
  });

export type Server = typeof server;

console.log(
  `RAG seed complete: ${Object.entries(startup.startupStatus)
    .map(([mode, value]) => `${mode}=${value.chunkCount} chunks/${value.elapsedMs}ms`)
    .join(", ")} total docs: ${startup.seedDocs.length} overall startup ${startup.startupSeedTime}ms`,
);

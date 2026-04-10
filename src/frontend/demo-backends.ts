import type {
  RAGAdminActionRecord,
  RAGAdminJobRecord,
  RAGAnswerGroundingEvaluationCaseResult,
  RAGAnswerGroundingEvaluationHistory,
  RAGAnswerGroundingEvaluationCaseDifficultyEntry,
  RAGAnswerGroundingEvaluationLeaderboardEntry,
  RAGAnswerGroundingEvaluationResponse,
  RAGCorpusHealth,
  RAGCitation,
  RAGEvaluationCaseResult,
  RAGEvaluationHistory,
  RAGEvaluationInput,
  RAGEvaluationLeaderboardEntry,
  RAGEvaluationResponse,
  RAGEvaluationSuite,
  RAGRerankerComparison,
  RAGRerankerComparisonEntry,
  RAGBackendCapabilities,
  RAGDocumentChunk,
  RAGDocumentUploadIngestInput,
  RAGExtractorReadiness,
  RAGGroundedAnswer,
  RAGGroundedAnswerPart,
  RAGGroundingReference,
  RAGSource,
  RAGSourceSummary,
  RAGSyncSourceRecord,
  RAGVectorStoreStatus,
} from "@absolutejs/absolute";
import type {
  RAGAnswerGroundingCaseDifficultyHistory,
  RAGRetrievalComparison,
  RAGRetrievalComparisonEntry,
} from "@absolutejs/absolute/ai";
import { createRAGEvaluationSuite } from "@absolutejs/absolute/ai/client";

export type RagDocumentKind = "seed" | "custom";
export type DemoBackendMode = "sqlite-native" | "sqlite-fallback" | "postgres";
export type DemoFrameworkId = "react" | "svelte" | "vue" | "angular" | "html" | "htmx";
export type DemoContentFormat = "text" | "markdown" | "html";
export type DemoChunkingStrategy = "paragraphs" | "sentences" | "fixed" | "source_aware";

export type DemoBackendDescriptor = {
  id: DemoBackendMode;
  label: string;
  available: boolean;
  path?: string;
  reason?: string;
};

export type DemoDocument = {
  chunkCount: number;
  chunkSize: number;
  chunkStrategy: DemoChunkingStrategy;
  createdAt: number;
  format: DemoContentFormat;
  updatedAt: number;
  id: string;
  kind: RagDocumentKind;
  source: string;
  text: string;
  title: string;
  metadata?: Record<string, unknown>;
};

export type DemoChunkPreview = {
  document: Pick<
    DemoDocument,
    "id" | "title" | "source" | "kind" | "format" | "chunkStrategy" | "chunkSize"
  >;
  normalizedText: string;
  chunks: RAGDocumentChunk[];
};

export type DemoStatusView = {
  backend: string;
  capabilities: string[];
  chunkCount: number;
  dimensions?: number;
  documents: {
    total: number;
    byKind: Record<RagDocumentKind, number>;
  };
  native: {
    active: boolean;
    fallbackReason?: string;
    sourceLabel?: string;
  };
  reranker: {
    label: string;
    summary: string;
  };
  vectorMode: string;
  vectorModeMessage: string;
};

export type SearchResultChunk = {
  chunkId: string;
  title: string;
  source: string;
  score: number;
  metadata: Record<string, unknown>;
  text: string;
};

export type SearchResponse = {
  query: string;
  elapsedMs: number;
  topK: number;
  count: number;
  chunks: SearchResultChunk[];
  filter: Record<string, string>;
};

export type SearchFormState = {
  query: string;
  topK: number;
  scoreThreshold: string;
  kind: "" | RagDocumentKind;
  source: string;
  documentId: string;
};

export type DemoActiveRetrievalState = {
  searchForm: SearchFormState;
  scopeDriver: string;
  lastUpdatedAt?: number;
  retrievalPresetId?: string;
  benchmarkPresetId?: string;
  uploadPresetId?: string;
  streamModelKey?: string;
  streamPrompt?: string;
};

export type AddFormState = {
  id: string;
  title: string;
  source: string;
  format: DemoContentFormat;
  chunkStrategy: DemoChunkingStrategy;
  text: string;
};

export type DemoEvaluationPreset = {
  id: string;
  label: string;
  description: string;
  query: string;
  expectedSources: string[];
};

export type DemoUploadPreset = {
  id: string;
  label: string;
  description: string;
  fileName: string;
  fixturePath: string;
  contentType: string;
  query: string;
  expectedSources: string[];
  source: string;
  title: string;
};

export type DemoAIModelOption = {
  key: string;
  providerId: string;
  providerLabel: string;
  modelId: string;
  label: string;
};

export type DemoAIModelCatalogResponse = {
  defaultModelKey: string | null;
  models: DemoAIModelOption[];
};

export type DemoRetrievalQualityResponse = {
  suite: RAGEvaluationSuite;
  comparison: RAGRerankerComparison;
  retrievalComparison: RAGRetrievalComparison;
  rerankerComparison: RAGRerankerComparison;
  groundingEvaluation: RAGAnswerGroundingEvaluationResponse;
  providerGroundingComparison: DemoGroundingProviderComparison | null;
  providerGroundingHistories: Record<string, RAGAnswerGroundingEvaluationHistory>;
  providerGroundingDifficultyHistory?: RAGAnswerGroundingCaseDifficultyHistory;
  retrievalHistories: Record<string, RAGEvaluationHistory>;
  rerankerHistories: Record<string, RAGEvaluationHistory>;
};

export type DemoGroundingProviderEntry = {
  providerKey: string;
  providerId: string;
  providerLabel: string;
  modelId: string;
  label: string;
  elapsedMs: number;
  response: RAGAnswerGroundingEvaluationResponse;
};

export type DemoGroundingProviderCaseEntry = {
  providerKey: string;
  label: string;
  status: RAGAnswerGroundingEvaluationCaseResult["status"];
  coverage: RAGAnswerGroundingEvaluationCaseResult["coverage"];
  citationF1: number;
  resolvedCitationRate: number;
  matchedIds: string[];
  missingIds: string[];
  extraIds: string[];
  answerExcerpt: string;
};

export type DemoGroundingProviderCaseComparison = {
  caseId: string;
  label: string;
  entries: DemoGroundingProviderCaseEntry[];
  summary: {
    bestByStatus?: string;
    bestByCitationF1?: string;
    bestByResolvedCitationRate?: string;
  };
};

export type DemoGroundingProviderComparison = {
  entries: DemoGroundingProviderEntry[];
  caseComparisons: DemoGroundingProviderCaseComparison[];
  difficultyLeaderboard: RAGAnswerGroundingEvaluationCaseDifficultyEntry[];
  summary: {
    bestByPassingRate?: string;
    bestByAverageCitationF1?: string;
    bestByResolvedCitationRate?: string;
    fastest?: string;
  };
};

export const demoContentFormats: DemoContentFormat[] = ["markdown", "html", "text"];
export const demoChunkingStrategies: DemoChunkingStrategy[] = [
  "source_aware",
  "paragraphs",
  "sentences",
  "fixed",
];

export const demoFrameworks: Array<{ id: DemoFrameworkId; label: string }> = [
  { id: "react", label: "React" },
  { id: "svelte", label: "Svelte" },
  { id: "vue", label: "Vue" },
  { id: "angular", label: "Angular" },
  { id: "html", label: "HTML" },
  { id: "htmx", label: "HTMX" },
];

export const demoBackends: DemoBackendDescriptor[] = [
  { id: "sqlite-native", label: "SQLite Native", available: true },
  { id: "sqlite-fallback", label: "SQLite Fallback", available: true },
  { id: "postgres", label: "PostgreSQL", available: true },
];
const MAX_RECENT_QUERIES = 4;
export const DEMO_RERANKER_LABEL = "Absolute heuristic";
export const DEMO_RERANKER_SUMMARY =
  "AbsoluteJS reranks the initial vector hits with the built-in heuristic provider before rendering results.";

const isSearchFormState = (value: unknown): value is SearchFormState => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.query === "string" &&
    typeof record.topK === "number" &&
    typeof record.scoreThreshold === "string" &&
    typeof record.kind === "string" &&
    typeof record.source === "string" &&
    typeof record.documentId === "string"
  );
};

const isRecentQueryEntry = (
  value: unknown,
): value is { label: string; state: SearchFormState } => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return typeof record.label === "string" && isSearchFormState(record.state);
};

const isDemoActiveRetrievalState = (
  value: unknown,
): value is DemoActiveRetrievalState => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    isSearchFormState(record.searchForm) &&
    typeof record.scopeDriver === "string" &&
    (typeof record.lastUpdatedAt === "number" || typeof record.lastUpdatedAt === "undefined") &&
    (typeof record.retrievalPresetId === "string" || typeof record.retrievalPresetId === "undefined") &&
    (typeof record.benchmarkPresetId === "string" || typeof record.benchmarkPresetId === "undefined") &&
    (typeof record.uploadPresetId === "string" || typeof record.uploadPresetId === "undefined") &&
    (typeof record.streamModelKey === "string" || typeof record.streamModelKey === "undefined") &&
    (typeof record.streamPrompt === "string" || typeof record.streamPrompt === "undefined")
  );
};

export const getRecentQueryStateKey = (
  frameworkId: DemoFrameworkId,
  mode: DemoBackendMode,
) => `${frameworkId}:${mode}`;

export const readJsonResponse = async (response: Response) => {
  const text = await response.text();
  if (text.trim().length === 0) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
};

export const loadRecentQueries = (
  frameworkId: DemoFrameworkId,
  mode: DemoBackendMode,
): Promise<Array<{ label: string; state: SearchFormState }>> => {
  return fetch(`/demo/ui-state/recent-queries/${frameworkId}/${mode}`)
    .then(async (result) => {
      if (!result.ok) {
        return [];
      }

      const parsed = await readJsonResponse(result);
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.filter(isRecentQueryEntry).slice(0, MAX_RECENT_QUERIES);
    })
    .catch(() => []);
};

export const saveRecentQueries = (
  frameworkId: DemoFrameworkId,
  mode: DemoBackendMode,
  recentQueries: Array<{ label: string; state: SearchFormState }>,
) => {
  return fetch(`/demo/ui-state/recent-queries/${frameworkId}/${mode}`, {
      body: JSON.stringify(recentQueries.slice(0, MAX_RECENT_QUERIES)),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    })
    .then(() => undefined)
    .catch(() => undefined);
};

export const loadActiveRetrievalState = (
  frameworkId: DemoFrameworkId,
  mode: DemoBackendMode,
): Promise<DemoActiveRetrievalState | null> => {
  return fetch(`/demo/ui-state/active-retrieval/${frameworkId}/${mode}`)
    .then(async (result) => {
      if (!result.ok) {
        return null;
      }

      const parsed = await readJsonResponse(result);
      return isDemoActiveRetrievalState(parsed) ? parsed : null;
    })
    .catch(() => null);
};

export const saveActiveRetrievalState = (
  frameworkId: DemoFrameworkId,
  mode: DemoBackendMode,
  state: DemoActiveRetrievalState,
) => {
  return fetch(`/demo/ui-state/active-retrieval/${frameworkId}/${mode}`, {
      body: JSON.stringify(state),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    })
    .then(() => undefined)
    .catch(() => undefined);
};


export const buildDemoAIStreamPrompt = (modelKey: string, prompt: string) => {
  const trimmedPrompt = prompt.trim();
  if (trimmedPrompt.length === 0) {
    return trimmedPrompt;
  }

  const firstColon = modelKey.indexOf(":");
  if (firstColon <= 0) {
    return trimmedPrompt;
  }

  const providerId = modelKey.slice(0, firstColon);
  const modelId = modelKey.slice(firstColon + 1);
  if (providerId.length === 0 || modelId.length === 0) {
    return trimmedPrompt;
  }

  return `${providerId}:${modelId}:${trimmedPrompt}`;
};

export const formatDemoAIModelLabel = (model: DemoAIModelOption) =>
  `${model.providerLabel} · ${model.label}`;

export const workflowChecks = [
  "Inspect the stuffed file-backed seed corpus and verify extractor metadata across PDFs, office docs, archives, images, audio, video, EPUB, email, and legacy files.",
  "Upload first-party fixture files through the extractor-backed ingest route and verify retrieval against the uploaded source path.",
  "Ingest a custom document with a chosen format and chunking strategy.",
  "Sync local folders, URL fixtures, storage-backed objects, and provider-specific mailbox threads for Gmail, Microsoft Graph, and IMAP through the same first-class knowledge-base operations surface, then switch those mailbox tiles from fixture mode to real-account mode with env credentials without changing the UI or ingestion workflow.",
  "Run retrieval and verify the returned chunk text, source label, and metadata summary match the indexed source.",
  "Stream a grounded answer from the first-class workflow primitive instead of stitching transport state by hand.",
  "Run the built-in benchmark suite and compare retrieval, reranking, citations, and missing evidence on the same page.",
  "Inspect grounded-answer coverage and reference mapping so every citation number resolves to concrete evidence.",
  "Review knowledge-base operations health, extractor readiness, and recent admin jobs from the first-class ops surface.",
];

export const demoEvaluationPresets: DemoEvaluationPreset[] = [
  {
    id: "support-policy-source",
    label: "Support policy benchmark",
    description: "Proves the benchmark can pin a customer-facing answer back to the markdown policy source.",
    query: "List support policies for shipping and returns.",
    expectedSources: ["guide/demo.md"],
  },
  {
    id: "metadata-discipline-source",
    label: "Metadata discipline benchmark",
    description: "Verifies metadata guidance resolves to the dedicated metadata guide instead of a nearby chunk.",
    query: "Why should metadata be stable?",
    expectedSources: ["guides/metadata.md"],
  },
  {
    id: "postgres-portability-source",
    label: "PostgreSQL parity benchmark",
    description: "Shows the hosted PostgreSQL backend returns the same cross-framework workflow guidance as the local adapters.",
    query: "Which frameworks stay aligned in the retrieval workflow?",
    expectedSources: ["guide/welcome.md"],
  },
  {
    id: "pdf-citation-source",
    label: "PDF page provenance benchmark",
    description: "Verifies native PDF extraction returns page-aware evidence so the answer can point back to the exact handbook page.",
    query: "Which PDF page says page-aware evidence should remain inspectable in retrieval diagnostics?",
    expectedSources: ["files/native-handbook.pdf"],
  },
  {
    id: "ocr-fallback-source",
    label: "OCR receipt benchmark",
    description: "Verifies scanned PDF OCR keeps receipt evidence retrievable with explicit provenance through the same workflow surface.",
    query: "Which scanned PDF receipt contains invoice INV-2048?",
    expectedSources: ["files/scanned-receipt.pdf"],
  },
  {
    id: "spreadsheet-source",
    label: "Spreadsheet benchmark",
    description: "Shows spreadsheet ingestion preserves sheet-aware evidence for retrieval and inspection.",
    query: "Which revenue forecast workbook sheet named Regional Growth tracks market expansion by territory?",
    expectedSources: ["files/revenue-forecast.xlsx"],
  },
  {
    id: "archive-source",
    label: "Archive benchmark",
    description: "Shows archive expansion keeps nested source paths stable for retrieval and evaluation.",
    query: "Which archive entry explains recovery procedures?",
    expectedSources: ["archives/support-bundle.zip#runbooks/recovery.md"],
  },
  {
    id: "media-source",
    label: "Media timestamp benchmark",
    description: "Verifies media transcripts return timestamp-aware evidence so the answer can cite the exact audio segment.",
    query: "Which daily standup audio timestamp 00:00 to 00:08 says retrieval, citations, evaluation, and ingest workflows stay aligned across every frontend?",
    expectedSources: ["files/daily-standup.mp3"],
  },
];

export const demoUploadPresets: DemoUploadPreset[] = [
  {
    id: "upload-native-pdf",
    label: "Upload native PDF",
    description: "Exercises the native PDF extractor through the published upload ingest surface.",
    fileName: "native-handbook.pdf",
    fixturePath: "files/native-handbook.pdf",
    contentType: "application/pdf",
    query: "What should remain inspectable in retrieval diagnostics?",
    expectedSources: ["uploads/native-handbook.pdf"],
    source: "uploads/native-handbook.pdf",
    title: "Uploaded native handbook PDF",
  },
  {
    id: "upload-scanned-pdf",
    label: "Upload scanned PDF",
    description: "Exercises the scanned PDF OCR fallback path through the published upload ingest surface.",
    fileName: "scanned-receipt.pdf",
    fixturePath: "files/scanned-receipt.pdf",
    contentType: "application/pdf",
    query: "Which invoice number appears in the scanned receipt?",
    expectedSources: ["uploads/scanned-receipt.pdf"],
    source: "uploads/scanned-receipt.pdf",
    title: "Uploaded scanned receipt PDF",
  },
  {
    id: "upload-spreadsheet",
    label: "Upload spreadsheet",
    description: "Exercises sheet-aware office extraction through the published upload ingest surface.",
    fileName: "revenue-forecast.xlsx",
    fixturePath: "files/revenue-forecast.xlsx",
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    query: "Which revenue forecast workbook sheet named Regional Growth tracks market expansion by territory?",
    expectedSources: ["uploads/revenue-forecast.xlsx"],
    source: "uploads/revenue-forecast.xlsx",
    title: "Uploaded revenue forecast workbook",
  },
  {
    id: "upload-presentation",
    label: "Upload deck",
    description: "Exercises slide-aware presentation extraction through the published upload ingest surface.",
    fileName: "workflow-roadmap.pptx",
    fixturePath: "files/workflow-roadmap.pptx",
    contentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    query: "Which slide explains the retrieval workflow rollout?",
    expectedSources: ["uploads/workflow-roadmap.pptx"],
    source: "uploads/workflow-roadmap.pptx",
    title: "Uploaded workflow roadmap deck",
  },
  {
    id: "upload-email",
    label: "Upload email thread",
    description: "Exercises email extraction and thread metadata through the published upload ingest surface.",
    fileName: "support-thread.eml",
    fixturePath: "files/support-thread.eml",
    contentType: "message/rfc822",
    query: "Who asked for workflow parity in the support thread?",
    expectedSources: ["uploads/support-thread.eml"],
    source: "uploads/support-thread.eml",
    title: "Uploaded support thread",
  },
  {
    id: "upload-image-ocr",
    label: "Upload image OCR",
    description: "Exercises image OCR extraction through the published upload ingest surface.",
    fileName: "receipt.jpg",
    fixturePath: "files/receipt.jpg",
    contentType: "image/jpeg",
    query: "Which invoice number appears in the receipt image?",
    expectedSources: ["uploads/receipt.jpg"],
    source: "uploads/receipt.jpg",
    title: "Uploaded receipt image",
  },
  {
    id: "upload-audio",
    label: "Upload audio",
    description: "Exercises media transcription through the published upload ingest surface.",
    fileName: "daily-standup.mp3",
    fixturePath: "files/daily-standup.mp3",
    contentType: "audio/mpeg",
    query: "Which uploaded daily standup audio timestamp 00:00 to 00:08 says retrieval, citations, evaluation, and ingest workflows stay aligned across every frontend?",
    expectedSources: ["uploads/daily-standup.mp3"],
    source: "uploads/daily-standup.mp3",
    title: "Uploaded daily standup audio",
  },
  {
    id: "upload-video",
    label: "Upload video",
    description: "Exercises video transcription through the published upload ingest surface.",
    fileName: "workflow-walkthrough.mp4",
    fixturePath: "files/workflow-walkthrough.mp4",
    contentType: "video/mp4",
    query: "Which source explains the workflow rollout checkpoint?",
    expectedSources: ["uploads/workflow-walkthrough.mp4"],
    source: "uploads/workflow-walkthrough.mp4",
    title: "Uploaded workflow walkthrough video",
  },
  {
    id: "upload-archive",
    label: "Upload archive",
    description: "Exercises archive expansion through the published upload ingest surface.",
    fileName: "support-bundle.zip",
    fixturePath: "archives/support-bundle.zip",
    contentType: "application/zip",
    query: "Which archive entry explains recovery procedures?",
    expectedSources: ["uploads/support-bundle.zip#runbooks/recovery.md"],
    source: "uploads/support-bundle.zip",
    title: "Uploaded support bundle archive",
  },
];

export const buildDemoEvaluationSuite = () =>
  createRAGEvaluationSuite({
    id: "absolutejs-rag-demo-suite",
    label: "AbsoluteJS retrieval workflow suite",
    description:
      "Saved suite covering policy docs, metadata guidance, PostgreSQL parity, PDF and OCR, spreadsheets, archives, and media transcripts.",
    input: buildDemoEvaluationInput(),
    metadata: {
      story: "retrieval-quality",
    },
  });

export const buildDemoEvaluationInput = (): RAGEvaluationInput => ({
  cases: demoEvaluationPresets.map((preset) => ({
    expectedSources: preset.expectedSources,
    id: preset.id,
    label: preset.label,
    query: preset.query,
    topK: 4,
  })),
});

export const formatEvaluationPercent = (value: number) =>
  `${(value * 100).toFixed(1)}%`;

export const formatEvaluationPassingRate = (value: number) =>
  `${value.toFixed(1)}%`;

export const formatEvaluationCaseSummary = (entry: RAGEvaluationCaseResult) =>
  [
    `${entry.status.toUpperCase()} via ${entry.mode}`,
    `matched ${entry.matchedCount}/${entry.expectedCount}`,
    `precision ${formatEvaluationPercent(entry.precision)}`,
    `recall ${formatEvaluationPercent(entry.recall)}`,
    `f1 ${entry.f1.toFixed(3)}`,
  ].join(" · ");

export const formatEvaluationMissing = (entry: RAGEvaluationCaseResult) =>
  entry.missingIds.length > 0 ? entry.missingIds.join(", ") : "none";

export const formatEvaluationExpected = (entry: RAGEvaluationCaseResult) =>
  entry.expectedIds.join(", ");

export const formatEvaluationRetrieved = (entry: RAGEvaluationCaseResult) =>
  entry.retrievedIds.join(", ");

export const formatEvaluationSummary = (response: RAGEvaluationResponse) =>
  [
    `${response.summary.passedCases}/${response.summary.totalCases} pass`,
    `precision ${formatEvaluationPercent(response.summary.averagePrecision)}`,
    `recall ${formatEvaluationPercent(response.summary.averageRecall)}`,
    `f1 ${response.summary.averageF1.toFixed(3)}`,
    `avg latency ${response.summary.averageLatencyMs.toFixed(1)}ms`,
    `passing ${formatEvaluationPassingRate(response.passingRate)}`,
  ].join(" · ");

export const formatEvaluationLeaderboardEntry = (entry: RAGEvaluationLeaderboardEntry) =>
  `#${entry.rank} · ${entry.label} · passing ${formatEvaluationPassingRate(entry.passingRate)} · f1 ${entry.averageF1.toFixed(3)} · ${entry.averageLatencyMs.toFixed(1)}ms`;

const formatSignedDelta = (value: number, digits = 1, suffix = "") =>
  `${value > 0 ? "+" : ""}${value.toFixed(digits)}${suffix}`;

const formatHistoryCaseLabels = (labels: Array<{ label?: string; caseId: string }>) =>
  labels.length > 0 ? labels.map((entry) => entry.label ?? entry.caseId).join(", ") : "none";

const formatValueList = (values: Array<string | number>, limit = 8) => {
  const normalized = values.map((value) => String(value));
  if (normalized.length <= limit) {
    return normalized.join(", ");
  }

  return `${normalized.slice(0, limit).join(", ")}, …`;
};

const buildSetDelta = (previous: string[] = [], current: string[] = []) => {
  const currentSet = new Set(current);
  const previousSet = new Set(previous);
  const added = [...currentSet].filter((value) => !previousSet.has(value)).sort();
  const removed = [...previousSet].filter((value) => !currentSet.has(value)).sort();
  return { added, removed };
};

const formatGroundingHistoryArtifactLine = (
  label: string,
  previous: string[],
  current: string[],
) => {
  const { added, removed } = buildSetDelta(previous, current);
  if (added.length === 0 && removed.length === 0) {
    return [];
  }

  return [
    `${label} added: ${formatValueList(added)}`,
    `${label} removed: ${formatValueList(removed)}`,
  ];
};

const formatGroundingHistoryArtifactDeltas = (history?: RAGAnswerGroundingEvaluationHistory) => {
  if (!history?.diff) {
    return ["Run the provider comparison again to show grounding artifact drift."];
  }

  const caseDiffs = [
    ...history.diff.improvedCases,
    ...history.diff.regressedCases,
    ...history.diff.unchangedCases,
  ];

  if (caseDiffs.length === 0) {
    return ["No case-level grounding diffs are available for artifact drift."];
  }

  let previousReferenceCount = 0;
  let currentReferenceCount = 0;
  let previousResolvedCitationCount = 0;
  let currentResolvedCitationCount = 0;
  let previousUnresolvedCitationCount = 0;
  let currentUnresolvedCitationCount = 0;
  let answerChanges = 0;

  const allPreviousCitedIds: string[] = [];
  const allCurrentCitedIds: string[] = [];
  const allPreviousMatchedIds: string[] = [];
  const allCurrentMatchedIds: string[] = [];
  const allPreviousMissingIds: string[] = [];
  const allCurrentMissingIds: string[] = [];
  const allPreviousExtraIds: string[] = [];
  const allCurrentExtraIds: string[] = [];
  const allPreviousUngroundedRefs: string[] = [];
  const allCurrentUngroundedRefs: string[] = [];

  for (const entry of caseDiffs) {
    previousReferenceCount += entry.previousReferenceCount ?? 0;
    currentReferenceCount += entry.currentReferenceCount;
    previousResolvedCitationCount += entry.previousResolvedCitationCount ?? 0;
    currentResolvedCitationCount += entry.currentResolvedCitationCount;
    previousUnresolvedCitationCount += entry.previousUnresolvedCitationCount ?? 0;
    currentUnresolvedCitationCount += entry.currentUnresolvedCitationCount;
    answerChanges += entry.answerChanged ? 1 : 0;
    allPreviousCitedIds.push(...entry.previousCitedIds);
    allCurrentCitedIds.push(...entry.currentCitedIds);
    allPreviousMatchedIds.push(...entry.previousMatchedIds);
    allCurrentMatchedIds.push(...entry.currentMatchedIds);
    allPreviousMissingIds.push(...entry.previousMissingIds);
    allCurrentMissingIds.push(...entry.currentMissingIds);
    allPreviousExtraIds.push(...entry.previousExtraIds);
    allCurrentExtraIds.push(...entry.currentExtraIds);
    allPreviousUngroundedRefs.push(...entry.previousUngroundedReferenceNumbers.map(String));
    allCurrentUngroundedRefs.push(...entry.currentUngroundedReferenceNumbers.map(String));
  }

  const lines = [
    `Reference delta: ${formatSignedDelta(currentReferenceCount - previousReferenceCount)} (${previousReferenceCount}→${currentReferenceCount})`,
    `Resolved citation delta: ${formatSignedDelta(currentResolvedCitationCount - previousResolvedCitationCount)} (${previousResolvedCitationCount}→${currentResolvedCitationCount})`,
    `Unresolved citation delta: ${formatSignedDelta(currentUnresolvedCitationCount - previousUnresolvedCitationCount)} (${previousUnresolvedCitationCount}→${currentUnresolvedCitationCount})`,
    `Cases with changed answer text: ${answerChanges}/${caseDiffs.length}`,
  ];

  return [
    ...lines,
    ...formatGroundingHistoryArtifactLine("Cited IDs", allPreviousCitedIds, allCurrentCitedIds),
    ...formatGroundingHistoryArtifactLine("Matched IDs", allPreviousMatchedIds, allCurrentMatchedIds),
    ...formatGroundingHistoryArtifactLine("Missing IDs", allPreviousMissingIds, allCurrentMissingIds),
    ...formatGroundingHistoryArtifactLine("Extra IDs", allPreviousExtraIds, allCurrentExtraIds),
    ...formatGroundingHistoryArtifactLine("Unresolved ref #", allPreviousUngroundedRefs, allCurrentUngroundedRefs),
  ];
};

const formatGroundingHistoryCaseChanges = (
  labels: Array<{ label?: string; caseId: string; previousCitationF1?: number; currentCitationF1: number }>,
) =>
  labels.length > 0
    ? labels
      .map((entry) => `${entry.label ?? entry.caseId} (${formatSignedDelta(entry.currentCitationF1 - (entry.previousCitationF1 ?? 0), 3)})`)
      .join(", ")
    : "none";

export const formatEvaluationHistorySummary = (history?: RAGEvaluationHistory) => {
  if (!history?.latestRun) {
    return ["No persisted benchmark runs yet."];
  }

  const lines = [
    `Runs recorded: ${history.runs.length}`,
    `Latest: ${history.latestRun.label} · ${formatEvaluationSummary(history.latestRun.response)}`,
  ];

  if (history.previousRun) {
    lines.push(`Previous: ${history.previousRun.label} · ${formatEvaluationSummary(history.previousRun.response)}`);
  }

  return lines;
};

export const formatEvaluationHistoryDiff = (history?: RAGEvaluationHistory) => {
  if (!history?.diff) {
    return ["Run the benchmark again to diff regressions over time."];
  }

  return [
    `Passing delta: ${formatSignedDelta(history.diff.summaryDelta.passingRate, 1, "%")}`,
    `Average F1 delta: ${formatSignedDelta(history.diff.summaryDelta.averageF1, 3)}`,
    `Latency delta: ${formatSignedDelta(history.diff.summaryDelta.averageLatencyMs, 1, "ms")}`,
    `Improved: ${formatHistoryCaseLabels(history.diff.improvedCases)}`,
    `Regressed: ${formatHistoryCaseLabels(history.diff.regressedCases)}`,
  ];
};

export const formatRerankerComparisonEntry = (entry: RAGRerankerComparisonEntry) =>
  [
    entry.label,
    `passing ${formatEvaluationPassingRate(entry.response.passingRate)}`,
    `f1 ${entry.response.summary.averageF1.toFixed(3)}`,
    `latency ${entry.response.summary.averageLatencyMs.toFixed(1)}ms`,
  ].join(" · ");

export const formatRerankerComparisonSummary = (comparison: RAGRerankerComparison) => {
  const resolveLabel = (id?: string) =>
    comparison.entries.find((entry) => entry.rerankerId === id)?.label ?? id ?? "n/a";

  return [
    `Best passing rate: ${resolveLabel(comparison.summary.bestByPassingRate)}`,
    `Best average F1: ${resolveLabel(comparison.summary.bestByAverageF1)}`,
    `Fastest: ${resolveLabel(comparison.summary.fastest)}`,
  ];
};

export const formatRetrievalComparisonEntry = (entry: RAGRetrievalComparisonEntry) =>
  [
    entry.label,
    `mode ${entry.retrievalMode}`,
    `passing ${formatEvaluationPassingRate(entry.response.passingRate)}`,
    `f1 ${entry.response.summary.averageF1.toFixed(3)}`,
    `latency ${entry.response.summary.averageLatencyMs.toFixed(1)}ms`,
  ].join(" · ");

export const formatRetrievalComparisonSummary = (comparison: RAGRetrievalComparison) => {
  const resolveLabel = (id?: string) =>
    comparison.entries.find((entry: RAGRetrievalComparisonEntry) => entry.retrievalId === id)?.label ?? id ?? "n/a";

  return [
    `Best passing rate: ${resolveLabel(comparison.summary.bestByPassingRate)}`,
    `Best average F1: ${resolveLabel(comparison.summary.bestByAverageF1)}`,
    `Fastest: ${resolveLabel(comparison.summary.fastest)}`,
  ];
};

export const formatGroundingEvaluationSummary = (
  response: RAGAnswerGroundingEvaluationResponse,
) =>
  [
    `${response.summary.passedCases}/${response.summary.totalCases} pass`,
    `grounded ${response.summary.groundedCases}`,
    `partial ${response.summary.partiallyGroundedCases}`,
    `ungrounded ${response.summary.ungroundedCases}`,
    `resolved citations ${formatEvaluationPercent(response.summary.averageResolvedCitationRate)}`,
    `citation f1 ${response.summary.averageCitationF1.toFixed(3)}`,
    `passing ${formatEvaluationPassingRate(response.passingRate)}`,
  ].join(" · ");

export const formatGroundingEvaluationCase = (
  entry: RAGAnswerGroundingEvaluationCaseResult,
) =>
  [
    `${entry.status.toUpperCase()} via ${entry.mode}`,
    `coverage ${entry.coverage}`,
    `citations ${entry.resolvedCitationCount}/${entry.citationCount}`,
    `resolved ${formatEvaluationPercent(entry.resolvedCitationRate)}`,
    `f1 ${entry.citationF1.toFixed(3)}`,
  ].join(" · ");

export const formatGroundingEvaluationDetails = (
  entry: RAGAnswerGroundingEvaluationCaseResult,
) => [
  `expected: ${entry.expectedIds.join(", ") || "none"}`,
  `cited: ${entry.citedIds.join(", ") || "none"}`,
  `missing: ${entry.missingIds.join(", ") || "none"}`,
  `extra: ${entry.extraIds.join(", ") || "none"}`,
  `unresolved citations: ${entry.unresolvedCitationCount}`,
];

export const formatGroundingProviderEntry = (
  entry: DemoGroundingProviderEntry,
) =>
  [
    entry.label,
    `passing ${formatEvaluationPassingRate(entry.response.passingRate)}`,
    `citation f1 ${entry.response.summary.averageCitationF1.toFixed(3)}`,
    `resolved ${formatEvaluationPercent(entry.response.summary.averageResolvedCitationRate)}`,
    `latency ${entry.elapsedMs.toFixed(1)}ms`,
  ].join(" · ");

export const formatGroundingProviderSummary = (
  comparison: DemoGroundingProviderComparison,
) => {
  const resolveLabel = (key?: string) =>
    comparison.entries.find((entry) => entry.providerKey === key)?.label ?? key ?? "n/a";

  return [
    `Best passing rate: ${resolveLabel(comparison.summary.bestByPassingRate)}`,
    `Best citation F1: ${resolveLabel(comparison.summary.bestByAverageCitationF1)}`,
    `Best resolved citations: ${resolveLabel(comparison.summary.bestByResolvedCitationRate)}`,
    `Fastest: ${resolveLabel(comparison.summary.fastest)}`,
  ];
};

export const formatGroundingProviderCaseEntry = (
  entry: DemoGroundingProviderCaseEntry,
) => [
  entry.label,
  entry.status.toUpperCase(),
  `f1 ${entry.citationF1.toFixed(3)}`,
  `resolved ${formatEvaluationPercent(entry.resolvedCitationRate)}`,
  `matched ${entry.matchedIds.join(", ") || "none"}`,
  `missing ${entry.missingIds.join(", ") || "none"}`,
  `extra ${entry.extraIds.join(", ") || "none"}`,
].join(" · ");

export const formatGroundingProviderCaseSummary = (
  comparison: DemoGroundingProviderCaseComparison,
) => {
  const resolveLabel = (key?: string) =>
    comparison.entries.find((entry) => entry.providerKey === key)?.label ?? key ?? "n/a";

  return [
    `Best grounded: ${resolveLabel(comparison.summary.bestByStatus)}`,
    `Best citation F1: ${resolveLabel(comparison.summary.bestByCitationF1)}`,
    `Best resolved citations: ${resolveLabel(comparison.summary.bestByResolvedCitationRate)}`,
  ];
};

export const formatGroundingCaseDifficultyEntry = (
  entry: RAGAnswerGroundingEvaluationCaseDifficultyEntry,
) => [
  `#${entry.rank}`,
  entry.label ?? entry.caseId,
  `pass ${formatEvaluationPassingRate(entry.passRate)}`,
  `fail ${formatEvaluationPassingRate(entry.failRate)}`,
  `grounded ${formatEvaluationPassingRate(entry.groundedRate)}`,
  `citation f1 ${entry.averageCitationF1.toFixed(3)}`,
  `resolved ${formatEvaluationPercent(entry.averageResolvedCitationRate)}`,
].join(" · ");

export const formatGroundingDifficultyHistorySummary = (
  history?: RAGAnswerGroundingCaseDifficultyHistory,
) => {
  if (!history?.latestRun) {
    return ["No persisted difficulty runs yet."];
  }

  const lines = [
    `Runs recorded: ${history.runs.length}`,
    `Latest: ${history.latestRun.label} · ${history.latestRun.entries.length} ranked case(s)`,
  ];

  if (history.previousRun) {
    lines.push(`Previous: ${history.previousRun.label} · ${history.previousRun.entries.length} ranked case(s)`);
  }

  lines.push(`Most often harder: ${history.trends.mostOftenHarderCaseIds.length > 0 ? history.trends.mostOftenHarderCaseIds.join(", ") : "none"}`);
  lines.push(`Most often easier: ${history.trends.mostOftenEasierCaseIds.length > 0 ? history.trends.mostOftenEasierCaseIds.join(", ") : "none"}`);

  return lines;
};

const formatGroundingDifficultyCaseLabels = (
  entries: Array<{ label?: string; caseId: string; currentRank: number; previousRank?: number }>,
) =>
  entries.length > 0
    ? entries
      .map((entry) => `${entry.label ?? entry.caseId} (#${entry.previousRank ?? "new"}→#${entry.currentRank})`)
      .join(", ")
    : "none";

export const formatGroundingDifficultyHistoryDiff = (
  history?: RAGAnswerGroundingCaseDifficultyHistory,
) => {
  if (!history?.diff) {
    return ["Run provider comparisons again to diff hardest-case changes over time."];
  }

  return [
    `Harder: ${formatGroundingDifficultyCaseLabels(history.diff.harderCases)}`,
    `Easier: ${formatGroundingDifficultyCaseLabels(history.diff.easierCases)}`,
  ];
};

const truncateAnswerSnapshot = (value: string, maxLength = 140) =>
  value.length <= maxLength ? value : `${value.slice(0, maxLength - 1).trimEnd()}…`;

export const formatGroundingProviderCaseDetails = (
  entry: DemoGroundingProviderCaseEntry,
) => [
  `coverage ${entry.coverage}`,
  `matched ${entry.matchedIds.length > 0 ? entry.matchedIds.join(", ") : "none"}`,
  `missing ${entry.missingIds.length > 0 ? entry.missingIds.join(", ") : "none"}`,
  `extra ${entry.extraIds.length > 0 ? entry.extraIds.join(", ") : "none"}`,
  `resolved ${formatEvaluationPercent(entry.resolvedCitationRate)}`,
  `answer: ${truncateAnswerSnapshot(entry.answerExcerpt)}`,
];

const formatGroundingSnapshotArtifacts = (
  entry: RAGAnswerGroundingEvaluationHistory["caseSnapshots"][number],
) => {
  const parts = [
    `${entry.label ?? entry.caseId}: ${entry.answerChange}`,
    `coverage ${entry.coverage}`,
    `resolved ${formatEvaluationPercent(entry.resolvedCitationRate)}`,
    `citations ${entry.resolvedCitationCount}/${entry.citationCount}`,
    `refs ${entry.referenceCount}`,
    `cited ${entry.citedIds.length > 0 ? entry.citedIds.join(", ") : "none"}`,
    `extra ${entry.extraIds.length > 0 ? entry.extraIds.join(", ") : "none"}`,
  ];

  if (entry.ungroundedReferenceNumbers.length > 0) {
    parts.push(`unresolved refs ${entry.ungroundedReferenceNumbers.join(", ")}`);
  }

  parts.push(truncateAnswerSnapshot(entry.answer));
  return parts.join(" · ");
};

const formatGroundingCaseDiffStatusLabel = (entry: {
  label?: string;
  caseId: string;
  previousStatus?: string;
  currentStatus: string;
}) =>
  `${entry.label ?? entry.caseId} · ${entry.previousStatus ?? "n/a"}→${entry.currentStatus}`;

const buildGroundingCaseDiffTrail = (
  entry: NonNullable<RAGAnswerGroundingEvaluationHistory["diff"]>["improvedCases"][number],
) => {
  const statusLabel = formatGroundingCaseDiffStatusLabel(entry);
  const citationF1Delta = formatSignedDelta((entry.currentCitationF1 ?? 0) - (entry.previousCitationF1 ?? 0), 3);
  const resolvedDelta = `${formatSignedDelta((entry.currentResolvedCitationCount ?? 0) - (entry.previousResolvedCitationCount ?? 0))} (${entry.previousResolvedCitationCount ?? 0}→${entry.currentResolvedCitationCount})`;
  const unresolvedDelta = `${formatSignedDelta((entry.currentUnresolvedCitationCount ?? 0) - (entry.previousUnresolvedCitationCount ?? 0))} (${entry.previousUnresolvedCitationCount ?? 0}→${entry.currentUnresolvedCitationCount})`;
  const referenceDelta = `${formatSignedDelta((entry.currentReferenceCount ?? 0) - (entry.previousReferenceCount ?? 0))} (${entry.previousReferenceCount ?? 0}→${entry.currentReferenceCount})`;

  return [
    `${statusLabel} · f1 ${citationF1Delta}`,
    `coverage ${entry.previousCoverage ?? "n/a"}→${entry.currentCoverage}`,
    `resolved refs ${resolvedDelta}`,
    `unresolved refs ${unresolvedDelta}`,
    `references ${referenceDelta}`,
    `answer changed: ${entry.answerChanged ? "yes" : "no"}`,
    ...formatGroundingHistoryArtifactLine("Cited IDs", entry.previousCitedIds, entry.currentCitedIds),
    ...formatGroundingHistoryArtifactLine("Matched IDs", entry.previousMatchedIds, entry.currentMatchedIds),
    ...formatGroundingHistoryArtifactLine("Missing IDs", entry.previousMissingIds, entry.currentMissingIds),
    ...formatGroundingHistoryArtifactLine("Extra IDs", entry.previousExtraIds, entry.currentExtraIds),
    ...formatGroundingHistoryArtifactLine(
      "Unresolved ref #",
      entry.previousUngroundedReferenceNumbers.map(String),
      entry.currentUngroundedReferenceNumbers.map(String),
    ),
  ];
};

export const formatGroundingHistoryArtifactTrail = (
  history?: RAGAnswerGroundingEvaluationHistory,
) => {
  if (!history?.diff) {
    return ["Run the provider comparison again to show case-level artifact trail."];
  }

  if (
    history.diff.improvedCases.length === 0 &&
    history.diff.regressedCases.length === 0 &&
    history.diff.unchangedCases.length === 0
  ) {
    return ["No artifact trail entries available for the latest provider comparison."];
  }

  return [
    `Case trail: ${history.diff.improvedCases.length} improved · ${history.diff.regressedCases.length} regressed · ${history.diff.unchangedCases.length} unchanged`,
    `Case trail f1 delta: pass ${formatSignedDelta(history.diff.summaryDelta.averageCitationF1, 3)}`,
    ...history.diff.improvedCases.flatMap((entry) => buildGroundingCaseDiffTrail(entry)),
    ...history.diff.regressedCases.flatMap((entry) => buildGroundingCaseDiffTrail(entry)),
    ...history.diff.unchangedCases.flatMap((entry) => buildGroundingCaseDiffTrail(entry)),
  ];
};

export const formatGroundingHistorySnapshots = (
  history?: RAGAnswerGroundingEvaluationHistory,
) => {
  if (history?.caseSnapshots.length) {
    return history.caseSnapshots.map((entry) => formatGroundingSnapshotArtifacts(entry));
  }

  if (!history?.latestRun) {
    return ["No persisted provider answer snapshots yet."];
  }

  return history.latestRun.response.cases.map((entry) =>
    `${entry.label ?? entry.caseId}: unchanged · ${truncateAnswerSnapshot(entry.answer)}`
  );
};

export const formatGroundingHistorySummary = (
  history?: RAGAnswerGroundingEvaluationHistory,
) => {
  if (!history?.latestRun) {
    return ["No persisted provider runs yet."];
  }

  const lines = [
    `Runs recorded: ${history.runs.length}`,
    `Latest: ${history.latestRun.label} · ${formatGroundingEvaluationSummary(history.latestRun.response)}`,
  ];

  if (history.previousRun) {
    lines.push(`Previous: ${history.previousRun.label} · ${formatGroundingEvaluationSummary(history.previousRun.response)}`);
  }

  if (history.leaderboard[0]) {
    lines.push(`Best recorded: ${formatGroundingHistoryLeaderboardEntry(history.leaderboard[0])}`);
  }

  if (history.caseSnapshots.length > 0) {
    const changedAnswers = history.caseSnapshots.filter((entry) => entry.answerChange === "changed").length;
    lines.push(
      `Answer drift: ${changedAnswers}/${history.caseSnapshots.length} changed`,
    );
  }

  return lines;
};

export const formatGroundingHistoryDiff = (
  history?: RAGAnswerGroundingEvaluationHistory,
) => {
  if (!history?.diff) {
    return ["Run the provider comparison again to diff grounding regressions over time."];
  }

  return [
    `Passing delta: ${formatSignedDelta(history.diff.summaryDelta.passingRate, 1, "%")}`,
    `Citation F1 delta: ${formatSignedDelta(history.diff.summaryDelta.averageCitationF1, 3)}`,
    `Resolved citation delta: ${formatSignedDelta(history.diff.summaryDelta.averageResolvedCitationRate * 100, 1, "%")}`,
    `Improved: ${formatGroundingHistoryCaseChanges(history.diff.improvedCases)}`,
    `Regressed: ${formatGroundingHistoryCaseChanges(history.diff.regressedCases)}`,
    ...formatGroundingHistoryArtifactDeltas(history),
  ];
};

export const formatGroundingHistoryLeaderboardEntry = (
  entry: RAGAnswerGroundingEvaluationLeaderboardEntry,
) =>
  `#${entry.rank} · ${entry.label} · passing ${formatEvaluationPassingRate(entry.passingRate)} · citation f1 ${entry.averageCitationF1.toFixed(3)} · resolved ${formatEvaluationPercent(entry.averageResolvedCitationRate)}`;

export const isBackendMode = (value: unknown): value is DemoBackendMode =>
  value === "sqlite-native" || value === "sqlite-fallback" || value === "postgres";

export const isFrameworkId = (value: unknown): value is DemoFrameworkId =>
  value === "react" || value === "svelte" || value === "vue" || value === "angular" || value === "html" || value === "htmx";

export const getBackendLabel = (mode: DemoBackendMode) =>
  demoBackends.find((backend) => backend.id === mode)?.label ?? mode;

export const getAvailableDemoBackends = (backends?: DemoBackendDescriptor[]) =>
  backends ?? demoBackends;

export const getFrameworkLabel = (framework: DemoFrameworkId) =>
  demoFrameworks.find((entry) => entry.id === framework)?.label ?? framework;

export const getDemoPagePath = (framework: DemoFrameworkId, mode: DemoBackendMode) =>
  `/${framework}/${mode}`;

export const getRAGPathForMode = (mode: DemoBackendMode) => {
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

export const readBackendModeFromPath = (
  pathname: string,
  defaultMode: DemoBackendMode = "sqlite-native",
) => {
  const mode = pathname.split("/").filter(Boolean).at(-1);
  return isBackendMode(mode) ? mode : defaultMode;
};

export const readFrameworkFromPath = (
  pathname: string,
  defaultFramework: DemoFrameworkId = "react",
) => {
  const framework = pathname.split("/").filter(Boolean)[0];
  return isFrameworkId(framework) ? framework : defaultFramework;
};

export const getInitialBackendMode = (defaultMode: DemoBackendMode = "sqlite-native") => {
  if (typeof window === "undefined") {
    return defaultMode;
  }

  return readBackendModeFromPath(window.location.pathname, defaultMode);
};

export const getInitialFramework = (defaultFramework: DemoFrameworkId = "react") => {
  if (typeof window === "undefined") {
    return defaultFramework;
  }

  return readFrameworkFromPath(window.location.pathname, defaultFramework);
};


export const navigateToBackendMode = (
  frameworkOrMode: DemoFrameworkId | DemoBackendMode,
  maybeMode?: DemoBackendMode,
) => {
  if (typeof window === "undefined") {
    return;
  }

  const framework = maybeMode ? frameworkOrMode as DemoFrameworkId : getInitialFramework();
  const mode = maybeMode ?? frameworkOrMode as DemoBackendMode;
  window.location.href = getDemoPagePath(framework, mode);
};

export const buildSearchPayload = (query: SearchFormState) => {
  const payload: Record<string, unknown> = {
    query: query.query,
    topK: query.topK,
  };

  if (query.scoreThreshold.length > 0) {
    payload.scoreThreshold = Number(query.scoreThreshold);
  }
  if (query.kind.length > 0) payload.kind = query.kind;
  if (query.source.length > 0) payload.source = query.source;
  if (query.documentId.length > 0) payload.documentId = query.documentId;

  return payload;
};

export const buildSearchResponse = (
  query: string,
  payload: Record<string, unknown>,
  results: RAGSource[],
  elapsedMs: number,
): SearchResponse => ({
  query,
  elapsedMs,
  topK: typeof payload.topK === "number" ? payload.topK : 6,
  count: results.length,
  chunks: results.map((result) => ({
    chunkId: result.chunkId,
    title: result.title ?? result.chunkId,
    source: result.source ?? "unknown",
    score: result.score,
    metadata: (result.metadata ?? {}) as Record<string, unknown>,
    text: result.text,
  })),
  filter: Object.fromEntries(
    Object.entries(payload)
      .filter(
        ([key, value]) =>
          ["kind", "source", "documentId"].includes(key) &&
          typeof value === "string" &&
          value.length > 0,
      )
      .map(([key, value]) => [key, value as string]),
  ),
});

const buildNativeSourceLabel = (status: RAGVectorStoreStatus) => {
  const vectorMode = status.vectorMode as string;
  const nativeResolution =
    status.native && "resolution" in status.native ? status.native.resolution : undefined;

  if (vectorMode === "native_vec0") {
    return nativeResolution?.source === "absolute-package"
      ? "Packaged sqlite-vec"
      : "Native sqlite-vec";
  }

  if (vectorMode === "native_pgvector") {
    return "PostgreSQL pgvector extension";
  }

  return "Not applicable";
};

const buildVectorModeMessage = (
  status: RAGVectorStoreStatus,
  selectedMode: DemoBackendMode,
) => {
  const backendLabel = getBackendLabel(selectedMode);
  const vectorMode = status.vectorMode as string;

  if (vectorMode === "native_vec0") {
    return `Packaged native vec0 is active. Retrieval is using the ${backendLabel} backend shipped through @absolutejs/absolute-rag-sqlite.`;
  }

  if (vectorMode === "native_pgvector") {
    return `PostgreSQL pgvector is active. Retrieval is using the ${backendLabel} backend shipped through @absolutejs/absolute-rag-postgresql.`;
  }

  return (
    status.native?.fallbackReason ??
    `Owned JSON fallback mode is active. Retrieval is using the ${backendLabel} backend without native vector acceleration.`
  );
};

export const buildStatusView = (
  status: RAGVectorStoreStatus | undefined,
  capabilities: RAGBackendCapabilities | undefined,
  documents: DemoDocument[],
  selectedMode: DemoBackendMode,
): DemoStatusView | null => {
  if (!status) {
    return null;
  }

  const counts = documents.reduce(
    (acc, doc) => {
      acc.total += 1;
      acc.byKind[doc.kind] = (acc.byKind[doc.kind] ?? 0) + 1;
      acc.chunkCount += doc.chunkCount;
      return acc;
    },
    {
      total: 0,
      chunkCount: 0,
      byKind: { seed: 0, custom: 0 } as Record<RagDocumentKind, number>,
    },
  );

  const capabilityLabels = [
    `${capabilities?.persistence ?? "unknown"} persistence`,
    capabilities?.nativeVectorSearch ? "native vector search" : "owned JSON fallback search",
    capabilities?.serverSideFiltering ? "server-side filtering" : "client-side filtering",
  ];

  return {
    backend: status.backend,
    capabilities: capabilityLabels,
    chunkCount: counts.chunkCount,
    dimensions: status.dimensions,
    documents: {
      total: counts.total,
      byKind: counts.byKind,
    },
    native: {
      active: status.native?.active === true,
      fallbackReason: status.native?.fallbackReason,
      sourceLabel: buildNativeSourceLabel(status),
    },
    reranker: {
      label: DEMO_RERANKER_LABEL,
      summary: DEMO_RERANKER_SUMMARY,
    },
    vectorMode: status.vectorMode,
    vectorModeMessage: buildVectorModeMessage(status, selectedMode),
  };
};

const formatCompactList = (values: string[]) =>
  values.length > 0 ? values.join(", ") : "none";

const formatDuration = (value?: number) =>
  typeof value === "number" && Number.isFinite(value) ? `${value}${value === 1 ? "ms" : "ms"}` : "n/a";

const formatAge = (value?: number) => {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return "n/a";
  }

  if (value < 1000) {
    return `${Math.round(value)}ms`;
  }

  const seconds = value / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }

  const minutes = seconds / 60;
  if (minutes < 60) {
    return `${minutes.toFixed(1)}m`;
  }

  const hours = minutes / 60;
  if (hours < 24) {
    return `${hours.toFixed(1)}h`;
  }

  return `${(hours / 24).toFixed(1)}d`;
};

const formatCoverageMap = (entries: Record<string, number>) =>
  Object.entries(entries)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([key, count]) => `${key}: ${count}`)
    .join(" · ") || "none";

const formatAdminAction = (value: string) => value.replaceAll("_", " ");

const formatAdminTarget = (job: RAGAdminJobRecord) =>
  job.target && job.target.length > 0 ? ` · ${job.target}` : "";

const formatJobTiming = (job: RAGAdminJobRecord) =>
  typeof job.elapsedMs === "number" ? formatDuration(job.elapsedMs) : formatDate(job.startedAt);

export const formatGroundingCoverage = (coverage: RAGGroundedAnswer["coverage"]) => {
  switch (coverage) {
    case "grounded":
      return "Grounded";
    case "partial":
      return "Partially grounded";
    case "ungrounded":
    default:
      return "Ungrounded";
  }
};

export const formatGroundingSummary = (answer?: RAGGroundedAnswer | null) => {
  if (!answer) {
    return [] as string[];
  }

  const citationParts = answer.parts.filter((part) => part.type === "citation");
  return [
    `${formatGroundingCoverage(answer.coverage)} answer · ${answer.references.length} reference(s)`,
    `${citationParts.length} cited answer segment(s)`,
    answer.ungroundedReferenceNumbers.length > 0
      ? `Unresolved citations: ${answer.ungroundedReferenceNumbers.map((value) => `[${value}]`).join(" ")}`
      : "All citation numbers resolve to retrieved evidence.",
  ];
};

export const formatGroundingReferenceLabel = (reference: RAGGroundingReference) =>
  [reference.label, reference.contextLabel, reference.locatorLabel].filter(Boolean).join(" · ");

export const formatGroundingReferenceSummary = (reference: RAGGroundingReference) =>
  reference.source ?? reference.title ?? reference.chunkId;

export const formatGroundingReferenceExcerpt = (reference: RAGGroundingReference) =>
  reference.excerpt || reference.text;

export const formatCitationLabel = (citation: RAGCitation) =>
  [citation.label, citation.contextLabel, citation.locatorLabel].filter(Boolean).join(" · ");

export const formatCitationSummary = (citation: RAGCitation) =>
  citation.source ?? citation.title ?? citation.chunkId;

export const formatCitationExcerpt = (citation: RAGCitation) => citation.text;

const formatEvidenceDetailLine = (label: string, value?: string | null) =>
  value && value.length > 0 ? `${label}: ${value}` : "";

const formatEvidenceContextLine = (contextLabel?: string | null, locatorLabel?: string | null) => {
  const value = [locatorLabel, contextLabel]
    .filter((entry): entry is string => Boolean(entry && entry.length > 0))
    .join(" · ");
  return value.length > 0 ? `location: ${value}` : "";
};

export const formatSourceSummaryDetails = (summary: RAGSourceSummary) =>
  [
    `best score: ${formatScore(summary.bestScore)}`,
    `coverage: ${summary.count} chunk(s) · citations ${summary.citationNumbers.map((value) => `[${value}]`).join(" ") || "none"}`,
    formatEvidenceContextLine(summary.contextLabel, summary.locatorLabel),
    formatEvidenceDetailLine("provenance", summary.provenanceLabel),
  ].filter((value) => value.length > 0);

export const formatGroundingReferenceDetails = (reference: RAGGroundingReference) =>
  [
    formatEvidenceDetailLine("evidence", reference.source ?? reference.title ?? reference.chunkId),
    formatEvidenceContextLine(reference.contextLabel, reference.locatorLabel),
    formatEvidenceDetailLine("provenance", reference.provenanceLabel),
    `score: ${formatScore(reference.score)}`,
  ].filter((value) => value.length > 0);

export const formatCitationDetails = (citation: RAGCitation) =>
  [
    formatEvidenceDetailLine("evidence", citation.source ?? citation.title ?? citation.chunkId),
    formatEvidenceContextLine(citation.contextLabel, citation.locatorLabel),
    formatEvidenceDetailLine("provenance", citation.provenanceLabel),
    `score: ${formatScore(citation.score)}`,
  ].filter((value) => value.length > 0);

export const formatGroundingPartReferences = (referenceNumbers: number[]) =>
  referenceNumbers.map((value) => `[${value}]`).join(" ");

export const formatGroundedAnswerPartDetails = (
  part: Extract<RAGGroundedAnswerPart, { type: "citation" }>,
) => [
  ...part.referenceDetails.flatMap((detail) =>
    [detail.evidenceLabel, detail.evidenceSummary]
      .filter((value): value is string => Boolean(value && value.length > 0))
      .map((value, index) =>
        index === 0 ? `evidence ${detail.number}: ${value}` : `summary ${detail.number}: ${value}`,
      ),
  ),
  ...(part.unresolvedReferenceNumbers.length > 0
    ? [
        `unresolved: ${part.unresolvedReferenceNumbers
          .map((value) => `[${value}]`)
          .join(" ")}`,
      ]
    : []),
];

export const formatReadinessSummary = (readiness?: RAGExtractorReadiness) => {
  if (!readiness) {
    return [] as string[];
  }

  return [
    readiness.providerConfigured
      ? `Provider ready: ${[readiness.providerName, readiness.model].filter(Boolean).join(" / ")}`
      : "Provider not configured",
    readiness.embeddingConfigured
      ? `Embeddings ready: ${readiness.embeddingModel ?? "configured"}`
      : "Embeddings not configured",
    readiness.rerankerConfigured ? "Reranker configured" : "Reranker not configured",
    readiness.indexManagerConfigured ? "Index manager configured" : "Index manager not configured",
    readiness.extractorsConfigured
      ? `Extractors: ${formatCompactList(readiness.extractorNames)}`
      : "No extractors configured",
  ];
};

export const formatHealthSummary = (health?: RAGCorpusHealth) => {
  if (!health) {
    return [] as string[];
  }

  return [
    `Coverage by format: ${formatCoverageMap(health.coverageByFormat)}`,
    `Coverage by kind: ${formatCoverageMap(health.coverageByKind)}`,
    `Average chunks per document: ${health.averageChunksPerDocument.toFixed(2)}`,
    `Stale documents: ${health.staleDocuments.length} within ${formatAge(health.staleAfterMs)} threshold`,
    `Duplicates: sources ${health.duplicateSourceGroups.length} · document ids ${health.duplicateDocumentIdGroups.length}`,
    `Missing fields: source ${health.documentsMissingSource} · title ${health.documentsMissingTitle} · metadata ${health.documentsMissingMetadata}`,
    `Chunk quality: empty docs ${health.emptyDocuments} · empty chunks ${health.emptyChunks} · low signal ${health.lowSignalChunks}`,
    `Document age window: oldest ${formatAge(health.oldestDocumentAgeMs)} · newest ${formatAge(health.newestDocumentAgeMs)}`,
  ];
};

export const formatFailureSummary = (health?: RAGCorpusHealth) => {
  if (!health) {
    return [] as string[];
  }

  return [
    `Failed ingest jobs: ${health.failedIngestJobs} · failed admin jobs: ${health.failedAdminJobs}`,
    `Failures by input: ${formatCoverageMap(health.failuresByInputKind)}`,
    `Failures by extractor: ${formatCoverageMap(health.failuresByExtractor)}`,
    `Failures by admin action: ${formatCoverageMap(health.failuresByAdminAction)}`,
  ];
};

export const formatAdminJobSummary = (job: RAGAdminJobRecord) =>
  `${job.status.toUpperCase()} · ${formatAdminAction(job.action)}${formatAdminTarget(job)} · ${formatJobTiming(job)}`;

export const formatAdminActionSummary = (action: RAGAdminActionRecord) => {
  const target = action.documentId ? ` · ${action.documentId}` : "";
  const timing = typeof action.elapsedMs === "number" ? formatDuration(action.elapsedMs) : formatDate(action.startedAt);
  const status = action.status === "failed" ? "FAILED" : "COMPLETED";
  return `${status} · ${formatAdminAction(action.action)}${target} · ${timing}`;
};

export const formatAdminJobList = (jobs?: RAGAdminJobRecord[]) =>
  (jobs ?? []).slice(0, 3).map((job) => formatAdminJobSummary(job));

export const formatAdminActionList = (actions?: RAGAdminActionRecord[]) =>
  (actions ?? []).slice(0, 3).map((action) => formatAdminActionSummary(action));

export const formatSyncSourceSummary = (source: RAGSyncSourceRecord) =>
  [
    `${source.label} · ${source.kind} · ${source.status.toUpperCase()}`,
    typeof source.documentCount === "number" ? `${source.documentCount} docs` : "",
    typeof source.chunkCount === "number" ? `${source.chunkCount} chunks` : "",
    typeof source.lastSyncDurationMs === "number" ? `${formatDuration(source.lastSyncDurationMs)}` : "",
    typeof source.lastSyncedAt === "number" ? `last sync ${formatDate(source.lastSyncedAt)}` : "",
  ]
    .filter((value) => value.length > 0)
    .join(" · ");

export const formatSyncSourceDetails = (source: RAGSyncSourceRecord) =>
  [
    source.target ? `target: ${source.target}` : "",
    typeof source.metadata?.provider === "string" ? `provider: ${source.metadata.provider}` : "",
    typeof source.metadata?.accountMode === "string" ? `account mode: ${source.metadata.accountMode}` : "",
    typeof source.metadata?.schedule === "string" ? `schedule: ${source.metadata.schedule}` : "",
    typeof source.metadata?.lastTrigger === "string" ? `last trigger: ${source.metadata.lastTrigger}` : "",
    typeof source.lastSuccessfulSyncAt === "number" ? `last successful sync: ${formatDate(source.lastSuccessfulSyncAt)}` : "",
    typeof source.nextRetryAt === "number" ? `next retry: ${formatDate(source.nextRetryAt)}` : "",
    source.lastError ? `last error: ${source.lastError}` : "",
  ].filter((value) => value.length > 0);

export const formatSyncSourceRecentRuns = (source: RAGSyncSourceRecord) =>
  Array.isArray(source.metadata?.recentRuns)
    ? (source.metadata.recentRuns as Array<Record<string, unknown>>)
        .slice(0, 3)
        .map((entry, index) => {
          const trigger = typeof entry.trigger === "string" ? entry.trigger : "sync";
          const status = typeof entry.status === "string" ? entry.status : "unknown";
          const finishedAt = typeof entry.finishedAt === "number" ? formatDate(entry.finishedAt) : "n/a";
          const duration = typeof entry.durationMs === "number" ? formatDuration(entry.durationMs) : "n/a";
          const docs = typeof entry.documentCount === "number" ? `${entry.documentCount} docs` : "n/a";
          const chunks = typeof entry.chunkCount === "number" ? `${entry.chunkCount} chunks` : "n/a";
          const error = typeof entry.error === "string" && entry.error.length > 0 ? entry.error : "";

          return {
            duration,
            error,
            finishedAt,
            label: `Run ${index + 1}`,
            output: `${docs} · ${chunks}`,
            status,
            trigger,
          };
        })
    : [];

export const formatSyncSourceExtendedDetails = (source: RAGSyncSourceRecord) =>
  [
    source.description ?? "",
    typeof source.metadata?.liveReady === "string" ? `live account: ${source.metadata.liveReady}` : "",
  ].filter((value) => value.length > 0);

export const formatSyncSourceOverview = (sources?: RAGSyncSourceRecord[]) => {
  const records = sources ?? [];
  if (records.length === 0) {
    return ["No sync sources configured yet."];
  }

  const countByStatus = (status: string) =>
    records.filter((record) => record.status.toLowerCase() === status).length;
  const latest = [...records]
    .filter(
      (record) =>
        typeof record.lastSuccessfulSyncAt === "number" ||
        typeof record.lastSyncedAt === "number",
    )
    .sort(
      (left, right) =>
        (right.lastSuccessfulSyncAt ?? right.lastSyncedAt ?? 0) -
        (left.lastSuccessfulSyncAt ?? left.lastSyncedAt ?? 0),
    )[0];

  return [
    `Configured sync sources: ${records.length} · completed ${countByStatus("completed")} · running ${countByStatus("running")} · failed ${countByStatus("failed") + countByStatus("error")}`,
    latest
      ? [
          `Latest sync: ${latest.label}`,
          typeof latest.documentCount === "number" ? `${latest.documentCount} docs` : "",
          typeof latest.chunkCount === "number" ? `${latest.chunkCount} chunks` : "",
          typeof latest.lastSyncDurationMs === "number" ? formatDuration(latest.lastSyncDurationMs) : "",
          typeof latest.lastSuccessfulSyncAt === "number"
            ? formatDate(latest.lastSuccessfulSyncAt)
            : typeof latest.lastSyncedAt === "number"
              ? formatDate(latest.lastSyncedAt)
              : "",
        ]
          .filter((value) => value.length > 0)
          .join(" · ")
      : "Latest sync: no completed run yet.",
  ];
};

export const formatSyncSourceActionSummary = (source: RAGSyncSourceRecord) =>
  [
    source.status.toUpperCase(),
    typeof source.lastSuccessfulSyncAt === "number"
      ? `last sync ${formatDate(source.lastSuccessfulSyncAt)}`
      : typeof source.lastSyncedAt === "number"
        ? `last sync ${formatDate(source.lastSyncedAt)}`
        : "no completed sync yet",
    typeof source.documentCount === "number" ? `${source.documentCount} docs` : "",
    typeof source.chunkCount === "number" ? `${source.chunkCount} chunks` : "",
  ]
    .filter((value) => value.length > 0)
    .join(" · ");

export const formatSyncSourceActionBadges = (source: RAGSyncSourceRecord) =>
  [
    typeof source.metadata?.provider === "string" ? source.metadata.provider : "",
    typeof source.metadata?.accountMode === "string" ? `mode ${source.metadata.accountMode}` : "",
    typeof source.metadata?.liveReady === "string" ? source.metadata.liveReady : "",
  ].filter((value) => value.length > 0);

export const formatSyncSourceCollapsedSummary = (source: RAGSyncSourceRecord) =>
  [
    source.label,
    source.status.toUpperCase(),
    source.lastError && source.status === "failed"
      ? `error: ${source.lastError}`
      : typeof source.lastSuccessfulSyncAt === "number"
        ? `last sync ${formatDate(source.lastSuccessfulSyncAt)}`
        : typeof source.lastSyncedAt === "number"
          ? `last sync ${formatDate(source.lastSyncedAt)}`
          : "",
  ]
    .filter((value) => value.length > 0)
    .join(" · ");

export const formatSyncSourceSubtype = (source: RAGSyncSourceRecord) => {
  if (typeof source.metadata?.provider === "string") {
    if (typeof source.metadata?.accountMode === "string") {
      return `${source.metadata.provider} ${source.metadata.accountMode}`;
    }

    return source.metadata.provider;
  }

  switch (source.kind) {
    case "directory":
      return "Watched folder";
    case "storage":
      return "Object storage";
    case "url":
      return "Route fetch";
    case "email":
      return "Mailbox sync";
    default:
      return source.kind;
  }
};

const syncStatusRank = (status: string) => {
  switch (status.toLowerCase()) {
    case "failed":
    case "error":
      return 0;
    case "running":
      return 1;
    case "idle":
      return 2;
    case "completed":
      return 3;
    default:
      return 4;
  }
};

export const sortSyncSources = <T extends RAGSyncSourceRecord>(sources?: T[]) =>
  [...(sources ?? [])].sort((left, right) => {
    const byStatus = syncStatusRank(left.status) - syncStatusRank(right.status);
    if (byStatus !== 0) return byStatus;
    const leftTime = left.lastSuccessfulSyncAt ?? left.lastSyncedAt ?? 0;
    const rightTime = right.lastSuccessfulSyncAt ?? right.lastSyncedAt ?? 0;
    if (rightTime !== leftTime) return rightTime - leftTime;
    return left.label.localeCompare(right.label);
  });

export const formatSyncDeltaChips = (sources?: RAGSyncSourceRecord[]) => {
  const records = sources ?? [];
  if (records.length === 0) {
    return ["sync: none configured"];
  }

  const countByStatus = (status: string) =>
    records.filter((record) => record.status.toLowerCase() === status).length;
  const latest = sortSyncSources(records).find(
    (record) =>
      typeof record.lastSuccessfulSyncAt === "number" ||
      typeof record.lastSyncedAt === "number",
  );

  return [
    `sync failed: ${countByStatus("failed")}`,
    `sync running: ${countByStatus("running")}`,
    `sync completed: ${countByStatus("completed")}`,
    latest
      ? `latest sync: ${latest.label}`
      : "latest sync: none",
  ];
};

export const formatRetrievalScopeSummary = (search: SearchFormState) => {
  const parts = [
    search.kind ? `kind ${search.kind}` : "",
    search.source.trim().length > 0 ? `source ${search.source.trim()}` : "",
    search.documentId.trim().length > 0 ? `document ${search.documentId.trim()}` : "",
  ].filter((value) => value.length > 0);

  return parts.length > 0
    ? `Active scope: ${parts.join(" · ")}`
    : "Active scope: whole index";
};

export const formatRetrievalScopeHint = (search: SearchFormState) => {
  const hasSource = search.source.trim().length > 0;
  const hasDocument = search.documentId.trim().length > 0;
  if (hasSource && hasDocument) {
    return "Both source and document filters are active. Clear one if you want broader retrieval.";
  }
  if (hasDocument) {
    return "Document scope is locked to a single indexed document. Row actions set this automatically.";
  }
  if (hasSource) {
    return "Source scope is locked to a single source path. Row actions set this automatically.";
  }
  if (search.kind) {
    return "Kind filtering is active. Retrieval is constrained to the selected document kind.";
  }
  return "Use row actions or the filters below to narrow retrieval before searching.";
};

export const formatDate = (value: number) => new Date(value).toLocaleString();
export const formatScore = (value: number) => value.toFixed(4);

const formatMetadataValue = (value: unknown): string => {
  if (Array.isArray(value)) {
    return value.map((entry) => formatMetadataValue(entry)).join(", ");
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return typeof value === "string" ? value : "";
};

export const formatDemoMetadataSummary = (metadata?: Record<string, unknown>) => {
  if (!metadata) {
    return [] as string[];
  }

  const lines: string[] = [];
  const push = (label: string, key: string) => {
    const value = formatMetadataValue(metadata[key]);
    if (value.length > 0) {
      lines.push(label + ": " + value);
    }
  };

  push("extractor", "extractor");
  push("kind", "fileKind");
  push("legacy", "legacyFormat");
  push("pages", "pageCount");
  push("sections", "sectionCount");
  push("slides", "slideCount");
  push("sheets", "sheetNames");
  push("ocr", "ocrEngine");
  push("ocr source", "extractedFrom");
  push("transcript", "transcriptSource");
  push("media", "mediaKind");
  push("pdf mode", "pdfTextMode");
  push("archive", "archiveType");
  push("entry", "archivePath");
  push("thread", "threadTopic");
  push("from", "from");
  push("to", "to");

  return lines;
};

export const formatContentFormat = (value: DemoContentFormat) => {
  switch (value) {
    case "markdown":
      return "Markdown";
    case "html":
      return "HTML";
    case "text":
    default:
      return "Plain text";
  }
};

export const formatChunkStrategy = (value: DemoChunkingStrategy) => {
  switch (value) {
    case "source_aware":
      return "Source-aware";
    case "paragraphs":
      return "Paragraphs";
    case "sentences":
      return "Sentences";
    case "fixed":
    default:
      return "Fixed window";
  }
};

export const getDemoUploadPreset = (id: string) =>
  demoUploadPresets.find((preset) => preset.id === id) ?? null;

export const getDemoUploadFixtureUrl = (id: string) =>
  "/demo/upload-fixtures/" + encodeURIComponent(id);

export const buildDemoUploadIngestInput = (
  preset: DemoUploadPreset,
  base64Content: string,
): RAGDocumentUploadIngestInput => ({
  baseMetadata: {
    demoUploadPreset: preset.id,
    fileKind: "uploaded-demo-fixture",
    kind: "custom",
  },
  uploads: [
    {
      name: preset.fileName,
      source: preset.source,
      title: preset.title,
      contentType: preset.contentType,
      encoding: "base64",
      content: base64Content,
      metadata: {
        demoUploadPreset: preset.id,
        fixturePath: preset.fixturePath,
        kind: "custom",
      },
    },
  ],
});

export const encodeArrayBufferToBase64 = (value: ArrayBuffer) => {
  const bytes = new Uint8Array(value);
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }

  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return btoa(binary);
};

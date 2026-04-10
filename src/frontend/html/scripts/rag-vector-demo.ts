import {
  createRAGWorkflow,
  createRAGClient,
} from "@absolutejs/absolute/ai/client";
import { buildRAGEvaluationLeaderboard, runRAGEvaluationSuite } from "@absolutejs/absolute/ai/client";
import type { RAGEvaluationResponse } from "@absolutejs/absolute";
import type {
  AddFormState,
  DemoActiveRetrievalState,
  DemoRetrievalQualityResponse,
  DemoAIModelCatalogResponse,
  DemoUploadPreset,
  DemoBackendDescriptor,
  DemoBackendMode,
  DemoChunkPreview,
  DemoDocument,
  DemoStatusView,
  SearchFormState,
  SearchResponse,
} from "../../demo-backends";
import {
  buildDemoAIStreamPrompt,
  buildDemoEvaluationSuite,
  buildDemoEvaluationInput,
  buildDemoUploadIngestInput,
  buildSearchPayload,
  buildStatusView,
  getAvailableDemoBackends,
  demoChunkingStrategies,
  demoContentFormats,
  demoEvaluationPresets,
  demoUploadPresets,
  formatAdminActionList,
  formatAdminJobList,
  formatDemoAIModelLabel,
  formatCitationDetails,
  formatCitationExcerpt,
  formatCitationLabel,
  formatCitationSummary,
  formatEvaluationCaseSummary,
  formatEvaluationExpected,
  formatEvaluationMissing,
  formatEvaluationRetrieved,
  formatEvaluationSummary,
  formatEvaluationHistoryDiff,
  formatEvaluationHistorySummary,
  formatEvaluationLeaderboardEntry,
  formatGroundingEvaluationCase,
  formatGroundingEvaluationDetails,
  formatGroundingEvaluationSummary,
  formatGroundingCaseDifficultyEntry,
  formatGroundingDifficultyHistoryDiff,
  formatGroundingDifficultyHistorySummary,
  formatGroundingHistoryDiff,
  formatGroundingHistoryArtifactTrail,
  formatGroundingHistorySnapshots,
  formatGroundingHistorySummary,
  formatGroundingProviderCaseDetails,
  formatGroundingProviderCaseEntry,
  formatGroundingProviderCaseSummary,
  formatGroundingProviderEntry,
  formatGroundingProviderSummary,
  formatChunkStrategy,
  formatContentFormat,
  formatDemoMetadataSummary,
  formatDate,
  formatFailureSummary,
  formatGroundingCoverage,
  formatGroundedAnswerPartDetails,
  formatGroundingPartReferences,
  formatGroundingReferenceDetails,
  formatGroundingReferenceExcerpt,
  formatGroundingReferenceLabel,
  formatGroundingReferenceSummary,
  formatGroundingSummary,
  formatSourceSummaryDetails,
  formatRetrievalComparisonEntry,
  formatRetrievalComparisonSummary,
  formatRerankerComparisonEntry,
  formatRerankerComparisonSummary,
  formatHealthSummary,
  formatReadinessSummary,
  formatRetrievalScopeHint,
  formatRetrievalScopeSummary,
  formatScore,
  loadActiveRetrievalState,
  loadRecentQueries,
  formatSyncSourceActionBadges,
  formatSyncSourceActionSummary,
  formatSyncSourceCollapsedSummary,
  formatSyncDeltaChips,
  formatSyncSourceOverview,
  formatSyncSourceDetails,
  formatSyncSourceSummary,
  sortSyncSources,
  encodeArrayBufferToBase64,
  getRAGPathForMode,
  getDemoUploadFixtureUrl,
  getInitialBackendMode,
  saveActiveRetrievalState,
  saveRecentQueries,
  navigateToBackendMode,
  getDemoPagePath,
} from "../../demo-backends";

const toNumber = (value: string, fallback: number) => {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
};

const toSafeText = (value: string | null, fallback = "") =>
  value === null ? fallback : value.trim();
const DOCUMENTS_PER_PAGE = 10;
const SUPPORTED_FILE_TYPE_OPTIONS = [
  ["all", "All supported types"],
  [".txt", ".txt"],
  [".md", ".md"],
  [".mdx", ".mdx"],
  [".html", ".html"],
  [".htm", ".htm"],
  [".json", ".json"],
  [".csv", ".csv"],
  [".xml", ".xml"],
  [".yaml", ".yaml"],
  [".yml", ".yml"],
  [".log", ".log"],
  [".ts", ".ts"],
  [".tsx", ".tsx"],
  [".js", ".js"],
  [".jsx", ".jsx"],
  [".pdf", ".pdf"],
  [".epub", ".epub"],
  [".docx", ".docx"],
  [".xlsx", ".xlsx"],
  [".pptx", ".pptx"],
  [".odt", ".odt"],
  [".ods", ".ods"],
  [".odp", ".odp"],
  [".rtf", ".rtf"],
  [".doc", ".doc"],
  [".xls", ".xls"],
  [".ppt", ".ppt"],
  [".msg", ".msg"],
  [".eml", ".eml"],
  [".png", ".png"],
  [".jpg", ".jpg"],
  [".jpeg", ".jpeg"],
  [".webp", ".webp"],
  [".tiff", ".tiff"],
  [".tif", ".tif"],
  [".bmp", ".bmp"],
  [".gif", ".gif"],
  [".heic", ".heic"],
  [".mp3", ".mp3"],
  [".wav", ".wav"],
  [".m4a", ".m4a"],
  [".aac", ".aac"],
  [".flac", ".flac"],
  [".ogg", ".ogg"],
  [".opus", ".opus"],
  [".mp4", ".mp4"],
  [".mov", ".mov"],
  [".mkv", ".mkv"],
  [".webm", ".webm"],
  [".avi", ".avi"],
  [".m4v", ".m4v"],
  [".zip", ".zip"],
  [".tar", ".tar"],
  [".gz", ".gz"],
  [".tgz", ".tgz"],
  [".bz2", ".bz2"],
  [".xz", ".xz"],
] as const;

const getElement = <T extends HTMLElement>(id: string) => {
  const element = document.getElementById(id);
  if (element === null) {
    throw new Error(`Missing demo element: #${id}`);
  }
  return element as T;
};

const getOptionalElement = <T extends HTMLElement>(id: string) => {
  return document.getElementById(id) as T | null;
};


const statusBackendEl = getElement<HTMLSpanElement>("status-table");
const statusModeEl = getElement<HTMLSpanElement>("status-mode");
const statusDimensionsEl = getElement<HTMLSpanElement>("status-vector-rows");
const statusNativeEnabledEl = getElement<HTMLSpanElement>("status-native-enabled");
const statusResolutionEl = getElement<HTMLSpanElement>("status-native-rows");
const statusDocumentsEl = getElement<HTMLSpanElement>("status-seed-chunk-size");
const statusChunkTotalEl = getElement<HTMLSpanElement>("status-document-total");
const statusSeedCountEl = getElement<HTMLSpanElement>("status-total-chunks");
const statusCustomCountEl = getOptionalElement<HTMLSpanElement>("status-last-seed");
const statusCapabilitiesEl = getElement<HTMLSpanElement>("status-native-path");
const statusModeSummaryEl = getElement<HTMLParagraphElement>("status-mode-summary");
const statusMessageEl = getElement<HTMLParagraphElement>("status-native-install-hint");
const headerNavEl = getElement<HTMLElement>("header-nav");
const presetContainerEl = getElement<HTMLDivElement>("search-presets");
const messageEl = getElement<HTMLParagraphElement>("demo-message");
const loadingEl = getElement<HTMLParagraphElement>("demo-loading");
const restoredEl = getElement<HTMLParagraphElement>("demo-restored");
const searchErrorEl = getElement<HTMLParagraphElement>("search-error");
const addErrorEl = getElement<HTMLParagraphElement>("add-error");
const searchResultsWrapper = getElement<HTMLDivElement>("search-results");
const searchResultGrid = getElement<HTMLDivElement>("search-result-grid");
const searchCountEl = getElement<HTMLParagraphElement>("search-count");
const searchMetaEl = getElement<HTMLParagraphElement>("search-meta");
const searchScopeSummaryEl = getElement<HTMLParagraphElement>("search-scope-summary");
const searchScopeHintEl = getElement<HTMLParagraphElement>("search-scope-hint");
const evaluationPresetContainerEl = getElement<HTMLDivElement>("evaluation-presets");
const uploadPresetContainerEl = getElement<HTMLDivElement>("upload-presets");
const uploadStatusEl = getElement<HTMLDivElement>("upload-status");
const uploadFileInputEl = getElement<HTMLInputElement>("upload-file-input");
const uploadFileButtonEl = getElement<HTMLButtonElement>("upload-file-btn");
const uploadFileSelectionEl = getElement<HTMLParagraphElement>("upload-file-selection");
const evaluationButtonEl = getElement<HTMLButtonElement>("evaluate-btn");
const evaluationMessageEl = getElement<HTMLParagraphElement>("evaluation-message");
const evaluationErrorEl = getElement<HTMLParagraphElement>("evaluation-error");
const evaluationResultsEl = getElement<HTMLDivElement>("evaluation-results");
const qualitySuiteListEl = getElement<HTMLUListElement>("quality-suite-list");
const qualitySuiteButtonEl = getElement<HTMLButtonElement>("quality-suite-btn");
const qualityLeaderboardListEl = getElement<HTMLUListElement>("quality-leaderboard-list");
const qualitySummaryListEl = getElement<HTMLUListElement>("quality-summary-list");
const qualityComparisonGridEl = getElement<HTMLDivElement>("quality-comparison-grid");
const documentListEl = getElement<HTMLElement>("document-list");
const documentCountTotalEl = getElement<HTMLElement>("document-count-total");
const documentCountBreakdownEl = getElement<HTMLElement>("document-count-breakdown");
const documentSearchEl = getElement<HTMLInputElement>("document-search");
const documentTypeFilterEl = getElement<HTMLSelectElement>("document-type-filter");
const documentPaginationSummaryEl = getElement<HTMLParagraphElement>("document-pagination-summary");
const documentPaginationControlsEl = getElement<HTMLDivElement>("document-pagination-controls");
const searchForm = getElement<HTMLFormElement>("search-form");
const addForm = getElement<HTMLFormElement>("add-form");
const streamForm = getElement<HTMLFormElement>("stream-form");
const streamModelKeyEl = getElement<HTMLSelectElement>("stream-model-key");
const streamQueryInput = getElement<HTMLInputElement>("stream-query");
const streamActionButton = getElement<HTMLButtonElement>("stream-action-btn");
const streamStageRow = getElement<HTMLDivElement>("stream-stage-row");
const streamStatsEl = getElement<HTMLDListElement>("stream-stats");
const streamErrorEl = getElement<HTMLParagraphElement>("stream-error");
const streamThinkingEl = getElement<HTMLDivElement>("stream-thinking");
const streamThinkingTextEl = getElement<HTMLParagraphElement>("stream-thinking-text");
const streamAnswerEl = getElement<HTMLDivElement>("stream-answer");
const streamAnswerTextEl = getElement<HTMLParagraphElement>("stream-answer-text");
const streamGroundingEl = getElement<HTMLDivElement>("stream-grounding");
const streamGroundingBadgeEl = getElement<HTMLParagraphElement>("stream-grounding-badge");
const streamGroundingListEl = getElement<HTMLUListElement>("stream-grounding-list");
const streamGroundingPartsEl = getElement<HTMLDivElement>("stream-grounding-parts");
const streamGroundingReferencesEl = getElement<HTMLDivElement>("stream-grounding-references");
const streamGroundingReferencesGridEl = getElement<HTMLDivElement>("stream-grounding-references-grid");
const streamSourcesEl = getElement<HTMLDivElement>("stream-sources");
const streamSourcesGridEl = getElement<HTMLDivElement>("stream-sources-grid");
const streamCitationsEl = getElement<HTMLDivElement>("stream-citations");
const streamCitationsGridEl = getElement<HTMLDivElement>("stream-citations-grid");
const streamContractListEl = getElement<HTMLUListElement>("stream-contract-list");
const streamProofListEl = getElement<HTMLUListElement>("stream-proof-list");
const opsErrorEl = getElement<HTMLParagraphElement>("ops-error");
const opsReadinessListEl = getElement<HTMLUListElement>("ops-readiness-list");
const opsHealthListEl = getElement<HTMLUListElement>("ops-health-list");
const opsFailureListEl = getElement<HTMLUListElement>("ops-failure-list");
const opsSyncSummaryListEl = getElement<HTMLUListElement>("ops-sync-summary-list");
const opsSyncSourcesListEl = getElement<HTMLUListElement>("ops-sync-sources-list");
const opsSyncActionsEl = getElement<HTMLDivElement>("ops-sync-actions");
const opsAdminJobsListEl = getElement<HTMLUListElement>("ops-admin-jobs-list");
const opsAdminActionsListEl = getElement<HTMLUListElement>("ops-admin-actions-list");
const syncAllButton = getElement<HTMLButtonElement>("sync-all-btn");
const syncAllBackgroundButton = getElement<HTMLButtonElement>("sync-all-background-btn");
const reseedButton = getElement<HTMLButtonElement>("reseed-btn");
const resetButton = getElement<HTMLButtonElement>("reset-btn");
const refreshButton = getElement<HTMLButtonElement>("refresh-btn");
const stateScopeChipEl = getElement<HTMLButtonElement>("state-scope-chip");
const stateDriverChipEl = getElement<HTMLButtonElement>("state-driver-chip");
const stateRerunChipEl = getElement<HTMLButtonElement>("state-rerun-chip");
const stateClearChipEl = getElement<HTMLButtonElement>("state-clear-chip");
const stateResultsChipEl = getElement<HTMLSpanElement>("state-results-chip");
const stateSyncRowEl = getElement<HTMLDivElement>("state-sync-row");
const stateRecentRowEl = getElement<HTMLDivElement>("state-recent-row");
let selectedMode: DemoBackendMode = getInitialBackendMode();
let backendOptions: DemoBackendDescriptor[] = getAvailableDemoBackends();
let activeRagPath = getRAGPathForMode(selectedMode);
let documentsCache: DemoDocument[] = [];
let chunkPreview: DemoChunkPreview | null = null;
let chunkPreviewLoadingDocumentId: string | null = null;
let evaluationResponse: RAGEvaluationResponse | null = null;
const evaluationSuite = buildDemoEvaluationSuite();
let suiteRuns: Array<Awaited<ReturnType<typeof runRAGEvaluationSuite>>> = [];
let qualityData: DemoRetrievalQualityResponse | null = null;
let aiModelCatalog: DemoAIModelCatalogResponse = { defaultModelKey: null, models: [] };
let scopeDriver = "manual filters";
let recentQueries: Array<{ label: string; state: SearchFormState }> = [];
let restoredSharedState = false;
let restoredSharedStateSummary = "";
let retrievalPresetId = "";
let benchmarkPresetId = "";
let uploadPresetId = "";
let selectedUploadFile: File | null = null;
let documentPage = 1;
let ragClient = createRAGClient({ path: activeRagPath });
let ragWorkflow = createRAGWorkflow(activeRagPath);
let unsubscribeStream = () => {};
const streamStages = ["submitting", "retrieving", "retrieved", "streaming", "complete"] as const;

const showMessage = (value: string) => {
  messageEl.textContent = value;
  messageEl.hidden = value.length === 0;
};

const showLoading = (value: string) => {
  loadingEl.textContent = value;
  loadingEl.hidden = value.length === 0;
};

const renderStateChips = () => {
  const state = readSearchFormState();
  stateScopeChipEl.textContent = formatRetrievalScopeSummary(state);
  stateDriverChipEl.textContent = `Changed by: ${scopeDriver.replace(/^row action: /, "row action · ")}`;
  stateRerunChipEl.disabled = state.query.trim().length === 0;
  stateResultsChipEl.textContent = `Results: ${searchResultsWrapper.hidden ? 0 : searchResultGrid.childElementCount}`;
  restoredEl.textContent = restoredSharedStateSummary;
  restoredEl.hidden = !restoredSharedState;
  stateRecentRowEl.innerHTML = "";
  for (const entry of recentQueries) {
    const button = document.createElement("button");
    button.className = "demo-state-chip";
    button.type = "button";
    button.textContent = entry.label;
    button.addEventListener("click", () => {
      void rerunRecentQuery(entry.state);
    });
    stateRecentRowEl.append(button);
  }
};

const clearRetrievalScope = async () => {
  scopeDriver = "chip reset";
  fillSearchForm({ kind: "", source: "", documentId: "" });
  void saveActiveRetrievalState("html", selectedMode, {
    searchForm: readSearchFormState(),
    scopeDriver,
    lastUpdatedAt: Date.now(),
    retrievalPresetId: retrievalPresetId || undefined,
    benchmarkPresetId: benchmarkPresetId || undefined,
    uploadPresetId: uploadPresetId || undefined,
  });
  if (readSearchFormState().query.trim().length > 0) {
    setError(searchErrorEl, "");
    hideSearchResults();
    await runSearchFromValues(readSearchForm());
  }
};

const clearAllRetrievalState = () => {
  scopeDriver = "clear all state";
  fillSearchForm({ query: "", kind: "", source: "", documentId: "", scoreThreshold: "" });
  void saveActiveRetrievalState("html", selectedMode, {
    searchForm: readSearchFormState(),
    scopeDriver,
    lastUpdatedAt: Date.now(),
    retrievalPresetId: retrievalPresetId || undefined,
    benchmarkPresetId: benchmarkPresetId || undefined,
    uploadPresetId: uploadPresetId || undefined,
  });
  hideSearchResults();
  setError(searchErrorEl, "");
};

const rerunLastQuery = async () => {
  const state = readSearchFormState();
  if (state.query.trim().length === 0) return;
  scopeDriver = "rerun last query";
  renderSearchScope();
  setError(searchErrorEl, "");
  hideSearchResults();
  await runSearchFromValues(state);
};

const rerunRecentQuery = async (state: SearchFormState) => {
  fillSearchForm(state);
  scopeDriver = "recent query";
  void saveActiveRetrievalState("html", selectedMode, {
    searchForm: readSearchFormState(),
    scopeDriver,
    lastUpdatedAt: Date.now(),
    retrievalPresetId: retrievalPresetId || undefined,
    benchmarkPresetId: benchmarkPresetId || undefined,
    uploadPresetId: uploadPresetId || undefined,
  });
  renderSearchScope();
  setError(searchErrorEl, "");
  hideSearchResults();
  await runSearchFromValues(state);
};

const isStreamStageComplete = (stage: typeof streamStages[number], currentStage: string) =>
  currentStage === "complete"
    ? stage === "complete" || streamStages.indexOf(stage) < streamStages.indexOf(currentStage as typeof streamStages[number])
    : streamStages.indexOf(stage) < streamStages.indexOf(currentStage as typeof streamStages[number]);

const isStreamBusy = () => {
  return ragWorkflow.isRunning;
};

const setError = (el: HTMLParagraphElement, value: string) => {
  el.textContent = value;
  el.hidden = value.length === 0;
};

const renderDetailList = (el: HTMLUListElement, lines: string[], fallback: string) => {
  el.innerHTML = "";
  for (const line of (lines.length > 0 ? lines : [fallback])) {
    const item = document.createElement("li");
    item.textContent = line;
    el.append(item);
  }
};

const renderQualityState = () => {
  renderDetailList(qualitySuiteListEl, [
    `${evaluationSuite.label ?? evaluationSuite.id} · ${evaluationSuite.input.cases.length} case(s)${evaluationSuite.description ? ` · ${evaluationSuite.description}` : ""}`
  ], "Saved suite unavailable.");
  renderDetailList(qualityLeaderboardListEl, suiteRuns.length > 0 ? buildRAGEvaluationLeaderboard(suiteRuns).map((entry) => formatEvaluationLeaderboardEntry(entry)) : ["Run the saved suite to rank workflow benchmark runs."], "Run the saved suite to rank workflow benchmark runs.");
  renderDetailList(qualitySummaryListEl, qualityData ? [...formatRetrievalComparisonSummary(qualityData.retrievalComparison), ...formatRerankerComparisonSummary(qualityData.rerankerComparison), formatGroundingEvaluationSummary(qualityData.groundingEvaluation), ...(qualityData.providerGroundingComparison ? formatGroundingProviderSummary(qualityData.providerGroundingComparison) : ["Configure an AI provider to compare real model-grounded answers."])] : ["Loading quality comparison..."], "Loading quality comparison...");

  if (!qualityData) {
    qualityComparisonGridEl.innerHTML = "";
    return;
  }

  const nextQualityData = qualityData;
  qualityComparisonGridEl.innerHTML = [
    ...nextQualityData.retrievalComparison.entries.map((entry) => `<article class="demo-result-item"><h4>${entry.label}</h4><p class="demo-metadata">${formatRetrievalComparisonEntry(entry)}</p></article>`),
    ...nextQualityData.rerankerComparison.entries.map((entry) => `<article class="demo-result-item"><h4>${entry.label}</h4><p class="demo-metadata">${formatRerankerComparisonEntry(entry)}</p></article>`),
    ...nextQualityData.groundingEvaluation.cases.map((entry) => `<article class="demo-result-item"><h4>${entry.label ?? entry.caseId}</h4><p class="demo-metadata">${formatGroundingEvaluationCase(entry)}</p><ul class="demo-detail-list">${formatGroundingEvaluationDetails(entry).map((line) => `<li>${line}</li>`).join("")}</ul></article>`),
    ...(nextQualityData.providerGroundingComparison ? nextQualityData.providerGroundingComparison.entries.map((entry) => `<article class="demo-result-item"><h4>${entry.label}</h4><p class="demo-metadata">${formatGroundingProviderEntry(entry)}</p></article>`) : []),
    ...(nextQualityData.providerGroundingComparison ? nextQualityData.providerGroundingComparison.entries.map((entry) => `<article class="demo-result-item"><h4>${entry.label} history</h4><ul class="demo-detail-list">${[...formatGroundingHistorySummary(nextQualityData.providerGroundingHistories[entry.providerKey]), ...formatGroundingHistoryDiff(nextQualityData.providerGroundingHistories[entry.providerKey]), ...formatGroundingHistorySnapshots(nextQualityData.providerGroundingHistories[entry.providerKey])].map((line) => `<li>${line}</li>`).join("")}</ul></article>`) : []),
    ...(nextQualityData.providerGroundingComparison ? nextQualityData.providerGroundingComparison.entries.map((entry) => `<article class="demo-result-item"><h4>${entry.label} artifact trail</h4><ul class="demo-detail-list">${formatGroundingHistoryArtifactTrail(nextQualityData.providerGroundingHistories[entry.providerKey]).map((line) => `<li>${line}</li>`).join("")}</ul></article>`) : []),
    ...(nextQualityData.providerGroundingComparison ? [`<article class="demo-result-item"><h4>Hardest grounding cases</h4><ul class="demo-detail-list">${nextQualityData.providerGroundingComparison.difficultyLeaderboard.map((entry) => `<li>${formatGroundingCaseDifficultyEntry(entry)}</li>`).join("")}</ul></article>`, `<article class="demo-result-item"><h4>Grounding difficulty history</h4><ul class="demo-detail-list">${[...formatGroundingDifficultyHistorySummary(nextQualityData.providerGroundingDifficultyHistory), ...formatGroundingDifficultyHistoryDiff(nextQualityData.providerGroundingDifficultyHistory)].map((line) => `<li>${line}</li>`).join("")}</ul></article>`] : []),
    ...(nextQualityData.providerGroundingComparison ? nextQualityData.providerGroundingComparison.caseComparisons.map((entry) => `<article class="demo-result-item"><h4>${entry.label}</h4><ul class="demo-detail-list">${[...formatGroundingProviderCaseSummary(entry), ...entry.entries.flatMap((candidate) => [formatGroundingProviderCaseEntry(candidate), ...formatGroundingProviderCaseDetails(candidate)])].map((line) => `<li>${line}</li>`).join("")}</ul></article>`) : []),
    ...nextQualityData.retrievalComparison.entries.map((entry) => `<article class="demo-result-item"><h4>${entry.label} history</h4><ul class="demo-detail-list">${[...formatEvaluationHistorySummary(nextQualityData.retrievalHistories[entry.retrievalId]), ...formatEvaluationHistoryDiff(nextQualityData.retrievalHistories[entry.retrievalId])].map((line) => `<li>${line}</li>`).join("")}</ul></article>`),
    ...nextQualityData.rerankerComparison.entries.map((entry) => `<article class="demo-result-item"><h4>${entry.label} history</h4><ul class="demo-detail-list">${[...formatEvaluationHistorySummary(nextQualityData.rerankerHistories[entry.rerankerId]), ...formatEvaluationHistoryDiff(nextQualityData.rerankerHistories[entry.rerankerId])].map((line) => `<li>${line}</li>`).join("")}</ul></article>`),
  ].join("");
};

const renderOpsState = (ops: Awaited<ReturnType<ReturnType<typeof createRAGClient>["ops"]>>) => {
  const sortedSyncSources = sortSyncSources(ops.syncSources);
  stateSyncRowEl.innerHTML = "";
  for (const chip of formatSyncDeltaChips(sortedSyncSources)) {
    const span = document.createElement("span");
    span.className = "demo-state-chip";
    span.textContent = chip.replace(/^sync /, "");
    stateSyncRowEl.append(span);
  }
  setError(opsErrorEl, "");
  renderDetailList(opsReadinessListEl, formatReadinessSummary(ops.readiness), "Readiness unavailable.");
  renderDetailList(opsHealthListEl, formatHealthSummary(ops.health), "Health unavailable.");
  renderDetailList(opsFailureListEl, formatFailureSummary(ops.health), "No recorded failures.");
  renderDetailList(
    opsSyncSummaryListEl,
    formatSyncSourceOverview(sortedSyncSources),
    "No sync sources configured yet.",
  );
  renderDetailList(
    opsSyncSourcesListEl,
    sortedSyncSources.length > 0
      ? sortedSyncSources.flatMap((source) => [
          formatSyncSourceSummary(source),
          ...formatSyncSourceDetails(source),
        ])
      : [],
    "No sync sources configured yet.",
  );
  opsSyncActionsEl.innerHTML = "";
  for (const source of sortedSyncSources) {
    const details = document.createElement("details");
    const summary = document.createElement("summary");
    const group = document.createElement("div");
    const actionRow = document.createElement("div");
    details.className =
      source.status === "failed"
        ? "demo-sync-action-details demo-sync-action-failed"
        : "demo-sync-action-details";
    details.open = source.status === "failed";
    summary.textContent = formatSyncSourceCollapsedSummary(source);
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = `Sync ${source.label}`;
    button.addEventListener("click", async () => {
      showMessage(`Syncing ${source.id}...`);
      try {
        await ragClient.syncSource(source.id);
        await refreshData();
      } catch (error) {
        showMessage(
          error instanceof Error ? `Failed to sync ${source.id}: ${error.message}` : `Failed to sync ${source.id}`,
        );
      }
    });
    actionRow.append(button);

    const backgroundButton = document.createElement("button");
    backgroundButton.type = "button";
    backgroundButton.textContent = `Queue ${source.label}`;
    backgroundButton.addEventListener("click", async () => {
      showMessage(`Queueing ${source.id} in the background...`);
      try {
        await ragClient.syncSource(source.id, { background: true });
        await refreshData();
      } catch (error) {
        showMessage(
          error instanceof Error ? `Failed to queue ${source.id}: ${error.message}` : `Failed to queue ${source.id}`,
        );
      }
    });
    actionRow.append(backgroundButton);

    if (source.status === "failed") {
      const retryButton = document.createElement("button");
      retryButton.type = "button";
      retryButton.textContent = "Retry now";
      retryButton.addEventListener("click", async () => {
        showMessage(`Retrying ${source.id}...`);
        try {
          await ragClient.syncSource(source.id);
          await refreshData();
        } catch (error) {
          showMessage(
            error instanceof Error ? `Failed to retry ${source.id}: ${error.message}` : `Failed to retry ${source.id}`,
          );
        }
      });
      actionRow.append(retryButton);

      const retryBackgroundButton = document.createElement("button");
      retryBackgroundButton.type = "button";
      retryBackgroundButton.textContent = "Retry in background";
      retryBackgroundButton.addEventListener("click", async () => {
        showMessage(`Queueing retry for ${source.id}...`);
        try {
          await ragClient.syncSource(source.id, { background: true });
          await refreshData();
        } catch (error) {
          showMessage(
            error instanceof Error ? `Failed to queue retry ${source.id}: ${error.message}` : `Failed to queue retry ${source.id}`,
          );
        }
      });
      actionRow.append(retryBackgroundButton);
    }

    const meta = document.createElement("p");
    meta.className = "demo-metadata demo-sync-action-meta";
    meta.textContent = formatSyncSourceActionSummary(source);

    const badges = document.createElement("div");
    badges.className = "demo-badge-row";
    for (const badgeText of formatSyncSourceActionBadges(source)) {
      const badge = document.createElement("span");
      badge.className = "demo-badge";
      badge.textContent = badgeText;
      badges.append(badge);
    }

    actionRow.className = "demo-actions";
    group.className = "demo-sync-action-group";
    group.append(actionRow, meta);
    if (badges.childElementCount > 0) {
      group.append(badges);
    }
    details.append(summary, group);
    opsSyncActionsEl.append(details);
  }
  renderDetailList(opsAdminJobsListEl, formatAdminJobList(ops.adminJobs), "No admin jobs recorded yet.");
  renderDetailList(opsAdminActionsListEl, formatAdminActionList(ops.adminActions), "No admin actions recorded yet.");
};

const renderAIModelOptions = () => {
  streamModelKeyEl.innerHTML = "";
  if (aiModelCatalog.models.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Configure an AI provider";
    streamModelKeyEl.append(option);
    return;
  }

  for (const model of aiModelCatalog.models) {
    const option = document.createElement("option");
    option.value = model.key;
    option.textContent = formatDemoAIModelLabel(model);
    if (model.key === (streamModelKeyEl.value || aiModelCatalog.defaultModelKey)) {
      option.selected = true;
    }
    streamModelKeyEl.append(option);
  }
};

const readSearchForm = (): SearchFormState => {
  const values = new FormData(searchForm);
  const query = toSafeText(values.get("query")?.toString() ?? "", "");
  const source = toSafeText(values.get("source")?.toString() ?? "", "");
  const kindValue = toSafeText(values.get("kind")?.toString() ?? "", "");
  const documentId = toSafeText(values.get("documentId")?.toString() ?? "", "");
  const scoreThreshold = toSafeText(values.get("scoreThreshold")?.toString() ?? "", "");
  const topKValue = toNumber(values.get("topK")?.toString() ?? "6", 6);
  const safeTopK = Math.min(20, Math.max(1, Math.floor(topKValue)));

  return {
    query,
    kind: kindValue === "seed" || kindValue === "custom" ? kindValue : "",
    source,
    topK: safeTopK,
    scoreThreshold,
    documentId,
  };
};

const readAddForm = (): AddFormState => {
  const values = new FormData(addForm);
  return {
    id: toSafeText(values.get("id")?.toString() ?? "", ""),
    title: toSafeText(values.get("title")?.toString() ?? "", ""),
    source: toSafeText(values.get("source")?.toString() ?? "", ""),
    format: demoContentFormats.includes(
      toSafeText(values.get("format")?.toString() ?? "", "markdown") as AddFormState["format"],
    )
      ? (toSafeText(values.get("format")?.toString() ?? "", "markdown") as AddFormState["format"])
      : "markdown",
    chunkStrategy: demoChunkingStrategies.includes(
      toSafeText(values.get("chunkStrategy")?.toString() ?? "", "source_aware") as AddFormState["chunkStrategy"],
    )
      ? (toSafeText(values.get("chunkStrategy")?.toString() ?? "", "source_aware") as AddFormState["chunkStrategy"])
      : "source_aware",
    text: toSafeText(values.get("text")?.toString() ?? "", ""),
  };
};

const renderStreamState = () => {
  const currentStage = ragWorkflow.stage;
  const latestMessage = ragWorkflow.latestAssistantMessage;
  const retrieval = ragWorkflow.retrieval;
  const workflowState = ragWorkflow.state;

  renderDetailList(streamContractListEl, [
    "Canonical entry point: createRAGWorkflow()",
    "Connected page surface: ragWorkflow",
    `Snapshot stage: ${workflowState.stage}`,
    `Live stage field: ${ragWorkflow.stage}`,
    `Snapshot sources: ${String(workflowState.sources.length)}`,
    `Snapshot running: ${workflowState.isRunning ? "yes" : "no"}`,
  ], "Workflow contract unavailable.");
  renderDetailList(streamProofListEl, [
    `Retrieved: ${workflowState.hasRetrieved ? "yes" : "no"}`,
    `Has sources: ${workflowState.hasSources ? "yes" : "no"}`,
    `Citation count: ${String(ragWorkflow.citations.length)}`,
    `Grounding coverage: ${ragWorkflow.groundedAnswer.coverage}`,
  ], "Workflow proof unavailable.");

  streamActionButton.textContent = isStreamBusy() ? "Cancel" : "Ask with retrieval stream";
  streamStageRow.innerHTML = "";
  for (const stage of streamStages) {
    const pill = document.createElement("span");
    pill.className = [
      "demo-stage-pill",
      currentStage === stage ? "current" : "",
      isStreamStageComplete(stage, currentStage) ? "complete" : "",
    ].filter(Boolean).join(" ");
    pill.textContent = stage;
    streamStageRow.append(pill);
  }

  if (retrieval) {
    streamStatsEl.hidden = false;
    streamStatsEl.innerHTML = `<div><dt>Retrieval started</dt><dd>${retrieval.retrievalStartedAt ? formatDate(retrieval.retrievalStartedAt) : "n/a"}</dd></div><div><dt>Retrieval duration</dt><dd>${String(retrieval.retrievalDurationMs ?? 0)}ms</dd></div><div><dt>Retrieved sources</dt><dd>${String(retrieval.sources.length)}</dd></div><div><dt>Current stage</dt><dd>${currentStage}</dd></div>`;
  } else {
    streamStatsEl.hidden = true;
    streamStatsEl.innerHTML = "";
  }

  setError(streamErrorEl, ragWorkflow.error ?? "");

  streamThinkingTextEl.textContent = latestMessage?.thinking ?? "";
  streamThinkingEl.hidden = !latestMessage?.thinking;
  streamAnswerTextEl.textContent = latestMessage?.content ?? "";
  streamAnswerEl.hidden = !latestMessage?.content;

  const groundedAnswer = ragWorkflow.groundedAnswer;
  const groundingReferences = ragWorkflow.groundingReferences;

  streamGroundingListEl.innerHTML = "";
  streamGroundingPartsEl.innerHTML = "";
  if ((latestMessage?.content ?? "").length > 0) {
    streamGroundingEl.hidden = false;
    streamGroundingBadgeEl.className = ["demo-grounding-badge", `demo-grounding-${groundedAnswer.coverage}`].join(" ");
    streamGroundingBadgeEl.textContent = formatGroundingCoverage(groundedAnswer.coverage);
    for (const line of formatGroundingSummary(groundedAnswer)) {
      const item = document.createElement("li");
      item.textContent = line;
      streamGroundingListEl.append(item);
    }
    for (const part of groundedAnswer.parts) {
      if (part.type !== "citation") {
        continue;
      }
      const card = document.createElement("article");
      card.className = "demo-result-item demo-grounding-card";
      card.innerHTML = `<p class="demo-citation-badge">${formatGroundingPartReferences(part.referenceNumbers)}</p>${formatGroundedAnswerPartDetails(part).map((line) => `<p class="demo-metadata">${line}</p>`).join("")}<p class="demo-result-text">${part.text}</p>`;
      streamGroundingPartsEl.append(card);
    }
  } else {
    streamGroundingEl.hidden = true;
  }

  streamGroundingReferencesGridEl.innerHTML = "";
  if (groundingReferences.length > 0) {
    streamGroundingReferencesEl.hidden = false;
    for (const reference of groundingReferences) {
      const card = document.createElement("article");
      card.className = "demo-result-item demo-grounding-card";
      card.innerHTML = `<p class="demo-citation-badge">[${String(reference.number)}] ${formatGroundingReferenceLabel(reference)}</p><p class="demo-result-score">${formatGroundingReferenceSummary(reference)}</p>${formatGroundingReferenceDetails(reference).map((line) => `<p class="demo-metadata">${line}</p>`).join("")}<p class="demo-result-text">${formatGroundingReferenceExcerpt(reference)}</p>`;
      streamGroundingReferencesGridEl.append(card);
    }
  } else {
    streamGroundingReferencesEl.hidden = true;
  }

  streamSourcesGridEl.innerHTML = "";
  if (ragWorkflow.sourceSummaries.length > 0) {
    streamSourcesEl.hidden = false;
    for (const summary of ragWorkflow.sourceSummaries) {
      const card = document.createElement("article");
      card.className = "demo-result-item";
      card.innerHTML = `<h3>${summary.label}</h3>${formatSourceSummaryDetails(summary).map((line) => `<p class="demo-metadata">${line}</p>`).join("")}<p class="demo-result-text">${summary.excerpt}</p>`;
      streamSourcesGridEl.append(card);
    }
  } else {
    streamSourcesEl.hidden = true;
  }

  streamCitationsGridEl.innerHTML = "";
  const citations = ragWorkflow.citations;
  if (citations.length > 0) {
    streamCitationsEl.hidden = false;
    for (const [index, citation] of citations.entries()) {
      const card = document.createElement("article");
      card.className = "demo-result-item demo-citation-card";
      card.innerHTML = `<p class="demo-citation-badge">[${String(index + 1)}] ${formatCitationLabel(citation)}</p><p class="demo-result-score">${formatCitationSummary(citation)}</p>${formatCitationDetails(citation).map((line) => `<p class="demo-metadata">${line}</p>`).join("")}<p class="demo-result-text">${formatCitationExcerpt(citation)}</p>`;
      streamCitationsGridEl.append(card);
    }
  } else {
    streamCitationsEl.hidden = true;
  }
};

unsubscribeStream = ragWorkflow.subscribe(renderStreamState);

const resetStreamConnection = () => {
  unsubscribeStream();
  ragWorkflow.destroy();
  ragWorkflow = createRAGWorkflow(activeRagPath);
  unsubscribeStream = ragWorkflow.subscribe(renderStreamState);
  renderStreamState();
};

const clearChunkPreview = (message = "Pick a document and click Inspect chunks to compare the normalized text with the final chunk boundaries.") => {
  chunkPreview = null;
  chunkPreviewLoadingDocumentId = null;
  formatDocuments(documentsCache, message);
};

const renderChunkPreview = (preview: DemoChunkPreview) => {
  chunkPreview = preview;
  chunkPreviewLoadingDocumentId = null;
  formatDocuments(documentsCache);
};

const inferDocumentExtension = (document: DemoDocument) => {
  const candidates = [document.source, document.title];
  for (const candidate of candidates) {
    const match = candidate.toLowerCase().match(/(\.[a-z0-9]+)(?:[#?].*)?$/);
    if (match) {
      return match[1];
    }
  }

  if (document.format === "markdown") {
    return ".md";
  }
  if (document.format === "html") {
    return ".html";
  }
  return ".txt";
};

const getFilteredDocuments = () => {
  const query = documentSearchEl.value.trim().toLowerCase();
  const type = documentTypeFilterEl.value;
  return documentsCache.filter((document) => {
    const matchesQuery =
      query.length === 0 ||
      document.title.toLowerCase().includes(query) ||
      document.source.toLowerCase().includes(query) ||
      document.text.toLowerCase().includes(query);
    const matchesType = type === "all" || inferDocumentExtension(document) === type;
    return matchesQuery && matchesType;
  });
};

const getChunkIndexText = (chunk: { metadata?: Record<string, unknown> }, fallbackCount: number) => {
  const chunkIndex = typeof chunk.metadata?.chunkIndex === "number" ? chunk.metadata.chunkIndex : 0;
  const chunkCount = typeof chunk.metadata?.chunkCount === "number" ? chunk.metadata.chunkCount : fallbackCount;
  return `chunk index: ${String(chunkIndex)} / count: ${String(chunkCount)}`;
};

const inspectChunks = async (id: string) => {
  chunkPreviewLoadingDocumentId = id;
  formatDocuments(documentsCache);
  try {
    const preview = await ragClient.documentChunks(id);
    if (!preview.ok) {
      throw new Error(preview.error);
    }
    renderChunkPreview(preview as DemoChunkPreview);
  } catch (error) {
    clearChunkPreview(
      error instanceof Error ? `Failed to inspect ${id}: ${error.message}` : `Failed to inspect ${id}`,
    );
  }
};

const formatDocuments = (documents: DemoDocument[], emptyPreviewMessage = "Pick a document and click Inspect chunks to compare the normalized text with the final chunk boundaries.") => {
  const filteredDocuments = getFilteredDocuments();
  const totalDocumentPages = Math.max(1, Math.ceil(filteredDocuments.length / DOCUMENTS_PER_PAGE));
  documentPage = Math.min(totalDocumentPages, Math.max(1, documentPage));
  const paginatedDocuments = filteredDocuments.slice((documentPage - 1) * DOCUMENTS_PER_PAGE, documentPage * DOCUMENTS_PER_PAGE);

  documentCountTotalEl.textContent = String(filteredDocuments.length);
  documentCountBreakdownEl.textContent = `${filteredDocuments.filter((document) => document.kind === "seed").length} seed · ${filteredDocuments.filter((document) => document.kind === "custom").length} custom`;
  documentPaginationSummaryEl.textContent = `Showing ${paginatedDocuments.length} of ${filteredDocuments.length} matching documents`;
  documentPaginationControlsEl.innerHTML = "";

  const prevButton = document.createElement("button");
  prevButton.type = "button";
  prevButton.textContent = "Prev";
  prevButton.disabled = documentPage <= 1;
  prevButton.addEventListener("click", () => {
    documentPage = Math.max(1, documentPage - 1);
    formatDocuments(documentsCache);
  });
  documentPaginationControlsEl.append(prevButton);

  for (let pageNumber = 1; pageNumber <= totalDocumentPages; pageNumber += 1) {
    const pageButton = document.createElement("button");
    pageButton.type = "button";
    pageButton.className = pageNumber === documentPage ? "demo-page-button demo-page-button-active" : "demo-page-button";
    pageButton.textContent = String(pageNumber);
    pageButton.addEventListener("click", () => {
      documentPage = pageNumber;
      formatDocuments(documentsCache);
    });
    documentPaginationControlsEl.append(pageButton);
  }

  const nextButton = document.createElement("button");
  nextButton.type = "button";
  nextButton.textContent = "Next";
  nextButton.disabled = documentPage >= totalDocumentPages;
  nextButton.addEventListener("click", () => {
    documentPage = Math.min(totalDocumentPages, documentPage + 1);
    formatDocuments(documentsCache);
  });
  documentPaginationControlsEl.append(nextButton);

  if (filteredDocuments.length === 0) {
    documentListEl.innerHTML = "<p class=\"demo-metadata\">No indexed sources match the current filters.</p>";
    return;
  }

  const wrapper = document.createElement("div");
  wrapper.className = "demo-document-list";

  for (const doc of paginatedDocuments) {
    const details = document.createElement("details");
    details.className = "demo-document-item demo-document-collapsible";
    const summary = document.createElement("summary");
    const header = document.createElement("div");
    header.className = "demo-document-header";
    const titleWrap = document.createElement("div");
    const title = document.createElement("h3");
    const subtitle = document.createElement("p");
    title.textContent = doc.title;
    subtitle.className = "demo-metadata";
    subtitle.textContent = `${doc.source} · ${doc.kind} · ${doc.chunkCount} chunk(s)`;
    titleWrap.append(title, subtitle);
    const badgeRow = document.createElement("div");
    badgeRow.className = "demo-badge-row";
    for (const badgeText of [
      formatContentFormat(doc.format),
      formatChunkStrategy(doc.chunkStrategy),
      `chunk target ${doc.chunkSize} chars`,
    ]) {
      const badge = document.createElement("span");
      badge.className = "demo-badge";
      badge.textContent = badgeText;
      badgeRow.append(badge);
    }
    header.append(titleWrap, badgeRow);
    summary.append(header);

    const content = document.createElement("div");
    content.className = "demo-collapsible-content";
    const action = document.createElement("div");
    action.className = "demo-actions";

    const inspectButton = document.createElement("button");
    inspectButton.type = "button";
    inspectButton.textContent = "Inspect chunks";
    inspectButton.addEventListener("click", () => {
      details.open = true;
      void inspectChunks(doc.id);
    });
    action.append(inspectButton);

    const quickSearch = document.createElement("button");
    quickSearch.type = "button";
    quickSearch.textContent = "Search source";
    quickSearch.addEventListener("click", () => {
      scopeDriver = `row action: source ${doc.source}`;
      setSearchValue("documentId", "");
      setSearchValue("source", doc.source);
      setSearchValue("query", `Source search for ${doc.source}`);
      searchForm.requestSubmit();
    });
    action.append(quickSearch);

    const documentSearch = document.createElement("button");
    documentSearch.type = "button";
    documentSearch.textContent = "Search document";
    documentSearch.addEventListener("click", () => {
      scopeDriver = `row action: document ${doc.id}`;
      setSearchValue("source", "");
      setSearchValue("documentId", doc.id);
      setSearchValue("query", `Explain ${doc.title}`);
      searchForm.requestSubmit();
    });
    action.append(documentSearch);

    if (doc.kind === "custom") {
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.textContent = "Delete";
      deleteButton.dataset.documentId = doc.id;
      deleteButton.addEventListener("click", async (event) => {
        const button = event.currentTarget as HTMLButtonElement;
        const id = button.dataset.documentId;
        if (id === undefined) return;

        showMessage(`Deleting ${id}...`);
        try {
          const result = await ragClient.deleteDocument(id);
          if (!result.ok) {
            throw new Error(result.error ?? `Failed to delete ${id}`);
          }
          showMessage(`Deleted ${id}`);
          if (chunkPreview?.document.id === id) {
            clearChunkPreview();
          }
          await refreshData();
        } catch (error) {
          showMessage(
            error instanceof Error
              ? `Failed to delete ${id}: ${error.message}`
              : `Failed to delete ${id}`,
          );
        }
      });
      action.append(deleteButton);
    }

    const keyValueGrid = document.createElement("div");
    keyValueGrid.className = "demo-key-value-grid";
    const appendKeyValue = (label: string, value: string) => {
      const row = document.createElement("div");
      row.className = "demo-key-value-row";
      row.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
      keyValueGrid.append(row);
    };
    appendKeyValue("Source", doc.source);
    appendKeyValue("Created", formatDate(doc.createdAt));
    appendKeyValue("Kind", doc.kind);
    appendKeyValue("Chunks", String(doc.chunkCount));
    for (const line of formatDemoMetadataSummary(doc.metadata)) {
      appendKeyValue("Metadata", line);
    }

    const previewText = document.createElement("p");
    previewText.className = "demo-document-preview";
    previewText.textContent = doc.text;

    const inlinePreview = document.createElement("div");
    inlinePreview.className = "demo-inline-preview";
    if (chunkPreviewLoadingDocumentId === doc.id) {
      const loading = document.createElement("p");
      loading.className = "demo-metadata";
      loading.textContent = "Preparing chunk preview...";
      inlinePreview.append(loading);
    } else if (chunkPreview?.document.id === doc.id) {
      const caption = document.createElement("p");
      caption.className = "demo-section-caption";
      caption.textContent = "Chunk Preview";
      const summaryText = document.createElement("p");
      summaryText.className = "demo-metadata";
      summaryText.textContent = `${chunkPreview.document.title} · ${formatContentFormat(chunkPreview.document.format)} · ${formatChunkStrategy(chunkPreview.document.chunkStrategy)} · ${chunkPreview.chunks.length} chunk(s)`;
      const normalizedCard = document.createElement("article");
      normalizedCard.className = "demo-result-item";
      normalizedCard.innerHTML = `<h3>Normalized text</h3><p class="demo-result-text">${chunkPreview.normalizedText}</p>`;
      const previewGrid = document.createElement("div");
      previewGrid.className = "demo-result-grid";
      for (const chunk of chunkPreview.chunks) {
        const card = document.createElement("article");
        card.className = "demo-result-item";
        card.innerHTML = `<h3>${chunk.chunkId}</h3><p class="demo-result-source">source: ${chunk.source ?? chunkPreview.document.source}</p><p class="demo-metadata">${getChunkIndexText(chunk, chunkPreview.chunks.length)}</p><p class="demo-result-text">${chunk.text}</p>`;
        previewGrid.append(card);
      }
      inlinePreview.append(caption, summaryText, normalizedCard, previewGrid);
    } else if (chunkPreviewLoadingDocumentId === null && chunkPreview === null) {
      const hint = document.createElement("p");
      hint.className = "demo-metadata";
      hint.textContent = emptyPreviewMessage;
      inlinePreview.append(hint);
    }

    content.append(action, keyValueGrid, previewText, inlinePreview);
    details.append(summary, content);
    wrapper.append(details);
  }

  documentListEl.innerHTML = "";
  documentListEl.append(wrapper);
};

const formatStatus = (status: DemoStatusView) => {
  const statusRerankerEl = document.getElementById("status-reranker");
  const statusRerankerSummaryEl = document.getElementById("status-reranker-summary");
  statusBackendEl.textContent = status.backend;
  statusModeEl.textContent = status.vectorMode;
  statusDimensionsEl.textContent = status.dimensions === undefined ? "n/a" : `${status.dimensions}`;
  statusNativeEnabledEl.textContent = status.native.active ? "active" : "inactive";
  statusResolutionEl.textContent = status.native.sourceLabel ?? "Not applicable";
  statusDocumentsEl.textContent = `${status.documents.total}`;
  statusChunkTotalEl.textContent = `${status.chunkCount}`;
  statusSeedCountEl.textContent = `${status.documents.byKind.seed}`;
  if (statusCustomCountEl !== null) {
    statusCustomCountEl.textContent = `${status.documents.byKind.custom}`;
  }
  statusCapabilitiesEl.textContent = status.capabilities.join(" · ");
  statusModeSummaryEl.textContent =
    status.native.active
      ? "Native vector acceleration is active."
      : "Owned JSON fallback retrieval is active.";
  statusMessageEl.textContent = status.native.fallbackReason ?? status.vectorModeMessage;
  if (statusRerankerEl !== null) {
    statusRerankerEl.textContent = status.reranker.label;
  }
  if (statusRerankerSummaryEl !== null) {
    statusRerankerSummaryEl.textContent = status.reranker.summary;
  }
};

const setSearchValue = (name: string, value: string) => {
  const field = searchForm.elements.namedItem(name) as
    | HTMLInputElement
    | HTMLSelectElement
    | null;
  if (field === null) return;
  field.value = value;
  renderSearchScope();
};

const readSearchFormState = (): SearchFormState => ({
  query: toSafeText(
    (searchForm.elements.namedItem("query") as HTMLInputElement | null)?.value ?? "",
  ),
  topK: toNumber(
    (searchForm.elements.namedItem("topK") as HTMLInputElement | null)?.value ?? "6",
    6,
  ),
  scoreThreshold: toSafeText(
    (searchForm.elements.namedItem("scoreThreshold") as HTMLInputElement | null)?.value ?? "",
  ),
  kind:
    (((searchForm.elements.namedItem("kind") as HTMLSelectElement | null)?.value ?? "") as SearchFormState["kind"]) ||
    "",
  source: toSafeText(
    (searchForm.elements.namedItem("source") as HTMLInputElement | null)?.value ?? "",
  ),
  documentId: toSafeText(
    (searchForm.elements.namedItem("documentId") as HTMLInputElement | null)?.value ?? "",
  ),
});

const renderSearchScope = () => {
  const state = readSearchFormState();
  searchScopeSummaryEl.textContent = formatRetrievalScopeSummary(state);
  searchScopeHintEl.textContent = `${formatRetrievalScopeHint(state)} Scope changed by: ${scopeDriver}.`;
  const sourceField = searchForm.elements.namedItem("source") as HTMLInputElement | null;
  const documentField = searchForm.elements.namedItem("documentId") as HTMLInputElement | null;
  sourceField?.classList.toggle("demo-filter-active", state.source.trim().length > 0);
  documentField?.classList.toggle("demo-filter-active", state.documentId.trim().length > 0);
  renderStateChips();
};

const fillSearchForm = (state: Partial<SearchFormState>) => {
  const query = state.query ?? "";
  if (query.length > 0) {
    setSearchValue("query", query);
  }

  const topK = state.topK;
  if (typeof topK === "number" && topK > 0) {
    setSearchValue("topK", String(topK));
  }

  setSearchValue("kind", state.kind ?? "");
  setSearchValue("source", state.source ?? "");
  setSearchValue("scoreThreshold", state.scoreThreshold ?? "");
  setSearchValue("documentId", state.documentId ?? "");
};

const runSearchFromValues = async (state: SearchFormState) => {
  if (state.query.length === 0) {
    setError(searchErrorEl, "query is required");
    return;
  }

  const payload = buildSearchPayload(state);

  try {
    const start = Date.now();
    const results = await ragClient.search(payload as never);
    recentQueries = [
      { label: state.query, state: { ...state } },
      ...recentQueries.filter((entry) => JSON.stringify(entry.state) !== JSON.stringify(state)),
    ].slice(0, 4);
    void saveRecentQueries("html", selectedMode, recentQueries);
    void saveActiveRetrievalState("html", selectedMode, {
      searchForm: state,
      scopeDriver,
      lastUpdatedAt: Date.now(),
      retrievalPresetId: retrievalPresetId || undefined,
      benchmarkPresetId: benchmarkPresetId || undefined,
      uploadPresetId: uploadPresetId || undefined,
    });

    renderSearchResults({
      query: state.query,
      elapsedMs: Date.now() - start,
      topK: typeof payload.topK === "number" ? payload.topK : 6,
      count: results.length,
      chunks: results.map((result) => ({
        chunkId: result.chunkId,
        title: result.title ?? result.chunkId,
        source: result.source ?? "unknown",
        score: result.score,
        metadata: result.metadata ?? {},
        text: result.text,
      })),
      filter: Object.fromEntries(
        Object.entries(payload)
          .filter(([key, value]) => ["kind", "source", "documentId"].includes(key) && typeof value === "string" && value.length > 0)
          .map(([key, value]) => [key, value as string]),
      ),
    });
    searchMetaEl.textContent =
      `${formatRetrievalScopeSummary(state)}. Reranking is active: AbsoluteJS reorders the first vector hits with the built-in heuristic provider before these results render. Verification rule: a good result shows chunk text that answers the query and a source label you can trace back to the indexed source list.`;
  } catch (error) {
    setError(
      searchErrorEl,
      error instanceof Error ? `Search failed: ${error.message}` : "Search failed",
    );
  }
};

const renderSearchResults = (result: SearchResponse) => {
  searchResultsWrapper.hidden = false;
  searchCountEl.textContent = `${result.count} results for “${result.query}” in ${result.elapsedMs}ms`;
  renderStateChips();
  if (result.count === 0) {
    searchResultGrid.innerHTML = "<p>No matching chunks.</p>";
    return;
  }

  searchResultGrid.innerHTML = "";
  for (const chunk of result.chunks) {
    const card = document.createElement("article");
    const title = document.createElement("h3");
    const score = document.createElement("p");
    const source = document.createElement("p");
    const text = document.createElement("p");

    card.className = "demo-result-item";
    title.textContent = chunk.title;
    score.className = "demo-result-score";
    score.textContent = `score: ${formatScore(chunk.score)}`;
    source.className = "demo-result-source";
    source.textContent = `source: ${chunk.source}`;
    text.className = "demo-result-text";
    text.textContent = chunk.text;
    const metadataNodes = formatDemoMetadataSummary(chunk.metadata).map((line) => {
      const metadataLine = document.createElement("p");
      metadataLine.className = "demo-metadata";
      metadataLine.textContent = line;
      return metadataLine;
    });

    card.append(title, score, source, ...metadataNodes, text);
    searchResultGrid.append(card);
  }
};

const hideSearchResults = () => {
  searchResultsWrapper.hidden = true;
  searchCountEl.textContent = "";
  searchMetaEl.textContent = "";
  searchResultGrid.innerHTML = "";
  renderStateChips();
};

const clearEvaluationResults = () => {
  evaluationResponse = null;
  evaluationResultsEl.hidden = true;
  evaluationResultsEl.innerHTML = "";
  evaluationMessageEl.hidden = true;
  evaluationMessageEl.textContent = "";
  setError(evaluationErrorEl, "");
};

const renderEvaluationResults = (response: RAGEvaluationResponse) => {
  evaluationResponse = response;
  evaluationResultsEl.hidden = false;
  evaluationResultsEl.innerHTML = "";
  evaluationMessageEl.hidden = false;
  evaluationMessageEl.textContent = `Benchmark summary: ${formatEvaluationSummary(response)}`;

  for (const entry of response.cases) {
    const card = document.createElement("article");
    card.className = `demo-result-item demo-evaluation-card demo-evaluation-${entry.status}`;
    card.innerHTML = `<h4>${entry.label ?? entry.caseId}</h4><p class="demo-result-source">${entry.query}</p><p class="demo-evaluation-status">${entry.status.toUpperCase()}</p><p class="demo-metadata">${formatEvaluationCaseSummary(entry)}</p><p class="demo-metadata">expected: ${formatEvaluationExpected(entry)}</p><p class="demo-metadata">retrieved: ${formatEvaluationRetrieved(entry)}</p><p class="demo-result-text">missing: ${formatEvaluationMissing(entry)}</p>`;
    evaluationResultsEl.append(card);
  }
};

const runSavedSuite = async () => {
  setError(evaluationErrorEl, "");
  showMessage("");
  qualitySuiteButtonEl.disabled = true;

  try {
    const run = await runRAGEvaluationSuite({
      suite: evaluationSuite,
      evaluate: (input) => ragClient.evaluate(input),
    });
    suiteRuns = [run, ...suiteRuns];
    renderQualityState();
    showMessage(`Saved suite run finished in ${run.elapsedMs}ms and ranked ${buildRAGEvaluationLeaderboard(suiteRuns).length} workflow run(s).`);
  } catch (error) {
    setError(evaluationErrorEl, error instanceof Error ? `Saved suite failed: ${error.message}` : "Saved suite failed");
  } finally {
    qualitySuiteButtonEl.disabled = false;
  }
};

const runEvaluation = async () => {
  clearEvaluationResults();
  evaluationButtonEl.disabled = true;
  evaluationButtonEl.textContent = "Running benchmark suite...";

  try {
    const response = await ragClient.evaluate(buildDemoEvaluationInput());
    evaluationMessageEl.hidden = false;
    evaluationMessageEl.textContent = `Benchmark suite finished in ${response.elapsedMs}ms across ${response.totalCases} benchmark queries.`;
    renderEvaluationResults(response);
  } catch (error) {
    setError(
      evaluationErrorEl,
      error instanceof Error ? `Evaluation failed: ${error.message}` : "Evaluation failed",
    );
  } finally {
    evaluationButtonEl.disabled = false;
    evaluationButtonEl.textContent = "Run benchmark suite";
  }
};

const renderHeaderNav = () => {
  headerNavEl.innerHTML = "";

  const frameworkIds = ["react", "svelte", "vue", "angular", "html", "htmx"] as const;
  for (const backend of backendOptions) {
    const row = document.createElement("div");
    row.className = "demo-nav-row";

    const label = document.createElement("span");
    label.className = backend.id === selectedMode ? "demo-nav-row-label active" : "demo-nav-row-label";
    label.textContent = backend.label;
    row.append(label);

    for (const frameworkId of frameworkIds) {
      const anchor = document.createElement("a");
      anchor.textContent = frameworkId === "htmx"
        ? "HTMX"
        : frameworkId === "html"
          ? "HTML"
          : frameworkId[0].toUpperCase() + frameworkId.slice(1);
      if (backend.available) {
        anchor.href = getDemoPagePath(frameworkId, backend.id);
      } else {
        anchor.classList.add("disabled");
        anchor.setAttribute("aria-disabled", "true");
        if (backend.reason) {
          anchor.title = backend.reason;
        }
      }
      if (frameworkId === "html" && backend.id === selectedMode) {
        anchor.classList.add("active");
      }
      row.append(anchor);
    }

    headerNavEl.append(row);
  }
};

const runUploadPreset = async (preset: DemoUploadPreset) => {
  uploadStatusEl.innerHTML = '<p class="demo-metadata">Uploading ' + preset.label + '...</p>';
  try {
    const fixture = await fetch(getDemoUploadFixtureUrl(preset.id));
    if (!fixture.ok) {
      throw new Error('Failed to load ' + preset.fileName + ': ' + String(fixture.status));
    }

    const response = await ragClient.ingestUploads(
      buildDemoUploadIngestInput(preset, encodeArrayBufferToBase64(await fixture.arrayBuffer())),
    );
    if (!response.ok) {
      throw new Error(response.error ?? 'Upload ingest failed');
    }

    uploadStatusEl.innerHTML = '<p class="demo-banner">Uploaded ' + preset.label + ' through the extractor-backed ingest route.</p><p class="demo-metadata">Verification query: ' + preset.query + '</p><p class="demo-metadata">Expected uploaded source: ' + (preset.expectedSources[0] ?? preset.source) + '</p>';
    uploadPresetId = preset.id;
    fillSearchForm({ query: preset.query, source: preset.expectedSources[0] ?? preset.source, topK: 6 });
    await runSearchFromValues(readSearchForm());
  } catch (error) {
    uploadStatusEl.innerHTML = '<p class="demo-error">' + (error instanceof Error ? 'Upload failed: ' + error.message : 'Upload failed') + '</p>';
  }
};

const renderUploadPresets = () => {
  uploadPresetContainerEl.innerHTML = '';
  for (const preset of demoUploadPresets) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = preset.label;
    button.title = preset.description;
    button.addEventListener('click', () => {
      void runUploadPreset(preset);
    });
    uploadPresetContainerEl.append(button);
  }
};

const uploadSelectedDocumentFile = async () => {
  if (selectedUploadFile === null) {
    uploadStatusEl.innerHTML = '<p class="demo-error">Choose a file before uploading.</p>';
    return;
  }

  uploadStatusEl.innerHTML = `<p class="demo-metadata">Uploading ${selectedUploadFile.name}...</p>`;
  try {
    const uploadedName = selectedUploadFile.name;
    const response = await ragClient.ingestUploads({
      baseMetadata: {
        fileKind: "uploaded-user-file",
        kind: "custom",
      },
      uploads: [
        {
          name: uploadedName,
          source: `uploads/${uploadedName}`,
          title: uploadedName,
          contentType: selectedUploadFile.type || "application/octet-stream",
          encoding: "base64",
          content: encodeArrayBufferToBase64(await selectedUploadFile.arrayBuffer()),
          metadata: {
            kind: "custom",
            uploadedFrom: "html-general-upload",
          },
        },
      ],
    });
    if (!response.ok) {
      throw new Error(response.error ?? "Upload ingest failed");
    }

    uploadStatusEl.innerHTML = `<p class="demo-banner">Uploaded ${uploadedName}. Extracted ${String(response.count ?? 0)} chunk(s) across ${String(response.documentCount ?? 1)} document(s).</p>`;
    selectedUploadFile = null;
    uploadFileInputEl.value = "";
    uploadFileSelectionEl.hidden = true;
    uploadFileSelectionEl.textContent = "";
    await refreshData();
    fillSearchForm({ query: `Explain ${uploadedName}`, source: `uploads/${uploadedName}`, topK: 6 });
    scopeDriver = "upload verification";
    await runSearchFromValues(readSearchForm());
  } catch (error) {
    uploadStatusEl.innerHTML = `<p class="demo-error">${error instanceof Error ? `Upload failed: ${error.message}` : "Upload failed"}</p>`;
  }
};

const renderDocumentTypeOptions = () => {
  documentTypeFilterEl.innerHTML = "";
  for (const [value, label] of SUPPORTED_FILE_TYPE_OPTIONS) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    option.selected = value === documentTypeFilterEl.value || (documentTypeFilterEl.value === "" && value === "all");
    documentTypeFilterEl.append(option);
  }
};

const renderEvaluationPresets = () => {
  evaluationPresetContainerEl.innerHTML = "";

  for (const preset of demoEvaluationPresets) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = preset.label;
    button.title = preset.description;
    button.addEventListener("click", () => {
      fillSearchForm({
        query: preset.query,
        source: preset.expectedSources[0] ?? "",
        topK: 4,
      });
      benchmarkPresetId = preset.id;
      retrievalPresetId = "";
      uploadPresetId = "";
      scopeDriver = `benchmark preset: ${preset.label}`;
      void runSearchFromValues(readSearchForm());
    });
    evaluationPresetContainerEl.append(button);
  }
};

const loadBackendOptions = async () => {
  try {
    const response = await fetch("/demo/backends");
    if (!response.ok) {
      throw new Error(`Failed to load backend availability: ${response.status}`);
    }
    backendOptions = getAvailableDemoBackends((await response.json()) as DemoBackendDescriptor[]);
  } catch {
    backendOptions = getAvailableDemoBackends();
  }
};

const refreshData = async () => {
  showLoading("Loading status and documents...");
  setError(searchErrorEl, "");
  setError(addErrorEl, "");
  try {
    const nextMode = selectedMode;
    activeRagPath = getRAGPathForMode(nextMode);
    ragClient = createRAGClient({ path: activeRagPath });
    resetStreamConnection();
    await loadBackendOptions();
    renderHeaderNav();

    const [statusData, docsData, opsData, aiModelsResponse, qualityResponse] = await Promise.all([
      ragClient.status(),
      ragClient.documents(),
      ragClient.ops(),
      fetch("/demo/ai-models").then((response) => response.json()) as Promise<DemoAIModelCatalogResponse>,
      fetch(`/demo/quality/${selectedMode}`).then((response) => response.json()) as Promise<DemoRetrievalQualityResponse>,
    ]);
    aiModelCatalog = aiModelsResponse;
    qualityData = qualityResponse;
    renderQualityState();
    if (!streamModelKeyEl.value) {
      streamModelKeyEl.value = aiModelsResponse.defaultModelKey ?? aiModelsResponse.models[0]?.key ?? "";
    }
    renderAIModelOptions();

    const formatted = buildStatusView(
      statusData.status as never,
      statusData.capabilities as never,
      docsData.documents as DemoDocument[],
      selectedMode,
    );
    if (formatted !== null) {
      formatStatus(formatted);
    }
    documentsCache = docsData.documents as DemoDocument[];
    renderEvaluationPresets();
    renderUploadPresets();
    renderDocumentTypeOptions();
    renderOpsState(opsData);
    formatDocuments(documentsCache);
    if (chunkPreview !== null && !documentsCache.some((document) => document.id === chunkPreview?.document.id)) {
      clearChunkPreview();
    }
    showMessage("");
  } catch (error) {
    showMessage(
      error instanceof Error
        ? `Unable to load demo data: ${error.message}`
        : "Unable to load demo data",
    );
  } finally {
    showLoading("");
  }
};

void loadRecentQueries("html", selectedMode).then((entries) => {
  recentQueries = entries;
  renderStateChips();
});
void loadActiveRetrievalState("html", selectedMode).then((state) => {
  if (state) {
    fillSearchForm(state.searchForm);
    scopeDriver = state.scopeDriver;
    retrievalPresetId = state.retrievalPresetId ?? "";
    benchmarkPresetId = state.benchmarkPresetId ?? "";
    uploadPresetId = state.uploadPresetId ?? "";
    streamModelKeyEl.value = state.streamModelKey ?? streamModelKeyEl.value;
    streamQueryInput.value = state.streamPrompt ?? streamQueryInput.value;
    restoredSharedState = true;
    const uploadLabel = demoUploadPresets.find((preset) => preset.id === state.uploadPresetId)?.label;
    const benchmarkLabel = demoEvaluationPresets.find((preset) => preset.id === state.benchmarkPresetId)?.label;
    const label = uploadLabel ?? benchmarkLabel ?? state.retrievalPresetId ?? "manual state";
    restoredSharedStateSummary = `Restored from shared demo state · ${label} · ${new Date(state.lastUpdatedAt ?? Date.now()).toLocaleString()}.`;
  } else {
    restoredSharedState = false;
    restoredSharedStateSummary = "";
    renderStateChips();
  }
  renderStateChips();
});


const submitStreamQuery = (event: SubmitEvent) => {
  event.preventDefault();
  const prompt = toSafeText(streamQueryInput.value, "");
  if (prompt.length === 0) {
    setError(streamErrorEl, "Enter a retrieval question before starting the stream.");
    return;
  }
  if (streamModelKeyEl.value.length === 0) {
    setError(streamErrorEl, "Configure an AI provider to enable retrieval streaming.");
    return;
  }

  setError(streamErrorEl, "");
  ragWorkflow.query(buildDemoAIStreamPrompt(streamModelKeyEl.value, prompt));
};

const submitSearch = async (event: SubmitEvent) => {
  event.preventDefault();
  scopeDriver = "manual filters";
  renderSearchScope();
  setError(searchErrorEl, "");
  hideSearchResults();
  await runSearchFromValues(readSearchForm());
};

const onPresetSearch = async (event: Event) => {
  const button = event.currentTarget as HTMLButtonElement;
  const query = toSafeText(button.dataset.query ?? "", "");
  if (query.length === 0) return;

  scopeDriver = `preset: ${button.textContent?.trim().toLowerCase() ?? "preset"}`;
  retrievalPresetId = (button.textContent?.trim().toLowerCase() ?? "preset").replace(/\s+/g, "-");
  benchmarkPresetId = "";
  uploadPresetId = "";
  const source = toSafeText(button.dataset.source ?? "", "");
  const kind = button.dataset.kind ?? "";
  const topK = Number(button.dataset.topk ?? "6");
  fillSearchForm({
    query,
    source,
    kind: kind === "seed" || kind === "custom" ? kind : "",
    documentId: "",
    topK: Number.isFinite(topK) && topK > 0 ? Math.min(20, Math.floor(topK)) : 6,
    scoreThreshold: "",
  });
  setError(searchErrorEl, "");
  hideSearchResults();
  await runSearchFromValues(readSearchForm());
};

const submitAddDocument = async (event: SubmitEvent) => {
  event.preventDefault();
  setError(addErrorEl, "");
  const addValues = readAddForm();
  if (addValues.title.length === 0 || addValues.text.length === 0) {
    setError(addErrorEl, "title and text are required");
    return;
  }

  if (addValues.source.length === 0) {
    setError(addErrorEl, "source is required");
    return;
  }

  try {
    const response = await ragClient.createDocument({
      id: addValues.id.length > 0 ? addValues.id : undefined,
      title: addValues.title,
      source: addValues.source,
      format: addValues.format,
      text: addValues.text,
      chunking: {
        strategy: addValues.chunkStrategy,
      },
    });
    if (!response.ok) {
      throw new Error(response.error ?? "Failed to insert document");
    }
    showMessage(`Inserted ${response.inserted ?? addValues.title}`);
    addForm.reset();
    setAddFormDefaults();
    await refreshData();
  } catch (error) {
    setError(
      addErrorEl,
      error instanceof Error
        ? `Failed to insert: ${error.message}`
        : "Failed to insert document",
    );
  }
};

const setAddFormDefaults = () => {
  const formatField = addForm.elements.namedItem("format") as HTMLSelectElement | null;
  const chunkField = addForm.elements.namedItem("chunkStrategy") as HTMLSelectElement | null;
  if (formatField !== null) formatField.value = demoContentFormats[0] ?? "markdown";
  if (chunkField !== null) chunkField.value = demoChunkingStrategies[0] ?? "source_aware";
};

const reseed = async () => {
  showMessage("Reseeding defaults...");
  setError(searchErrorEl, "");
  setError(addErrorEl, "");
  try {
    const response = await ragClient.reseed();
    if (!response.ok) {
      throw new Error(response.error ?? "Reseed failed");
    }
    showMessage(`Reseed complete. Documents=${response.documents ?? 0}`);
    await refreshData();
  } catch (error) {
    showMessage(
      error instanceof Error
        ? `Reseed failed: ${error.message}`
        : "Reseed failed",
    );
  }
};

const resetCustom = async () => {
  showMessage("Resetting custom documents...");
  setError(searchErrorEl, "");
  setError(addErrorEl, "");
  try {
    const response = await ragClient.reset();
    if (!response.ok) {
      throw new Error(response.error ?? "Reset failed");
    }
    showMessage(`Reset complete. Documents=${response.documents ?? 0}`);
    hideSearchResults();
    await refreshData();
  } catch (error) {
    showMessage(
      error instanceof Error
        ? `Reset failed: ${error.message}`
        : "Reset failed",
    );
  }
};

streamForm.addEventListener("submit", submitStreamQuery);
evaluationButtonEl.addEventListener("click", () => {
  void runEvaluation();
});
qualitySuiteButtonEl.addEventListener("click", () => {
  void runSavedSuite();
});
streamActionButton.addEventListener("click", (event) => {
  if (isStreamBusy()) {
    event.preventDefault();
    ragWorkflow.cancel();
  }
});
searchForm.addEventListener("submit", submitSearch);
searchForm.addEventListener("input", renderSearchScope);
searchForm.addEventListener("change", renderSearchScope);
addForm.addEventListener("submit", submitAddDocument);
uploadFileInputEl.addEventListener("change", () => {
  selectedUploadFile = uploadFileInputEl.files?.[0] ?? null;
  uploadFileSelectionEl.hidden = selectedUploadFile === null;
  uploadFileSelectionEl.textContent = selectedUploadFile === null ? "" : `Selected file: ${selectedUploadFile.name}`;
});
uploadFileButtonEl.addEventListener("click", () => {
  void uploadSelectedDocumentFile();
});
documentSearchEl.addEventListener("input", () => {
  documentPage = 1;
  formatDocuments(documentsCache);
});
documentTypeFilterEl.addEventListener("change", () => {
  documentPage = 1;
  formatDocuments(documentsCache);
});
reseedButton.addEventListener("click", reseed);
resetButton.addEventListener("click", resetCustom);
refreshButton.addEventListener("click", refreshData);
syncAllButton.addEventListener("click", async () => {
  showMessage("Syncing all sources...");
  try {
    await ragClient.syncAllSources();
    await refreshData();
  } catch (error) {
    showMessage(
      error instanceof Error ? `Source sync failed: ${error.message}` : "Source sync failed",
    );
  }
});
syncAllBackgroundButton.addEventListener("click", async () => {
  showMessage("Queueing background sync...");
  try {
    await ragClient.syncAllSources({ background: true });
    await refreshData();
  } catch (error) {
    showMessage(
      error instanceof Error ? `Failed to queue background sync: ${error.message}` : "Failed to queue background sync",
    );
  }
});
for (const button of presetContainerEl.querySelectorAll("button")) {
  button.addEventListener("click", onPresetSearch);
}

setAddFormDefaults();
renderDocumentTypeOptions();
formatDocuments(documentsCache);
clearEvaluationResults();
renderStreamState();
renderSearchScope();
renderStateChips();
stateScopeChipEl.addEventListener("click", () => {
  void clearRetrievalScope();
});
stateDriverChipEl.addEventListener("click", () => {
  void clearRetrievalScope();
});
stateRerunChipEl.addEventListener("click", () => {
  void rerunLastQuery();
});
stateClearChipEl.addEventListener("click", clearAllRetrievalState);
void refreshData();

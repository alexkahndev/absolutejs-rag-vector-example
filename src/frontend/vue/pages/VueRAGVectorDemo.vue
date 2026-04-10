<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
const props = defineProps<{ availableBackends?: DemoBackendDescriptor[]; mode?: DemoBackendMode }>();
import { useRAG } from "@absolutejs/absolute/vue/ai";
import type { RAGEvaluationResponse } from "@absolutejs/absolute";
import {
  type AddFormState,
  type DemoActiveRetrievalState,
  type DemoAIModelCatalogResponse,
  type DemoRetrievalQualityResponse,
  type DemoBackendDescriptor,
  type DemoBackendMode,
  type DemoChunkPreview,
  type DemoDocument,
  type SearchFormState,
  type SearchResponse,
  buildDemoAIStreamPrompt,
  buildDemoEvaluationSuite,
  buildDemoEvaluationInput,
  buildDemoUploadIngestInput,
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
  formatGroundingHistoryDiff,
  formatGroundingCaseDifficultyEntry,
  formatGroundingDifficultyHistoryDiff,
  formatGroundingDifficultyHistorySummary,
  formatGroundingHistorySnapshots,
  formatGroundingHistoryArtifactTrail,
  formatGroundingHistorySummary,
  formatGroundingProviderCaseDetails,
  formatGroundingProviderCaseEntry,
  formatGroundingProviderCaseSummary,
  formatGroundingProviderEntry,
  formatGroundingProviderSummary,
  buildSearchPayload,
  buildSearchResponse,
  buildStatusView,
  getAvailableDemoBackends,
  demoEvaluationPresets,
  demoFrameworks,
  demoChunkingStrategies,
  demoUploadPresets,
  demoContentFormats,
  formatAdminActionList,
  formatAdminJobList,
  formatDemoAIModelLabel,
  formatCitationDetails,
  formatChunkStrategy,
  formatCitationExcerpt,
  formatCitationLabel,
  formatCitationSummary,
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
  getDemoPagePath,
  getDemoUploadFixtureUrl,
  getInitialBackendMode,
  loadActiveRetrievalState,
  loadRecentQueries,
  navigateToBackendMode,
  saveActiveRetrievalState,
  saveRecentQueries,
  workflowChecks,
} from "../../demo-backends";

const selectedMode = ref<DemoBackendMode>(props.mode ?? getInitialBackendMode());
const searchForm = ref<SearchFormState>({
  query: "",
  topK: 6,
  scoreThreshold: "",
  kind: "",
  source: "",
  documentId: "",
});
const searchResults = ref<SearchResponse | null>(null);
const addForm = ref<AddFormState>({
  id: "",
  title: "",
  source: "",
  format: "markdown",
  chunkStrategy: "source_aware",
  text: "",
});
const loading = ref(false);
const searchError = ref("");
const addError = ref("");
const uploadError = ref("");
const evaluationMessage = ref("");
const message = ref("");
const scopeDriver = ref("manual filters");
const restoredSharedState = ref(false);
const restoredSharedStateSummary = ref("");
const recentQueries = ref<Array<{ label: string; state: SearchFormState }>>([]);
const documentPage = ref(1);
const documentSearchTerm = ref("");
const documentTypeFilter = ref("all");
const selectedUploadFile = ref<File | null>(null);
const retrievalPresetId = ref("");
const benchmarkPresetId = ref("");
const uploadPresetId = ref("");

const backendOptions = computed(() => getAvailableDemoBackends(props.availableBackends));
const rag = useRAG(getRAGPathForMode(selectedMode.value), { autoLoadStatus: false });
const documents = computed(() => rag.documents.documents.value as DemoDocument[]);
const chunkPreview = computed(() => rag.chunkPreview.preview.value as DemoChunkPreview | null);
const evaluation = computed(() => rag.evaluate.lastResponse.value as RAGEvaluationResponse | null);
const chunkPreviewLoading = computed(() => rag.chunkPreview.isLoading.value);
const streamStages = ["submitting", "retrieving", "retrieved", "streaming", "complete"] as const;
const DOCUMENTS_PER_PAGE = 10;
const SUPPORTED_FILE_TYPE_OPTIONS = [
  ["all", "All supported types"],
  [".txt", ".txt"], [".md", ".md"], [".mdx", ".mdx"], [".html", ".html"], [".htm", ".htm"],
  [".json", ".json"], [".csv", ".csv"], [".xml", ".xml"], [".yaml", ".yaml"], [".yml", ".yml"],
  [".log", ".log"], [".ts", ".ts"], [".tsx", ".tsx"], [".js", ".js"], [".jsx", ".jsx"],
  [".pdf", ".pdf"], [".epub", ".epub"], [".docx", ".docx"], [".xlsx", ".xlsx"], [".pptx", ".pptx"],
  [".odt", ".odt"], [".ods", ".ods"], [".odp", ".odp"], [".rtf", ".rtf"], [".doc", ".doc"],
  [".xls", ".xls"], [".ppt", ".ppt"], [".msg", ".msg"], [".eml", ".eml"], [".png", ".png"],
  [".jpg", ".jpg"], [".jpeg", ".jpeg"], [".webp", ".webp"], [".tiff", ".tiff"], [".tif", ".tif"],
  [".bmp", ".bmp"], [".gif", ".gif"], [".heic", ".heic"], [".mp3", ".mp3"], [".wav", ".wav"],
  [".m4a", ".m4a"], [".aac", ".aac"], [".flac", ".flac"], [".ogg", ".ogg"], [".opus", ".opus"],
  [".mp4", ".mp4"], [".mov", ".mov"], [".mkv", ".mkv"], [".webm", ".webm"], [".avi", ".avi"],
  [".m4v", ".m4v"], [".zip", ".zip"], [".tar", ".tar"], [".gz", ".gz"], [".tgz", ".tgz"],
  [".bz2", ".bz2"], [".xz", ".xz"],
] as const;
const inferDocumentExtension = (document: DemoDocument) => {
  const candidates = [document.source, document.title];
  for (const candidate of candidates) {
    const match = candidate.toLowerCase().match(/(\.[a-z0-9]+)(?:[#?].*)?$/);
    if (match) return match[1];
  }
  if (document.format === "markdown") return ".md";
  if (document.format === "html") return ".html";
  return ".txt";
};
const filteredDocuments = computed(() => {
  const query = documentSearchTerm.value.trim().toLowerCase();
  return documents.value.filter((document) => {
    const matchesQuery =
      query.length === 0 ||
      document.title.toLowerCase().includes(query) ||
      document.source.toLowerCase().includes(query) ||
      document.text.toLowerCase().includes(query);
    const matchesType =
      documentTypeFilter.value === "all" || inferDocumentExtension(document) === documentTypeFilter.value;
    return matchesQuery && matchesType;
  });
});
const totalDocumentPages = computed(() => Math.max(1, Math.ceil(filteredDocuments.value.length / DOCUMENTS_PER_PAGE)));
const paginatedDocuments = computed(() => {
  const start = (documentPage.value - 1) * DOCUMENTS_PER_PAGE;
  return filteredDocuments.value.slice(start, start + DOCUMENTS_PER_PAGE);
});
const evaluationSuite = buildDemoEvaluationSuite();
const aiModelCatalog = ref<DemoAIModelCatalogResponse>({ defaultModelKey: null, models: [] });
const qualityData = ref<DemoRetrievalQualityResponse | null>(null);
const selectedAIModelKey = ref("");
const streamPrompt = ref("How do metadata filters change retrieval quality?");
const workflow = rag.workflow;
const workflowState = computed(() => workflow.state.value);
const streamLatestMessage = computed(() => workflow.latestAssistantMessage.value);
const streamRetrieval = computed(() => workflow.retrieval.value);
const streamGroundedAnswer = computed(() => workflow.groundedAnswer.value);
const streamGroundingReferences = computed(() => workflow.groundingReferences.value);
const streamSourceSummaries = computed(() => workflow.sourceSummaries.value);
const streamStage = computed(() => workflow.stage.value);
const streamBusy = computed(() => workflow.isRetrieving.value || workflow.isAnswerStreaming.value);
const sortedSyncSources = computed(() => sortSyncSources(rag.ops.syncSources.value));
const syncOverviewLines = computed(() => formatSyncSourceOverview(sortedSyncSources.value));
const retrievalScopeSummary = computed(() => formatRetrievalScopeSummary(searchForm.value));
const retrievalScopeHint = computed(() => formatRetrievalScopeHint(searchForm.value));

const isStreamStageComplete = (stage: typeof streamStages[number], currentStage: string) =>
  currentStage === "complete"
    ? stage === "complete" || streamStages.indexOf(stage) < streamStages.indexOf(currentStage as typeof streamStages[number])
    : streamStages.indexOf(stage) < streamStages.indexOf(currentStage as typeof streamStages[number]);

const status = computed(() =>
  buildStatusView(
    rag.status.status.value,
    rag.status.capabilities.value,
    documents.value,
    selectedMode.value,
  ),
);

const refreshData = async () => {
  loading.value = true;
  searchError.value = "";
  try {

    const [documentsData, _statusData, _opsData, aiModelsResponse, qualityResponse] = await Promise.all([
      rag.documents.load(),
      rag.status.refresh(),
      rag.ops.refresh(),
      fetch("/demo/ai-models").then((response) => response.json()) as Promise<DemoAIModelCatalogResponse>,
      fetch(`/demo/quality/${selectedMode.value}`).then((response) => response.json()) as Promise<DemoRetrievalQualityResponse>,
    ]);
    aiModelCatalog.value = aiModelsResponse;
    qualityData.value = qualityResponse;
    rag.evaluate.saveSuite(evaluationSuite);
    selectedAIModelKey.value = selectedAIModelKey.value || aiModelsResponse.defaultModelKey || aiModelsResponse.models[0]?.key || "";
    if (
      chunkPreview.value !== null &&
      documentsData.documents.some((document) => document.id === chunkPreview.value?.document.id)
    ) {
      // keep preview if the document still exists after refresh
    } else {
      rag.chunkPreview.clear();
    }
    message.value = "";
  } catch (error) {
    message.value =
      error instanceof Error
        ? `Unable to load demo data: ${error.message}`
        : "Unable to load demo data";
  } finally {
    loading.value = false;
  }
};

const executeSearch = async () => {
  searchError.value = "";
  searchResults.value = null;

  const query = searchForm.value.query.trim();
  if (query.length === 0) {
    searchError.value = "query is required";
    return;
  }

  try {
    const payload = buildSearchPayload({
      ...searchForm.value,
      query,
    });
    const start = performance.now();
    const results = await rag.search.search(payload as never);
    const nextState = { ...searchForm.value, query };
    recentQueries.value = [
      { label: query, state: nextState },
      ...recentQueries.value.filter((entry) => JSON.stringify(entry.state) !== JSON.stringify(nextState)),
    ].slice(0, 4);
    searchResults.value = buildSearchResponse(
      query,
      payload,
      results,
      Math.round(performance.now() - start),
    );
  } catch (error) {
    searchError.value =
      error instanceof Error ? `Search failed: ${error.message}` : "Search failed";
  }
};

const submitSearch = async (event: SubmitEvent) => {
  event.preventDefault();
  scopeDriver.value = "manual filters";
  await executeSearch();
};

const clearRetrievalScope = () => {
  searchForm.value = { ...searchForm.value, kind: "", source: "", documentId: "" };
  scopeDriver.value = "chip reset";
  if (searchForm.value.query.trim().length > 0) {
    void executeSearch();
  }
};

const clearAllRetrievalState = () => {
  searchForm.value = { ...searchForm.value, query: "", kind: "", source: "", documentId: "", scoreThreshold: "" };
  searchResults.value = null;
  searchError.value = "";
  scopeDriver.value = "clear all state";
};

const rerunLastQuery = () => {
  if (searchForm.value.query.trim().length === 0) return;
  scopeDriver.value = "rerun last query";
  void executeSearch();
};

const rerunRecentQuery = (state: SearchFormState) => {
  searchForm.value = state;
  scopeDriver.value = "recent query";
  void executeSearch();
};

const submitStreamQuery = (event: SubmitEvent) => {
  event.preventDefault();
  const prompt = streamPrompt.value.trim();
  if (prompt.length === 0) {
    message.value = "Enter a retrieval question before starting the stream.";
    return;
  }
  if (selectedAIModelKey.value.length === 0) {
    message.value = "Configure an AI provider to enable retrieval streaming.";
    return;
  }

  message.value = "";
  workflow.query(buildDemoAIStreamPrompt(selectedAIModelKey.value, prompt));
};

const runSavedSuite = async () => {
  evaluationMessage.value = "";

  try {
    const run = await rag.evaluate.runSuite(evaluationSuite);
    evaluationMessage.value = `Saved suite run finished in ${run.elapsedMs}ms and ranked ${rag.evaluate.leaderboard.value.length} workflow run(s).`;
  } catch (error) {
    evaluationMessage.value = error instanceof Error ? `Saved suite failed: ${error.message}` : "Saved suite failed";
  }
};

const runEvaluation = async () => {
  evaluationMessage.value = "";

  try {
    const response = await rag.evaluate.evaluate(buildDemoEvaluationInput());
    evaluationMessage.value = `Benchmark suite finished in ${response.elapsedMs}ms across ${response.totalCases} benchmark queries.`;
  } catch (error) {
    evaluationMessage.value =
      error instanceof Error ? `Evaluation failed: ${error.message}` : "Evaluation failed";
  }
};

const runPresetSearch = (query: string, options: Partial<SearchFormState> = {}, driver = "preset", presetId = "") => {
  searchForm.value = {
    ...searchForm.value,
    ...options,
    query,
    kind:
      options.kind === "seed" || options.kind === "custom" ? options.kind : "",
    source: options.source ?? "",
    documentId: options.documentId ?? "",
    scoreThreshold: options.scoreThreshold ?? "",
    topK: options.topK ?? 6,
  };
  scopeDriver.value = driver;
  if (driver.startsWith("benchmark preset:")) {
    benchmarkPresetId.value = presetId;
    retrievalPresetId.value = "";
    uploadPresetId.value = "";
  } else if (driver === "upload verification") {
    retrievalPresetId.value = "";
    benchmarkPresetId.value = "";
  } else {
    retrievalPresetId.value = presetId;
    benchmarkPresetId.value = "";
    uploadPresetId.value = "";
  }

  void executeSearch();
};

const ingestDemoUpload = async (preset: (typeof demoUploadPresets)[number]) => {
  uploadError.value = "";
  message.value = `Uploading ${preset.label}...`;
  try {
    const response = await fetch(getDemoUploadFixtureUrl(preset.id));
    if (!response.ok) {
      throw new Error(`Failed to load ${preset.fileName}: ${response.status}`);
    }
    const result = await rag.ingest.ingestUploads(
      buildDemoUploadIngestInput(preset, encodeArrayBufferToBase64(await response.arrayBuffer())),
    );
    message.value = `Uploaded ${preset.label}. Extracted ${result.count ?? 0} chunk(s) across ${result.documentCount ?? 1} document(s).`;
    uploadPresetId.value = preset.id;
    runPresetSearch(preset.query, { source: preset.expectedSources[0] ?? preset.source, topK: 6 }, "upload verification");
  } catch (error) {
    uploadError.value = error instanceof Error ? `Upload failed: ${error.message}` : "Upload failed";
    message.value = "";
  }
};

const uploadSelectedFile = async () => {
  if (!selectedUploadFile.value) {
    uploadError.value = "Choose a file before uploading.";
    return;
  }
  uploadError.value = "";
  message.value = `Uploading ${selectedUploadFile.value.name}...`;
  try {
    const result = await rag.ingest.ingestUploads({
      baseMetadata: {
        fileKind: "uploaded-user-file",
        kind: "custom",
      },
      uploads: [
        {
          name: selectedUploadFile.value.name,
          source: `uploads/${selectedUploadFile.value.name}`,
          title: selectedUploadFile.value.name,
          contentType: selectedUploadFile.value.type || "application/octet-stream",
          encoding: "base64",
          content: encodeArrayBufferToBase64(await selectedUploadFile.value.arrayBuffer()),
          metadata: {
            kind: "custom",
            uploadedFrom: "vue-general-upload",
          },
        },
      ],
    });
    const uploadedName = selectedUploadFile.value.name;
    message.value = `Uploaded ${uploadedName}. Extracted ${result.count ?? 0} chunk(s) across ${result.documentCount ?? 1} document(s).`;
    selectedUploadFile.value = null;
    await refreshData();
    runPresetSearch(`Explain ${uploadedName}`, { source: `uploads/${uploadedName}`, topK: 6 }, "upload verification");
  } catch (error) {
    uploadError.value = error instanceof Error ? `Upload failed: ${error.message}` : "Upload failed";
    message.value = "";
  }
};

const onUploadFileChange = (event: Event) => {
  selectedUploadFile.value = (event.target as HTMLInputElement | null)?.files?.[0] ?? null;
};

const submitAddDocument = async (event: SubmitEvent) => {
  event.preventDefault();
  addError.value = "";
  searchError.value = "";

  try {
    const response = await rag.index.createDocument({
      id: addForm.value.id.trim().length > 0 ? addForm.value.id.trim() : undefined,
      title: addForm.value.title.trim(),
      source: addForm.value.source.trim(),
      format: addForm.value.format,
      text: addForm.value.text.trim(),
      chunking: {
        strategy: addForm.value.chunkStrategy,
      },
    });

    message.value = `Inserted ${response.inserted ?? addForm.value.title.trim()}`;
    addForm.value = {
      id: "",
      title: "",
      source: "",
      format: "markdown",
      chunkStrategy: "source_aware",
      text: "",
    };
    await refreshData();
  } catch (error) {
    addError.value =
      error instanceof Error
        ? `Failed to insert: ${error.message}`
        : "Failed to insert document";
  }
};

const inspectChunks = async (id: string) => {
  try {
    await rag.chunkPreview.inspect(id);
  } catch (error) {
    message.value =
      error instanceof Error
        ? `Failed to inspect ${id}: ${error.message}`
        : `Failed to inspect ${id}`;
  }
};

const chunkIndexText = (chunk: { metadata?: Record<string, unknown> }, fallbackCount: number) => {
  const indexValue = typeof chunk.metadata?.chunkIndex === "number" ? chunk.metadata.chunkIndex : 0;
  const countValue = typeof chunk.metadata?.chunkCount === "number" ? chunk.metadata.chunkCount : fallbackCount;
  return `chunk index: ${String(indexValue)} / count: ${String(countValue)}`;
};

const deleteDocument = async (id: string) => {
  try {
    await rag.index.deleteDocument(id);
    message.value = `Deleted ${id}`;
    if (chunkPreview.value?.document.id === id) {
      rag.chunkPreview.clear();
    }
    await refreshData();
  } catch (error) {
    message.value =
      error instanceof Error
        ? `Failed to delete ${id}: ${error.message}`
        : "Failed to delete document";
  }
};

const reseed = async () => {
  searchError.value = "";
  addError.value = "";
  try {
    message.value = "Reseeding defaults...";
    const result = await rag.index.reseed();
    message.value = `Reseed complete. Documents=${result.documents ?? 0}`;
    searchResults.value = null;
    await refreshData();
  } catch (error) {
    message.value =
      error instanceof Error ? `Reseed failed: ${error.message}` : "Reseed failed";
  }
};

const resetCustom = async () => {
  searchError.value = "";
  addError.value = "";
  try {
    message.value = "Resetting custom documents...";
    const result = await rag.index.reset();
    message.value = `Reset complete. Documents=${result.documents ?? 0}`;
    searchResults.value = null;
    await refreshData();
  } catch (error) {
    message.value =
      error instanceof Error ? `Reset failed: ${error.message}` : "Reset failed";
  }
};

const syncAllSources = async () => {
  searchError.value = "";
  addError.value = "";
  try {
    message.value = "Syncing all sources...";
    const result = await rag.index.syncAllSources();
    const count = "sources" in result ? result.sources.length : 0;
    message.value = `Synced ${count} source(s).`;
    await refreshData();
  } catch (error) {
    message.value =
      error instanceof Error ? `Source sync failed: ${error.message}` : "Source sync failed";
  }
};

const queueBackgroundSync = async () => {
  searchError.value = "";
  addError.value = "";
  try {
    message.value = "Queueing background sync...";
    await rag.index.syncAllSources({ background: true });
    message.value = "Background sync queued.";
    await refreshData();
  } catch (error) {
    message.value =
      error instanceof Error ? `Failed to queue background sync: ${error.message}` : "Failed to queue background sync";
  }
};

const syncSource = async (id: string) => {
  searchError.value = "";
  addError.value = "";
  try {
    message.value = `Syncing ${id}...`;
    const result = await rag.index.syncSource(id);
    message.value =
      "source" in result ? `Synced ${result.source.label}.` : `Synced ${id}.`;
    await refreshData();
  } catch (error) {
    message.value =
      error instanceof Error ? `Failed to sync ${id}: ${error.message}` : `Failed to sync ${id}`;
  }
};

const queueBackgroundSourceSync = async (id: string) => {
  searchError.value = "";
  addError.value = "";
  try {
    message.value = `Queueing ${id} in the background...`;
    const result = await rag.index.syncSource(id, { background: true });
    message.value =
      "source" in result ? `Queued ${result.source.label}.` : `Queued ${id}.`;
    await refreshData();
  } catch (error) {
    message.value =
      error instanceof Error ? `Failed to queue ${id}: ${error.message}` : `Failed to queue ${id}`;
  }
};

onMounted(() => {
  void loadRecentQueries("vue", selectedMode.value).then((entries) => {
    recentQueries.value = entries;
  });
  void loadActiveRetrievalState("vue", selectedMode.value).then((state) => {
    if (state) {
      searchForm.value = state.searchForm;
      scopeDriver.value = state.scopeDriver;
      retrievalPresetId.value = state.retrievalPresetId ?? "";
      benchmarkPresetId.value = state.benchmarkPresetId ?? "";
      uploadPresetId.value = state.uploadPresetId ?? "";
      selectedAIModelKey.value = state.streamModelKey ?? selectedAIModelKey.value;
      streamPrompt.value = state.streamPrompt ?? streamPrompt.value;
      restoredSharedState.value = true;
      const label =
        demoUploadPresets.find((preset) => preset.id === state.uploadPresetId)?.label ??
        demoEvaluationPresets.find((preset) => preset.id === state.benchmarkPresetId)?.label ??
        state.retrievalPresetId ??
        "manual state";
      restoredSharedStateSummary.value = `Restored from shared demo state · ${label} · ${new Date(state.lastUpdatedAt ?? Date.now()).toLocaleString()}.`;
    } else {
      restoredSharedState.value = false;
      restoredSharedStateSummary.value = "";
    }
  });
  void refreshData();
});

watch(
  () => recentQueries.value,
  (value) => {
    void saveRecentQueries("vue", selectedMode.value, value);
  },
  { deep: true },
);

watch(
  () => searchForm.value,
  (value) => {
    const state: DemoActiveRetrievalState = {
      searchForm: value,
      scopeDriver: scopeDriver.value,
      lastUpdatedAt: Date.now(),
      retrievalPresetId: retrievalPresetId.value || undefined,
      benchmarkPresetId: benchmarkPresetId.value || undefined,
      uploadPresetId: uploadPresetId.value || undefined,
      streamModelKey: selectedAIModelKey.value || undefined,
      streamPrompt: streamPrompt.value,
    };
    void saveActiveRetrievalState("vue", selectedMode.value, state);
  },
  { deep: true },
);

watch(
  () => scopeDriver.value,
  (value) => {
    const state: DemoActiveRetrievalState = {
      searchForm: searchForm.value,
      scopeDriver: value,
      lastUpdatedAt: Date.now(),
      retrievalPresetId: retrievalPresetId.value || undefined,
      benchmarkPresetId: benchmarkPresetId.value || undefined,
      uploadPresetId: uploadPresetId.value || undefined,
      streamModelKey: selectedAIModelKey.value || undefined,
      streamPrompt: streamPrompt.value,
    };
    void saveActiveRetrievalState("vue", selectedMode.value, state);
  },
);

watch(
  () => [selectedAIModelKey.value, streamPrompt.value],
  ([modelKey, prompt]) => {
    const state: DemoActiveRetrievalState = {
      searchForm: searchForm.value,
      scopeDriver: scopeDriver.value,
      lastUpdatedAt: Date.now(),
      retrievalPresetId: retrievalPresetId.value || undefined,
      benchmarkPresetId: benchmarkPresetId.value || undefined,
      uploadPresetId: uploadPresetId.value || undefined,
      streamModelKey: modelKey || undefined,
      streamPrompt: prompt,
    };
    void saveActiveRetrievalState("vue", selectedMode.value, state);
  },
);

watch(
  () => filteredDocuments.value.length,
  () => {
    documentPage.value = Math.min(Math.max(1, documentPage.value), totalDocumentPages.value);
  },
);
</script>

<template>
  <div class="rag-demo-page">
    <header>
      <div class="header-left">
        <a class="logo" href="/">
          <img alt="AbsoluteJS" height="24" src="/assets/png/absolutejs-temp.png" />
          AbsoluteJS
        </a>
      </div>
      <nav>
        <div v-for="backend in backendOptions" :key="backend.id" class="demo-nav-row">
          <span :class="backend.id === selectedMode ? 'demo-nav-row-label active' : 'demo-nav-row-label'">{{ backend.label }}</span>
          <a
            v-for="framework in demoFrameworks"
            :key="`${backend.id}-${framework.id}`"
            :class="[(framework.id === 'vue' && backend.id === selectedMode) ? 'active' : '', backend.available ? '' : 'disabled']"
            :href="backend.available ? getDemoPagePath(framework.id, backend.id) : undefined"
            :aria-disabled="!backend.available"
            :title="backend.available ? undefined : backend.reason"
          >{{ framework.label }}</a>
        </div>
      </nav>
    </header>

    <main class="demo-layout">
      <section class="demo-card">
        <span class="demo-hero-kicker">Vue workflow surface</span>
        <h1>AbsoluteJS RAG Workflow Demo - Vue</h1>
        <p>Use one route to ingest, sync, retrieve, stream grounded answers, and inspect ops health against the same stuffed multi-format knowledge base.</p>
        <div class="demo-hero-grid">
          <article class="demo-stat-card">
            <span class="demo-stat-label">Corpus</span>
            <strong>Stuffed multi-format index</strong>
            <p>PDF, Office, archive, image, audio, video, EPUB, email, markdown, and legacy files on one page.</p>
          </article>
          <article class="demo-stat-card">
            <span class="demo-stat-label">Retrieval</span>
            <strong>Search with source proof</strong>
            <p>Row actions jump straight into scoped retrieval and inline chunk inspection instead of making you type filters by hand.</p>
          </article>
          <article class="demo-stat-card">
            <span class="demo-stat-label">Workflow</span>
            <strong>Grounded answers and citations</strong>
            <p>Drive the first-class workflow primitive, then inspect coverage, references, and resolved citations without leaving the route.</p>
          </article>
          <article class="demo-stat-card">
            <span class="demo-stat-label">Ops</span>
            <strong>Ingest, sync, benchmark</strong>
            <p>Exercise directory, URL, storage, and email sync adapters alongside ingest mutations, benchmarks, and admin status.</p>
          </article>
        </div>
        <div class="demo-pill-row">
          <span class="demo-pill">1. Retrieve and verify</span>
          <span class="demo-pill">2. Inspect chunks inline</span>
          <span class="demo-pill">3. Sync a source</span>
          <span class="demo-pill">4. Run quality benchmarks</span>
        </div>
      </section>

      <div class="demo-results">
        <h3>Sync Feedback</h3>
        <p class="demo-metadata">Run a sync, ingest, reset, or delete action to see the latest mutation summary here.</p>
        <p class="demo-metadata">This panel stays on the same route as diagnostics and retrieval so ops feedback is always visible.</p>
        <p v-if="message" class="demo-banner">{{ message }}</p>
        <p v-if="loading" class="demo-banner">Loading status and documents...</p>
        <p v-if="restoredSharedState" class="demo-banner">{{ restoredSharedStateSummary }}</p>
      </div>
      <section class="demo-grid" v-if="status">
        <article class="demo-card">
          <h2>Diagnostics</h2>
          <dl class="demo-stat-grid">
            <div>
              <dt>Selected mode</dt>
              <dd>{{ selectedMode }}</dd>
            </div>
            <div>
              <dt>Backend</dt>
              <dd>{{ status.backend }}</dd>
            </div>
            <div>
              <dt>Vector mode</dt>
              <dd>{{ status.vectorMode }}</dd>
            </div>
            <div>
              <dt>Embedding dimensions</dt>
              <dd>{{ status.dimensions ?? "n/a" }}</dd>
            </div>
            <div>
              <dt>Documents</dt>
              <dd>{{ status.documents.total }}</dd>
            </div>
            <div>
              <dt>Total chunks</dt>
              <dd>{{ status.chunkCount }}</dd>
            </div>
            <div>
              <dt>Seed docs</dt>
              <dd>{{ status.documents.byKind.seed }}</dd>
            </div>
            <div>
              <dt>Custom docs</dt>
              <dd>{{ status.documents.byKind.custom }}</dd>
            </div>
            <div>
              <dt>Vector acceleration</dt>
              <dd>{{ status.native.active ? "active" : "inactive" }}</dd>
            </div>
            <div>
              <dt>Native source</dt>
              <dd>{{ status.native.sourceLabel ?? "Not applicable" }}</dd>
            </div>
            <div>
              <dt>Reranker</dt>
              <dd>{{ status.reranker.label }}</dd>
            </div>
          </dl>
          
          <p v-if="status.native.fallbackReason" class="demo-metadata">{{ status.native.fallbackReason }}</p>
          <p class="demo-metadata">{{ status.reranker.summary }}</p>
          <p class="demo-metadata">
            Backend capabilities: <strong>{{ status.capabilities.join(" · ") }}</strong>
          </p>
          <div class="demo-results">
            <h3>Knowledge Base Operations</h3>
            <p v-if="rag.ops.error.value" class="demo-error">{{ rag.ops.error.value }}</p>
            <ul class="demo-detail-list">
              <li v-for="line in formatReadinessSummary(rag.ops.readiness.value)" :key="line">{{ line }}</li>
            </ul>
            <ul class="demo-detail-list">
              <li v-for="line in formatHealthSummary(rag.ops.health.value)" :key="line">{{ line }}</li>
            </ul>
            <ul class="demo-detail-list">
              <li v-for="line in formatFailureSummary(rag.ops.health.value)" :key="line">{{ line }}</li>
            </ul>
            <div class="demo-result-grid">
              <article class="demo-result-item">
                <h4>Sync Sources</h4>
                <div class="demo-actions">
                  <button @click="syncAllSources" type="button">Sync all sources</button>
                  <button @click="queueBackgroundSync" type="button">Queue background sync</button>
                </div>
                <div class="demo-badge-row">
                  <span v-for="chip in formatSyncDeltaChips(sortedSyncSources)" :key="chip" class="demo-state-chip">{{ chip.replace(/^sync /, "") }}</span>
                </div>
                <div class="demo-stat-grid">
                  <article v-for="line in syncOverviewLines" :key="`sync-overview-${line}`" class="demo-stat-card">
                    <span class="demo-stat-label">Sync overview</span>
                    <strong>{{ line.includes(':') ? line.slice(0, line.indexOf(':')) : 'Sync overview' }}</strong>
                    <p>{{ line.includes(':') ? line.slice(line.indexOf(':') + 1).trim() : line }}</p>
                  </article>
                </div>
                <ul class="demo-detail-list">
                  <li
                    v-for="line in (sortedSyncSources.length > 0 ? sortedSyncSources.flatMap((source) => [formatSyncSourceSummary(source), ...formatSyncSourceDetails(source)]) : ['No sync sources configured yet.'])"
                    :key="line"
                  >
                    {{ line }}
                  </li>
                </ul>
                <div class="demo-actions">
                  <template v-for="source in sortedSyncSources" :key="source.id">
                    <details :class="source.status === 'failed' ? 'demo-sync-action-details demo-sync-action-failed' : 'demo-sync-action-details'" :open="source.status === 'failed'">
                      <summary>{{ formatSyncSourceCollapsedSummary(source) }}</summary>
                      <div class="demo-sync-action-group">
                        <div class="demo-actions">
                          <button @click="syncSource(source.id)" type="button">
                            Sync {{ source.label }}
                          </button>
                          <button @click="queueBackgroundSourceSync(source.id)" type="button">
                            Queue {{ source.label }}
                          </button>
                          <template v-if="source.status === 'failed'">
                            <button @click="syncSource(source.id)" type="button">
                              Retry now
                            </button>
                            <button @click="queueBackgroundSourceSync(source.id)" type="button">
                              Retry in background
                            </button>
                          </template>
                        </div>
                        <p class="demo-metadata demo-sync-action-meta">{{ formatSyncSourceActionSummary(source) }}</p>
                        <div v-if="formatSyncSourceActionBadges(source).length > 0" class="demo-badge-row">
                          <span v-for="badge in formatSyncSourceActionBadges(source)" :key="`${source.id}-${badge}`" class="demo-badge">{{ badge }}</span>
                        </div>
                      </div>
                    </details>
                  </template>
                </div>
              </article>
              <article class="demo-result-item">
                <h4>Admin Jobs</h4>
                <ul class="demo-detail-list">
                  <li v-for="line in (formatAdminJobList(rag.ops.adminJobs.value).length > 0 ? formatAdminJobList(rag.ops.adminJobs.value) : ['No admin jobs recorded yet.'])" :key="line">{{ line }}</li>
                </ul>
              </article>
              <article class="demo-result-item">
                <h4>Recent Admin Actions</h4>
                <ul class="demo-detail-list">
                  <li v-for="line in (formatAdminActionList(rag.ops.adminActions.value).length > 0 ? formatAdminActionList(rag.ops.adminActions.value) : ['No admin actions recorded yet.'])" :key="line">{{ line }}</li>
                </ul>
              </article>
            </div>
          </div>
          <div class="demo-actions">
            <button @click="reseed" type="button">Re-seed defaults</button>
            <button @click="resetCustom" type="button">Reset custom docs</button>
            <button @click="refreshData" type="button">Refresh</button>
          </div>
        </article>

        <article class="demo-card">
          <h2>Retrieve And Verify</h2>
          <p class="demo-metadata">
            This section is powered by <code>useRAG</code>. Run a query, then
            confirm the returned chunk text and source label match the indexed
            source list below.
          </p>
          <div class="demo-preset-grid">
            <button type="button" @click="runPresetSearch('How do metadata filters change retrieval quality?', { kind: 'seed' }, 'preset: filter behavior', 'filter-behavior')">
              Filter behavior
            </button>
            <button type="button" @click="runPresetSearch('What should I verify after ingesting a new source?', {}, 'preset: verify ingestion', 'verify-ingestion')">
              Verify ingestion
            </button>
            <button type="button" @click="runPresetSearch('List support policies for shipping and returns.', { source: 'guide/demo.md' }, 'preset: source filter', 'source-filter')">
              Source filter
            </button>
            <button type="button" @click="runPresetSearch('Why should metadata be stable?', { source: 'guides/metadata.md' }, 'preset: metadata discipline', 'metadata-discipline')">
              Metadata discipline
            </button>
          </div>
          <form class="demo-search-form" @submit.prevent="submitSearch">
            <label for="query">Query</label>
            <input id="query" v-model="searchForm.query" name="query" required type="text" placeholder="e.g. How do metadata filters work?" />

            <label for="topK">Top K</label>
            <input id="topK" v-model.number="searchForm.topK" max="20" min="1" name="topK" type="number" />

            <label for="scoreThreshold">Minimum score (0-1)</label>
            <input id="scoreThreshold" v-model="searchForm.scoreThreshold" name="scoreThreshold" placeholder="optional" type="number" step="0.01" min="0" max="1" />

            <label for="kind">Kind filter</label>
            <select id="kind" v-model="searchForm.kind" name="kind">
              <option value="">Any</option>
              <option value="seed">Seed</option>
              <option value="custom">Custom</option>
            </select>

            <label for="source">Source filter</label>
            <input id="source" v-model="searchForm.source" @input="scopeDriver = 'manual filters'" :class="{ 'demo-filter-active': searchForm.source.trim().length > 0 }" name="source" placeholder="e.g. guide/demo.md" type="text" />

            <label for="documentId">Document ID filter</label>
            <input id="documentId" v-model="searchForm.documentId" @input="scopeDriver = 'manual filters'" :class="{ 'demo-filter-active': searchForm.documentId.trim().length > 0 }" name="documentId" placeholder="e.g. rag-demo" type="text" />

            <button type="submit">Search index</button>
          </form>
          <div class="demo-results">
            <h3>Active Retrieval Scope</h3>
            <div class="demo-badge-row">
              <span class="demo-state-chip">{{ retrievalScopeSummary }}</span>
              <span class="demo-state-chip">Changed by: {{ scopeDriver.replace(/^row action: /, "row action · ") }}</span>
              <span class="demo-state-chip">Results: {{ searchResults?.count ?? 0 }}</span>
            </div>
            <p class="demo-metadata">{{ retrievalScopeHint }}</p>
            <div class="demo-actions">
              <button :disabled="searchForm.query.trim().length === 0 && searchForm.source.trim().length === 0 && searchForm.documentId.trim().length === 0 && searchForm.kind.length === 0" @click="clearRetrievalScope" type="button">Clear scope</button>
              <button :disabled="searchForm.query.trim().length === 0" @click="rerunLastQuery" type="button">Rerun query</button>
              <button @click="clearAllRetrievalState" type="button">Clear search</button>
            </div>
            <template v-if="recentQueries.length > 0">
              <p class="demo-section-caption">Recent Searches</p>
              <div class="demo-badge-row">
                <button v-for="entry in recentQueries" :key="`${entry.label}-${entry.state.source}-${entry.state.documentId}-${entry.state.kind}`" class="demo-state-chip" @click="rerunRecentQuery(entry.state)" type="button">{{ entry.label }}</button>
              </div>
            </template>
          </div>
          <p v-if="searchError" class="demo-error">{{ searchError }}</p>
          <div v-if="searchResults" class="demo-results">
            <p>{{ searchResults.count }} results for “{{ searchResults.query }}” in {{ searchResults.elapsedMs }}ms</p>
            <p class="demo-metadata">{{ retrievalScopeSummary }}</p>
            <p class="demo-metadata">Scope changed by: {{ scopeDriver }}</p>
            <p class="demo-metadata">
              Reranking is active: AbsoluteJS reorders the first vector hits with the built-in heuristic provider before these results render.
            </p>
            <p class="demo-metadata">
              Verification rule: a good result shows chunk text that answers the query
              and a source label you can trace back to the indexed source list.
            </p>
            <div class="demo-result-grid">
              <article v-for="chunk in searchResults.chunks" :key="chunk.chunkId" class="demo-result-item">
                <h3>{{ chunk.title }}</h3>
                <p class="demo-result-score">score: {{ formatScore(chunk.score) }}</p>
                <p class="demo-result-source">source: {{ chunk.source }}</p>
                <p v-for="line in formatDemoMetadataSummary(chunk.metadata)" :key="line" class="demo-metadata">{{ line }}</p>
                <p class="demo-result-text">{{ chunk.text }}</p>
              </article>
            </div>
          </div>

          <div class="demo-results">
            <h3>Benchmark Retrieval</h3>
            <p class="demo-metadata">
              This section uses <code>useRAG().evaluate</code> to run a built-in benchmark suite. Each case names the source we expect retrieval to surface so you can compare expected, retrieved, and missing evidence directly.
            </p>
            <div class="demo-preset-grid">
              <button
                v-for="preset in demoEvaluationPresets"
                :key="preset.id"
                type="button"
                :title="preset.description"
                @click="runPresetSearch(preset.query, { source: preset.expectedSources[0] ?? '' }, `benchmark preset: ${preset.label}`, preset.id)"
              >
                {{ preset.label }}
              </button>
            </div>
            <div class="demo-actions">
              <button type="button" :disabled="rag.evaluate.isEvaluating.value" @click="runEvaluation">
                {{ rag.evaluate.isEvaluating.value ? "Running benchmark suite..." : "Run benchmark suite" }}
              </button>
            </div>
            <p v-if="evaluationMessage" class="demo-metadata">{{ evaluationMessage }}</p>
            <p v-if="rag.evaluate.error.value" class="demo-error">{{ rag.evaluate.error.value }}</p>
            <template v-if="evaluation">
              <p class="demo-metadata">Benchmark summary: {{ formatEvaluationSummary(evaluation) }}</p>
              <div class="demo-result-grid">
                <article v-for="entry in evaluation.cases" :key="entry.caseId" :class="['demo-result-item', 'demo-evaluation-card', `demo-evaluation-${entry.status}`]">
                  <h4>{{ entry.label ?? entry.caseId }}</h4>
                  <p class="demo-result-source">{{ entry.query }}</p>
                  <p class="demo-evaluation-status">{{ entry.status.toUpperCase() }}</p>
                  <p class="demo-metadata">{{ formatEvaluationCaseSummary(entry) }}</p>
                  <p class="demo-metadata">expected: {{ formatEvaluationExpected(entry) }}</p>
                  <p class="demo-metadata">retrieved: {{ formatEvaluationRetrieved(entry) }}</p>
                  <p class="demo-result-text">missing: {{ formatEvaluationMissing(entry) }}</p>
                </article>
              </div>
            </template>
          </div>

          <div class="demo-results">
            <h3>Retrieval Quality Tooling</h3>
            <p class="demo-metadata">This section uses the saved evaluation suite plus first-class retrieval-strategy, reranker comparison, and persisted benchmark history primitives. The suite stays registered in the page state, the leaderboard ranks prior suite runs, and the history cards call out the latest benchmark drift for each strategy.</p>
            <ul class="demo-detail-list">
              <li v-for="suite in (rag.evaluate.suites.value.length > 0 ? rag.evaluate.suites.value : [evaluationSuite])" :key="suite.id">{{ suite.label ?? suite.id }} · {{ suite.input.cases.length }} case(s)<template v-if="suite.description"> · {{ suite.description }}</template></li>
            </ul>
            <div class="demo-actions">
              <button :disabled="rag.evaluate.isEvaluating.value" @click="runSavedSuite" type="button">{{ rag.evaluate.isEvaluating.value ? "Running saved suite..." : "Run saved suite" }}</button>
            </div>
            <div class="demo-result-grid">
              <article class="demo-result-item">
                <h4>Suite leaderboard</h4>
                <ul class="demo-detail-list">
                  <li v-for="line in (rag.evaluate.leaderboard.value.length > 0 ? rag.evaluate.leaderboard.value.map((entry) => formatEvaluationLeaderboardEntry(entry)) : ['Run the saved suite to rank workflow benchmark runs.'])" :key="line">{{ line }}</li>
                </ul>
              </article>
              <article class="demo-result-item">
                <h4>Quality winners</h4>
                <ul class="demo-detail-list">
                  <li v-for="line in (qualityData ? [...formatRetrievalComparisonSummary(qualityData.retrievalComparison), ...formatRerankerComparisonSummary(qualityData.rerankerComparison), formatGroundingEvaluationSummary(qualityData.groundingEvaluation), ...(qualityData.providerGroundingComparison ? formatGroundingProviderSummary(qualityData.providerGroundingComparison) : ['Configure an AI provider to compare real model-grounded answers.'])] : ['Loading quality comparison...'])" :key="line">{{ line }}</li>
                </ul>
              </article>
            </div>
            <div v-if="qualityData" class="demo-result-grid">
              <article v-for="entry in qualityData.retrievalComparison.entries" :key="entry.retrievalId" class="demo-result-item">
                <h4>{{ entry.label }}</h4>
                <p class="demo-metadata">{{ formatRetrievalComparisonEntry(entry) }}</p>
              </article>
            </div>
            <div v-if="qualityData" class="demo-result-grid">
              <article v-for="entry in qualityData.rerankerComparison.entries" :key="entry.rerankerId" class="demo-result-item">
                <h4>{{ entry.label }}</h4>
                <p class="demo-metadata">{{ formatRerankerComparisonEntry(entry) }}</p>
              </article>
            </div>
            <div v-if="qualityData" class="demo-result-grid">
              <article v-for="entry in qualityData.groundingEvaluation.cases" :key="`grounding-${entry.caseId}`" class="demo-result-item">
                <h4>{{ entry.label ?? entry.caseId }}</h4>
                <p class="demo-metadata">{{ formatGroundingEvaluationCase(entry) }}</p>
                <ul class="demo-detail-list">
                  <li v-for="line in formatGroundingEvaluationDetails(entry)" :key="`${entry.caseId}-${line}`">{{ line }}</li>
                </ul>
              </article>
            </div>
            <div v-if="qualityData?.providerGroundingComparison" class="demo-result-grid">
              <article v-for="entry in qualityData.providerGroundingComparison.entries" :key="`provider-grounding-${entry.providerKey}`" class="demo-result-item">
                <h4>{{ entry.label }}</h4>
                <p class="demo-metadata">{{ formatGroundingProviderEntry(entry) }}</p>
              </article>
            </div>
            <div v-if="qualityData?.providerGroundingComparison" class="demo-result-grid">
              <article v-for="entry in qualityData.providerGroundingComparison.entries" :key="`provider-grounding-history-${entry.providerKey}`" class="demo-result-item">
                <h4>{{ entry.label }} history</h4>
                <ul class="demo-detail-list">
                  <li v-for="line in [...formatGroundingHistorySummary(qualityData.providerGroundingHistories[entry.providerKey]), ...formatGroundingHistoryDiff(qualityData.providerGroundingHistories[entry.providerKey]), ...formatGroundingHistorySnapshots(qualityData.providerGroundingHistories[entry.providerKey])]" :key="`${entry.providerKey}-${line}`">{{ line }}</li>
                </ul>
              </article>
            </div>
            <div v-if="qualityData?.providerGroundingComparison" class="demo-result-grid">
              <article v-for="entry in qualityData.providerGroundingComparison.entries" :key="`provider-grounding-artifact-trail-${entry.providerKey}`" class="demo-result-item">
                <h4>{{ entry.label }} artifact trail</h4>
                <ul class="demo-detail-list">
                  <li v-for="line in formatGroundingHistoryArtifactTrail(qualityData.providerGroundingHistories[entry.providerKey])" :key="`${entry.providerKey}-trail-${line}`">{{ line }}</li>
                </ul>
              </article>
            </div>
            <div v-if="qualityData?.providerGroundingComparison" class="demo-result-grid">
              <article class="demo-result-item">
                <h4>Hardest grounding cases</h4>
                <ul class="demo-detail-list">
                  <li v-for="entry in qualityData.providerGroundingComparison.difficultyLeaderboard" :key="`provider-grounding-difficulty-${entry.caseId}`">{{ formatGroundingCaseDifficultyEntry(entry) }}</li>
                </ul>
              </article>
              <article class="demo-result-item">
                <h4>Grounding difficulty history</h4>
                <ul class="demo-detail-list">
                  <li v-for="line in [...formatGroundingDifficultyHistorySummary(qualityData.providerGroundingDifficultyHistory), ...formatGroundingDifficultyHistoryDiff(qualityData.providerGroundingDifficultyHistory)]" :key="`provider-grounding-difficulty-history-${line}`">{{ line }}</li>
                </ul>
              </article>
            </div>
            <div v-if="qualityData?.providerGroundingComparison" class="demo-result-grid">
              <article v-for="entry in qualityData.providerGroundingComparison.caseComparisons" :key="`provider-grounding-case-${entry.caseId}`" class="demo-result-item">
                <h4>{{ entry.label }}</h4>
                <ul class="demo-detail-list">
                  <li v-for="line in [...formatGroundingProviderCaseSummary(entry), ...entry.entries.flatMap((candidate) => [formatGroundingProviderCaseEntry(candidate), ...formatGroundingProviderCaseDetails(candidate)])]" :key="`${entry.caseId}-${line}`">{{ line }}</li>
                </ul>
              </article>
            </div>
            <div v-if="qualityData" class="demo-result-grid">
              <article v-for="entry in qualityData.retrievalComparison.entries" :key="`retrieval-history-${entry.retrievalId}`" class="demo-result-item">
                <h4>{{ entry.label }} history</h4>
                <ul class="demo-detail-list">
                  <li v-for="line in [...formatEvaluationHistorySummary(qualityData.retrievalHistories[entry.retrievalId]), ...formatEvaluationHistoryDiff(qualityData.retrievalHistories[entry.retrievalId])]" :key="`${entry.retrievalId}-${line}`">{{ line }}</li>
                </ul>
              </article>
            </div>
            <div v-if="qualityData" class="demo-result-grid">
              <article v-for="entry in qualityData.rerankerComparison.entries" :key="`reranker-history-${entry.rerankerId}`" class="demo-result-item">
                <h4>{{ entry.label }} history</h4>
                <ul class="demo-detail-list">
                  <li v-for="line in [...formatEvaluationHistorySummary(qualityData.rerankerHistories[entry.rerankerId]), ...formatEvaluationHistoryDiff(qualityData.rerankerHistories[entry.rerankerId])]" :key="`${entry.rerankerId}-${line}`">{{ line }}</li>
                </ul>
              </article>
            </div>
          </div>

          <div class="demo-stream-panel">
            <h3>Stream Retrieval Workflow</h3>
            <p class="demo-metadata">
              This page composes <code>useRAG()</code> for the broader demo, and this stream section proves the explicit workflow contract through <code>useRAG().workflow</code>.
            </p>
            <form class="demo-stream-form" @submit.prevent="submitStreamQuery">
              <label for="stream-model-key">Answer model</label>
              <select id="stream-model-key" v-model="selectedAIModelKey">
                <option v-if="aiModelCatalog.models.length === 0" value="">Configure an AI provider</option>
                <option v-for="model in aiModelCatalog.models" :key="model.key" :value="model.key">{{ formatDemoAIModelLabel(model) }}</option>
              </select>
              <p class="demo-metadata">Model switching stays on the official AbsoluteJS plugin path by selecting the provider and model sent with the retrieval stream request.</p>
              <label for="stream-query">Question</label>
              <input id="stream-query" v-model="streamPrompt" placeholder="e.g. What should I verify after ingesting a new source?" type="text" />
              <div class="demo-actions">
                <button v-if="!streamBusy" type="submit">Ask with retrieval stream</button>
                <button v-else @click="workflow.cancel" type="button">Cancel</button>
              </div>
            </form>
            <div class="demo-result-grid">
              <article class="demo-result-item">
                <h4>Workflow Contract</h4>
                <ul class="demo-detail-list">
                  <li>Explicit workflow surface: useRAG().workflow</li>
                  <li>Snapshot stage: {{ workflowState.stage }}</li>
                  <li>Live stage field: {{ streamStage }}</li>
                  <li>Snapshot sources: {{ workflowState.sources.length }}</li>
                  <li>Snapshot running: {{ workflowState.isRunning ? "yes" : "no" }}</li>
                </ul>
              </article>
              <article class="demo-result-item">
                <h4>Workflow Proof</h4>
                <ul class="demo-detail-list">
                  <li>Retrieved: {{ workflowState.hasRetrieved ? "yes" : "no" }}</li>
                  <li>Has sources: {{ workflowState.hasSources ? "yes" : "no" }}</li>
                  <li>Citation count: {{ workflow.citations.value.length }}</li>
                  <li>Grounding coverage: {{ streamGroundedAnswer.coverage }}</li>
                </ul>
              </article>
            </div>
            <div class="demo-stage-row">
              <span v-for="stage in streamStages" :key="stage" :class="['demo-stage-pill', streamStage === stage ? 'current' : '', isStreamStageComplete(stage, streamStage) ? 'complete' : '']">{{ stage }}</span>
            </div>
            <dl v-if="streamRetrieval" class="demo-stream-stats">
              <div><dt>Retrieval started</dt><dd>{{ streamRetrieval.retrievalStartedAt ? formatDate(streamRetrieval.retrievalStartedAt) : 'n/a' }}</dd></div>
              <div><dt>Retrieval duration</dt><dd>{{ streamRetrieval.retrievalDurationMs ?? 0 }}ms</dd></div>
              <div><dt>Retrieved sources</dt><dd>{{ streamRetrieval.sources.length }}</dd></div>
              <div><dt>Current stage</dt><dd>{{ streamStage }}</dd></div>
            </dl>
            <p v-if="workflow.error.value" class="demo-error">{{ workflow.error.value }}</p>
            <div v-if="streamLatestMessage?.thinking" class="demo-stream-block">
              <h4>Thinking</h4>
              <p class="demo-result-text">{{ streamLatestMessage.thinking }}</p>
            </div>
            <div v-if="streamLatestMessage?.content" class="demo-stream-block">
              <h4>Answer</h4>
              <p class="demo-result-text">{{ streamLatestMessage.content }}</p>
            </div>
            <div v-if="streamLatestMessage?.content" class="demo-results">
              <h4>Answer Grounding</h4>
              <p :class="['demo-grounding-badge', `demo-grounding-${streamGroundedAnswer.coverage}`]">
                {{ formatGroundingCoverage(streamGroundedAnswer.coverage) }}
              </p>
              <ul class="demo-detail-list">
                <li v-for="line in formatGroundingSummary(streamGroundedAnswer)" :key="line">{{ line }}</li>
              </ul>
              <div v-if="streamGroundedAnswer.parts.some((part) => part.type === 'citation')" class="demo-result-grid">
                <article v-for="(part, index) in streamGroundedAnswer.parts.filter((part) => part.type === 'citation')" :key="`${part.text}-${index}`" class="demo-result-item demo-grounding-card">
                  <p class="demo-citation-badge">{{ formatGroundingPartReferences(part.referenceNumbers) }}</p>
                  <p v-for="line in formatGroundedAnswerPartDetails(part)" :key="line" class="demo-metadata">{{ line }}</p>
                  <p class="demo-result-text">{{ part.text }}</p>
                </article>
              </div>
            </div>
            <div v-if="streamGroundingReferences.length > 0" class="demo-results">
              <h4>Grounding Reference Map</h4>
              <p class="demo-metadata">
                Each reference resolves answer citations back to concrete evidence with page, sheet, slide, archive, or thread context when available.
              </p>
              <div class="demo-result-grid">
                <article v-for="reference in streamGroundingReferences" :key="reference.chunkId" class="demo-result-item demo-grounding-card">
                  <p class="demo-citation-badge">[{{ reference.number }}] {{ formatGroundingReferenceLabel(reference) }}</p>
                  <p class="demo-result-score">{{ formatGroundingReferenceSummary(reference) }}</p>
                  <p v-for="line in formatGroundingReferenceDetails(reference)" :key="line" class="demo-metadata">{{ line }}</p>
                  <p class="demo-result-text">{{ formatGroundingReferenceExcerpt(reference) }}</p>
                </article>
              </div>
            </div>
            <div v-if="streamSourceSummaries.length > 0" class="demo-results">
              <h4>Evidence Sources</h4>
              <div class="demo-result-grid">
                <article v-for="summary in streamSourceSummaries" :key="summary.key" class="demo-result-item">
                  <h3>{{ summary.label }}</h3>
                  <p v-for="line in formatSourceSummaryDetails(summary)" :key="line" class="demo-metadata">{{ line }}</p>
                  <p class="demo-result-text">{{ summary.excerpt }}</p>
                </article>
              </div>
            </div>
            <div v-if="workflow.citations.value.length > 0" class="demo-results">
              <h4>Citation Trail</h4>
              <p class="demo-metadata">
                Each citation maps a concrete retrieved chunk to a stable reference number you can carry into the answer UI.
              </p>
              <div class="demo-result-grid">
                <article v-for="(citation, index) in workflow.citations.value" :key="citation.chunkId" class="demo-result-item demo-citation-card">
                  <p class="demo-citation-badge">[{{ index + 1 }}] {{ formatCitationLabel(citation) }}</p>
                  <p class="demo-result-score">{{ formatCitationSummary(citation) }}</p>
                  <p v-for="line in formatCitationDetails(citation)" :key="line" class="demo-metadata">{{ line }}</p>
                  <p class="demo-result-text">{{ formatCitationExcerpt(citation) }}</p>
                </article>
              </div>
            </div>
          </div>
        </article>
      </section>

      <section class="demo-grid">
        <article class="demo-card">
          <h2>Ingest Document</h2>
          <p class="demo-metadata">
            Add a document, choose its source format and chunking strategy, then verify how AbsoluteJS indexes it.
          </p>
          <div class="demo-results">
            <h3>Upload Extracted Fixtures</h3>
            <p class="demo-metadata">
              These buttons use <code>useRAG().ingest.ingestUploads</code> directly. Each fixture is fetched from the local demo corpus, sent through the published upload ingest route, and then verified with a retrieval query against the uploaded source path.
            </p>
            <p class="demo-metadata">
              Upload fixtures validate the extractor pipeline immediately. The managed document list below stays focused on authored example documents, while uploaded binaries are verified through retrieval.
            </p>
            <div class="demo-preset-grid">
              <button
                v-for="preset in demoUploadPresets"
                :key="preset.id"
                :disabled="rag.ingest.isIngesting.value"
                :title="preset.description"
                type="button"
                @click="void ingestDemoUpload(preset)"
              >
                {{ preset.label }}
              </button>
            </div>
            <div class="demo-upload-row">
              <input :accept="SUPPORTED_FILE_TYPE_OPTIONS.slice(1).map((entry) => entry[0]).join(',')" type="file" @change="onUploadFileChange" />
              <button :disabled="rag.ingest.isIngesting.value || selectedUploadFile === null" type="button" @click="void uploadSelectedFile()">Upload file</button>
            </div>
            <p v-if="selectedUploadFile" class="demo-metadata">Selected file: {{ selectedUploadFile.name }}</p>
            <p v-if="uploadError" class="demo-error">{{ uploadError }}</p>
          </div>
          <form class="demo-add-form" @submit.prevent="submitAddDocument">
            <label for="customId">Optional ID</label>
            <input id="customId" v-model="addForm.id" name="id" type="text" />

            <label for="customTitle">Title</label>
            <input id="customTitle" v-model="addForm.title" name="title" required type="text" />

            <label for="customSource">Source</label>
            <input id="customSource" v-model="addForm.source" name="source" required placeholder="e.g. onboarding-guide.md" type="text" />

            <label for="customFormat">Source format</label>
            <select id="customFormat" v-model="addForm.format" name="format">
              <option v-for="format in demoContentFormats" :key="format" :value="format">{{ formatContentFormat(format) }}</option>
            </select>

            <label for="customChunkStrategy">Chunking strategy</label>
            <select id="customChunkStrategy" v-model="addForm.chunkStrategy" name="chunkStrategy">
              <option v-for="strategy in demoChunkingStrategies" :key="strategy" :value="strategy">{{ formatChunkStrategy(strategy) }}</option>
            </select>

            <label for="customText">Text</label>
            <textarea id="customText" v-model="addForm.text" name="text" required rows="6"></textarea>

            <button type="submit">Ingest document and rebuild index</button>
          </form>
          <p v-if="addError" class="demo-error">{{ addError }}</p>
        </article>

        <article class="demo-card">
          <h2>Indexed Sources</h2>
          <div class="demo-stat-grid">
            <article class="demo-stat-card">
              <span class="demo-stat-label">Indexed documents</span>
              <strong>{{ filteredDocuments.length }}</strong>
              <p>{{ filteredDocuments.filter((document) => document.kind === 'seed').length }} seed · {{ filteredDocuments.filter((document) => document.kind === 'custom').length }} custom</p>
            </article>
          </div>
          <div class="demo-source-filter-row">
            <input v-model="documentSearchTerm" placeholder="Search indexed sources by title, source, or text" type="text" @input="documentPage = 1" />
            <select v-model="documentTypeFilter" @change="documentPage = 1">
              <option v-for="[value, label] in SUPPORTED_FILE_TYPE_OPTIONS" :key="value" :value="value">{{ label }}</option>
            </select>
          </div>
          <div class="demo-pagination-row">
            <p class="demo-metadata">Showing {{ paginatedDocuments.length }} of {{ filteredDocuments.length }} matching documents</p>
            <div class="demo-pagination-controls">
              <button :disabled="documentPage <= 1" type="button" @click="documentPage = Math.max(1, documentPage - 1)">Prev</button>
              <button v-for="pageNumber in totalDocumentPages" :key="pageNumber" :class="pageNumber === documentPage ? 'demo-page-button demo-page-button-active' : 'demo-page-button'" type="button" @click="documentPage = pageNumber">{{ pageNumber }}</button>
              <button :disabled="documentPage >= totalDocumentPages" type="button" @click="documentPage = Math.min(totalDocumentPages, documentPage + 1)">Next</button>
            </div>
          </div>
          <div class="demo-document-list">
            <p v-if="paginatedDocuments.length === 0" class="demo-metadata">No indexed sources match the current filters.</p>
            <details v-for="doc in paginatedDocuments" :key="doc.id" class="demo-document-item demo-document-collapsible">
              <summary>
                <div class="demo-document-header">
                  <div>
                    <h3>{{ doc.title }}</h3>
                    <p class="demo-metadata">{{ doc.source }} · {{ doc.kind }} · {{ doc.chunkCount }} chunk(s)</p>
                  </div>
                  <div class="demo-badge-row">
                    <span class="demo-badge">{{ formatContentFormat(doc.format) }}</span>
                    <span class="demo-badge">{{ formatChunkStrategy(doc.chunkStrategy) }}</span>
                    <span class="demo-badge">chunk target {{ doc.chunkSize }} chars</span>
                  </div>
                </div>
              </summary>
              <div class="demo-collapsible-content">
                <div class="demo-actions">
                  <button type="button" @click="inspectChunks(doc.id)">Inspect chunks</button>
                  <button type="button" @click="runPresetSearch('Source search for ' + doc.source, { source: doc.source }, 'row action: source ' + doc.source)">Search source</button>
                  <button type="button" @click="runPresetSearch('Explain ' + doc.title, { documentId: doc.id }, 'row action: document ' + doc.id)">Search document</button>
                  <button v-if="doc.kind === 'custom'" type="button" @click="deleteDocument(doc.id)">Delete</button>
                </div>
                <div class="demo-key-value-grid">
                  <div class="demo-key-value-row"><span>Source</span><strong>{{ doc.source }}</strong></div>
                  <div class="demo-key-value-row"><span>Created</span><strong>{{ formatDate(doc.createdAt) }}</strong></div>
                  <div class="demo-key-value-row"><span>Kind</span><strong>{{ doc.kind }}</strong></div>
                  <div class="demo-key-value-row"><span>Chunks</span><strong>{{ doc.chunkCount }}</strong></div>
                  <div v-for="line in formatDemoMetadataSummary(doc.metadata)" :key="line" class="demo-key-value-row"><span>Metadata</span><strong>{{ line }}</strong></div>
                </div>
                <p class="demo-document-preview">{{ doc.text }}</p>
                <div class="demo-inline-preview">
                  <p v-if="chunkPreviewLoading && chunkPreview?.document.id !== doc.id" class="demo-metadata">Preparing chunk preview...</p>
                  <template v-if="!chunkPreviewLoading && chunkPreview?.document.id === doc.id">
                    <p class="demo-section-caption">Chunk Preview</p>
                    <p class="demo-metadata">{{ chunkPreview.document.title }} · {{ formatContentFormat(chunkPreview.document.format) }} · {{ formatChunkStrategy(chunkPreview.document.chunkStrategy) }} · {{ chunkPreview.chunks.length }} chunk(s)</p>
                    <div class="demo-result-grid">
                      <article v-for="chunk in chunkPreview.chunks" :key="chunk.chunkId" class="demo-result-item">
                        <h3>{{ chunk.chunkId }}</h3>
                        <p class="demo-result-source">source: {{ chunk.source ?? chunkPreview.document.source }}</p>
                        <p class="demo-metadata">chunk index: {{ chunkIndexText(chunk, chunkPreview.chunks.length) }}</p>
                        <p class="demo-result-text">{{ chunk.text }}</p>
                      </article>
                    </div>
                  </template>
                </div>
              </div>
            </details>
          </div>
        </article>
      </section>
    </main>
  </div>
</template>

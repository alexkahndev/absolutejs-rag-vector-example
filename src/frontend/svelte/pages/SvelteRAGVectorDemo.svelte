<script lang="ts">
  import { createRAG } from "@absolutejs/absolute/svelte/ai";
  import type { RAGEvaluationResponse } from "@absolutejs/absolute";
  import { derived, get } from "svelte/store";
  import {
    type AddFormState,
    type DemoActiveRetrievalState,
    type DemoAIModelCatalogResponse,
    type DemoRetrievalQualityResponse,
    type DemoBackendDescriptor,
    type DemoBackendMode,
    type DemoChunkingStrategy,
    type DemoContentFormat,
    type DemoChunkPreview,
    type DemoDocument,
    type DemoStatusView,
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
  formatGroundingCaseDifficultyEntry,
  formatGroundingDifficultyHistoryDiff,
  formatGroundingDifficultyHistorySummary,
  formatGroundingHistoryDiff,
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
  
  let documents: DemoDocument[] = [];
  export let availableBackends: DemoBackendDescriptor[] | undefined = undefined;
  export let cssPath: string | undefined = undefined;
  export let mode: DemoBackendMode = "sqlite-native";
  let selectedMode: DemoBackendMode = mode ?? getInitialBackendMode();
  const backendOptions = getAvailableDemoBackends(availableBackends);
  const rag = createRAG(getRAGPathForMode(selectedMode), {
    autoLoadStatus: false,
    autoLoadOps: false,
  });
  const documentsStore = rag.documents.documents;
  const chunkPreviewStore = rag.chunkPreview.preview;
  const chunkPreviewLoadingStore = rag.chunkPreview.isLoading;
  const evaluationErrorStore = rag.evaluate.error;
  const evaluationIsEvaluatingStore = rag.evaluate.isEvaluating;
  const evaluationStore = rag.evaluate.lastResponse;
  const evaluationSuitesStore = rag.evaluate.suites;
  const evaluationLeaderboardStore = rag.evaluate.leaderboard;
  const ingestIsIngestingStore = rag.ingest.isIngesting;
  const streamStages = ["submitting", "retrieving", "retrieved", "streaming", "complete"] as const;
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
  const evaluationSuite = buildDemoEvaluationSuite();
  let aiModelCatalog: DemoAIModelCatalogResponse = { defaultModelKey: null, models: [] };
  let qualityData: DemoRetrievalQualityResponse | null = null;
  let selectedAIModelKey = "";
  let streamPrompt = "How do metadata filters change retrieval quality?";
  const workflow = rag.workflow;
  const streamLatestMessageStore = workflow.latestAssistantMessage;
  const streamRetrievalStore = workflow.retrieval;
  const streamGroundedAnswerStore = workflow.groundedAnswer;
  const streamGroundingReferencesStore = workflow.groundingReferences;
  const streamCitationsStore = workflow.citations;
  const streamSourceSummariesStore = workflow.sourceSummaries;
  const streamStageStore = workflow.stage;
  const streamWorkflowStateStore = workflow.state;
  const streamErrorStore = workflow.error;
  const streamBusyStore = derived([workflow.isRetrieving, workflow.isAnswerStreaming], ([$isRetrieving, $isAnswerStreaming]) => $isRetrieving || $isAnswerStreaming);
  const opsErrorStore = rag.ops.error;
  const opsReadinessStore = rag.ops.readiness;
  const opsHealthStore = rag.ops.health;
  const opsAdminJobsStore = rag.ops.adminJobs;
  const opsAdminActionsStore = rag.ops.adminActions;
  const opsSyncSourcesStore = rag.ops.syncSources;
  let status: DemoStatusView | null = null;
  let searchForm: SearchFormState = {
    query: "",
    topK: 6,
    scoreThreshold: "",
    kind: "",
    source: "",
    documentId: "",
  };
  let searchResults: SearchResponse | null = null;
  let addForm: AddFormState = {
    id: "",
    title: "",
    source: "",
    format: "markdown",
    chunkStrategy: "source_aware",
    text: "",
  };
  let searchError = "";
  let addError = "";
  let uploadError = "";
  let evaluationMessage = "";
  let message = "";
  let loading = false;
  let documentPage = 1;
  let documentSearchTerm = "";
  let documentTypeFilter = "all";
  let selectedUploadFile: File | null = null;
  let scopeDriver = "manual filters";
  let recentQueries: Array<{ label: string; state: SearchFormState }> = [];
  let hydratedRecentQueries = false;
  let hydratedActiveRetrievalState = false;
  let restoredSharedState = false;
  let restoredSharedStateSummary = "";
  let retrievalPresetId = "";
  let benchmarkPresetId = "";
  let uploadPresetId = "";
  $: sortedSyncSources = sortSyncSources($opsSyncSourcesStore);
  $: syncOverviewLines = formatSyncSourceOverview(sortedSyncSources);
  $: retrievalScopeSummary = formatRetrievalScopeSummary(searchForm);
  $: retrievalScopeHint = formatRetrievalScopeHint(searchForm);
  $: filteredDocuments = documents.filter((document) => {
    const query = documentSearchTerm.trim().toLowerCase();
    const matchesQuery =
      query.length === 0 ||
      document.title.toLowerCase().includes(query) ||
      document.source.toLowerCase().includes(query) ||
      document.text.toLowerCase().includes(query);
    const matchesType =
      documentTypeFilter === "all" || inferDocumentExtension(document) === documentTypeFilter;
    return matchesQuery && matchesType;
  });
  $: totalDocumentPages = Math.max(1, Math.ceil(filteredDocuments.length / DOCUMENTS_PER_PAGE));
  $: paginatedDocuments = filteredDocuments.slice((documentPage - 1) * DOCUMENTS_PER_PAGE, documentPage * DOCUMENTS_PER_PAGE);
  $: if (documentPage > totalDocumentPages) {
    documentPage = totalDocumentPages;
  }
  $: if (documentPage < 1) {
    documentPage = 1;
  }

  let hasBootstrapped = false;

  if (typeof window !== "undefined" && !hasBootstrapped) {
    hasBootstrapped = true;
    queueMicrotask(() => {
      void loadRecentQueries("svelte", selectedMode).then((entries) => {
        recentQueries = entries;
        hydratedRecentQueries = true;
      });
      void loadActiveRetrievalState("svelte", selectedMode).then((state) => {
        if (state) {
          searchForm = state.searchForm;
          scopeDriver = state.scopeDriver;
          retrievalPresetId = state.retrievalPresetId ?? "";
          benchmarkPresetId = state.benchmarkPresetId ?? "";
          uploadPresetId = state.uploadPresetId ?? "";
          selectedAIModelKey = state.streamModelKey ?? selectedAIModelKey;
          streamPrompt = state.streamPrompt ?? streamPrompt;
          restoredSharedState = true;
          const label =
            demoUploadPresets.find((preset) => preset.id === state.uploadPresetId)?.label ??
            demoEvaluationPresets.find((preset) => preset.id === state.benchmarkPresetId)?.label ??
            state.retrievalPresetId ??
            "manual state";
          restoredSharedStateSummary = `Restored from shared demo state · ${label} · ${new Date(state.lastUpdatedAt ?? Date.now()).toLocaleString()}.`;
        } else {
          restoredSharedState = false;
          restoredSharedStateSummary = "";
        }
        hydratedActiveRetrievalState = true;
      });
      void refreshData();
    });
  }

  $: if (hydratedRecentQueries) {
    void saveRecentQueries("svelte", selectedMode, recentQueries);
  }

  $: if (hydratedActiveRetrievalState) {
    const state: DemoActiveRetrievalState = {
      searchForm,
      scopeDriver,
      lastUpdatedAt: Date.now(),
      retrievalPresetId: retrievalPresetId || undefined,
      benchmarkPresetId: benchmarkPresetId || undefined,
      uploadPresetId: uploadPresetId || undefined,
      streamModelKey: selectedAIModelKey || undefined,
      streamPrompt,
    };
    void saveActiveRetrievalState("svelte", selectedMode, state);
  }

  const refreshData = async () => {
    loading = true;
    searchError = "";
    try {
  
      const [documentsData, statusData, _opsData, aiModelsResponse, qualityResponse] = await Promise.all([
        rag.documents.load(),
        rag.status.refresh(),
        rag.ops.refresh(),
        fetch("/demo/ai-models").then((response) => response.json()) as Promise<DemoAIModelCatalogResponse>,
        fetch(`/demo/quality/${selectedMode}`).then((response) => response.json()) as Promise<DemoRetrievalQualityResponse>,
      ]);
      aiModelCatalog = aiModelsResponse;
      qualityData = qualityResponse;
      rag.evaluate.saveSuite(evaluationSuite);
      selectedAIModelKey = selectedAIModelKey || aiModelsResponse.defaultModelKey || aiModelsResponse.models[0]?.key || "";
      documents = documentsData.documents as DemoDocument[];
      const currentChunkPreview = get(chunkPreviewStore) as DemoChunkPreview | null;
      if (
        currentChunkPreview !== null &&
        !documentsData.documents.some((document) => document.id === currentChunkPreview.document.id)
      ) {
        rag.chunkPreview.clear();
      }
      status = buildStatusView(
        statusData.status,
        statusData.capabilities,
        documents,
        selectedMode,
      );
      message = "";
    } catch (error) {
      message = error instanceof Error ? error.message : "Unable to load demo data";
    } finally {
      loading = false;
    }
  };

  const onSearchInput = (event: Event) => {
    const { name, value } = event.target as HTMLInputElement | HTMLSelectElement;

    if (name === "topK") {
      searchForm = {
        ...searchForm,
        topK: Number(value) || searchForm.topK,
      };
      return;
    }

    if (name === "kind") {
      searchForm = {
        ...searchForm,
        kind: value === "seed" || value === "custom" ? value : "",
      };
      return;
    }

    searchForm = {
      ...searchForm,
      [name]: value,
    };
  };

  const onAddInput = (event: Event) => {
    const { name, value } = event.target as HTMLInputElement | HTMLTextAreaElement;
    addForm = {
      ...addForm,
      [name]: value,
    };
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

  const executeSearch = async () => {
    searchError = "";
    searchResults = null;

    const query = searchForm.query.trim();
    if (query.length === 0) {
      searchError = "query is required";
      return;
    }

    try {
      const payload = buildSearchPayload({
        ...searchForm,
        query,
      });
      const start = performance.now();
      const results = await rag.search.search(payload as never);
      const nextState = { ...searchForm, query };
      recentQueries = [
        { label: query, state: nextState },
        ...recentQueries.filter((entry) => JSON.stringify(entry.state) !== JSON.stringify(nextState)),
      ].slice(0, 4);
      searchResults = buildSearchResponse(
        query,
        payload,
        results,
        Math.round(performance.now() - start),
      );
    } catch (error) {
      searchError = error instanceof Error ? error.message : "Search failed";
    }
  };

  const submitSearch = async (event: SubmitEvent) => {
    event.preventDefault();
    scopeDriver = "manual filters";
    await executeSearch();
  };

  const clearRetrievalScope = () => {
    searchForm = { ...searchForm, kind: "", source: "", documentId: "" };
    scopeDriver = "chip reset";
    if (searchForm.query.trim().length > 0) {
      void executeSearch();
    }
  };

  const clearAllRetrievalState = () => {
    searchForm = { ...searchForm, query: "", kind: "", source: "", documentId: "", scoreThreshold: "" };
    searchResults = null;
    searchError = "";
    scopeDriver = "clear all state";
  };

  const rerunLastQuery = () => {
    if (searchForm.query.trim().length === 0) return;
    scopeDriver = "rerun last query";
    void executeSearch();
  };

  const rerunRecentQuery = (state: SearchFormState) => {
    searchForm = state;
    scopeDriver = "recent query";
    void executeSearch();
  };

  const submitStreamQuery = (event: SubmitEvent) => {
    event.preventDefault();
    const prompt = streamPrompt.trim();
    if (prompt.length === 0) {
      message = "Enter a retrieval question before starting the stream.";
      return;
    }
    if (selectedAIModelKey.length === 0) {
      message = "Configure an AI provider to enable retrieval streaming.";
      return;
    }

    message = "";
    workflow.query(buildDemoAIStreamPrompt(selectedAIModelKey, prompt));
  };

  const runSavedSuite = async () => {
    evaluationMessage = "";

    try {
      const run = await rag.evaluate.runSuite(evaluationSuite);
      evaluationMessage = `Saved suite run finished in ${run.elapsedMs}ms and ranked ${get(evaluationLeaderboardStore).length} workflow run(s).`;
    } catch (error) {
      evaluationMessage = error instanceof Error ? `Saved suite failed: ${error.message}` : "Saved suite failed";
    }
  };

  const runEvaluation = async () => {
    evaluationMessage = "";

    try {
      const response = await rag.evaluate.evaluate(buildDemoEvaluationInput());
      evaluationMessage = `Benchmark suite finished in ${response.elapsedMs}ms across ${response.totalCases} benchmark queries.`;
    } catch (error) {
      evaluationMessage = error instanceof Error ? `Evaluation failed: ${error.message}` : "Evaluation failed";
    }
  };

  const isStreamStageComplete = (stage: typeof streamStages[number], currentStage: string) =>
    currentStage === "complete"
      ? stage === "complete" || streamStages.indexOf(stage) < streamStages.indexOf(currentStage as typeof streamStages[number])
      : streamStages.indexOf(stage) < streamStages.indexOf(currentStage as typeof streamStages[number]);

  const runPresetSearch = (query: string, options: Partial<SearchFormState> = {}, driver = "preset", presetId = "") => {
    searchForm = {
      ...searchForm,
      ...options,
      query,
      kind:
        options.kind === "seed" || options.kind === "custom" ? options.kind : "",
      source: options.source ?? "",
      documentId: options.documentId ?? "",
      scoreThreshold: options.scoreThreshold ?? "",
      topK: options.topK ?? 6,
    };
    scopeDriver = driver;
    if (driver.startsWith("benchmark preset:")) {
      benchmarkPresetId = presetId;
      retrievalPresetId = "";
      uploadPresetId = "";
    } else if (driver === "upload verification") {
      retrievalPresetId = "";
      benchmarkPresetId = "";
    } else {
      retrievalPresetId = presetId;
      benchmarkPresetId = "";
      uploadPresetId = "";
    }

    void executeSearch();
  };

  const ingestDemoUpload = async (preset: (typeof demoUploadPresets)[number]) => {
    uploadError = "";
    message = `Uploading ${preset.label}...`;
    try {
      const response = await fetch(getDemoUploadFixtureUrl(preset.id));
      if (!response.ok) {
        throw new Error(`Failed to load ${preset.fileName}: ${response.status}`);
      }
      const result = await rag.ingest.ingestUploads(
        buildDemoUploadIngestInput(preset, encodeArrayBufferToBase64(await response.arrayBuffer())),
      );
      message = `Uploaded ${preset.label}. Extracted ${result.count ?? 0} chunk(s) across ${result.documentCount ?? 1} document(s).`;
      uploadPresetId = preset.id;
      runPresetSearch(preset.query, { source: preset.expectedSources[0] ?? preset.source, topK: 6 }, "upload verification");
    } catch (error) {
      uploadError = error instanceof Error ? `Upload failed: ${error.message}` : "Upload failed";
      message = "";
    }
  };

  const uploadSelectedFile = async () => {
    if (!selectedUploadFile) {
      uploadError = "Choose a file before uploading.";
      return;
    }

    uploadError = "";
    message = `Uploading ${selectedUploadFile.name}...`;
    try {
      const uploadedName = selectedUploadFile.name;
      const result = await rag.ingest.ingestUploads({
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
              uploadedFrom: "svelte-general-upload",
            },
          },
        ],
      });
      message = `Uploaded ${uploadedName}. Extracted ${result.count ?? 0} chunk(s) across ${result.documentCount ?? 1} document(s).`;
      selectedUploadFile = null;
      await refreshData();
      runPresetSearch(`Explain ${uploadedName}`, { source: `uploads/${uploadedName}`, topK: 6 }, "upload verification");
    } catch (error) {
      uploadError = error instanceof Error ? `Upload failed: ${error.message}` : "Upload failed";
      message = "";
    }
  };

  const submitAddDocument = async (event: SubmitEvent) => {
    event.preventDefault();
    addError = "";
    searchError = "";

    try {
      const response = await rag.index.createDocument({
        id: addForm.id.trim().length > 0 ? addForm.id.trim() : undefined,
        title: addForm.title.trim(),
        source: addForm.source.trim(),
        format: addForm.format,
        text: addForm.text.trim(),
        chunking: {
          strategy: addForm.chunkStrategy,
        },
      });

      message = `Inserted ${response.inserted ?? addForm.title.trim()}`;
      addForm = {
        id: "",
        title: "",
        source: "",
        format: "markdown",
        chunkStrategy: "source_aware",
        text: "",
      };
      await refreshData();
    } catch (error) {
      addError = error instanceof Error ? error.message : "Failed to insert document";
    }
  };

  const inspectChunks = async (id: string) => {
    try {
      await rag.chunkPreview.inspect(id);
    } catch (error) {
      message = error instanceof Error ? `Failed to inspect ${id}: ${error.message}` : `Failed to inspect ${id}`;
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
      message = `Deleted ${id}`;
      const currentChunkPreview = get(chunkPreviewStore) as DemoChunkPreview | null;
      if (currentChunkPreview?.document.id === id) {
        rag.chunkPreview.clear();
      }
      await refreshData();
    } catch (error) {
      message = error instanceof Error ? `Failed to delete ${id}: ${error.message}` : "Failed to delete document";
    }
  };

  const reseed = async () => {
    try {
      message = "Reseeding defaults...";
      const result = await rag.index.reseed();
      message = `Reseed complete. Documents=${result.documents ?? 0}`;
      searchResults = null;
      await refreshData();
    } catch (error) {
      message = error instanceof Error ? `Reseed failed: ${error.message}` : "Reseed failed";
    }
  };

  const resetCustom = async () => {
    try {
      message = "Resetting custom documents...";
      const result = await rag.index.reset();
      message = `Reset complete. Documents=${result.documents ?? 0}`;
      searchResults = null;
      await refreshData();
    } catch (error) {
      message =
        error instanceof Error ? `Reset failed: ${error.message}` : "Reset failed";
    }
  };

  const syncAllSources = async () => {
    try {
      message = "Syncing all sources...";
      const result = await rag.index.syncAllSources();
      message = `Synced ${"sources" in result ? result.sources.length : 0} source(s).`;
      await refreshData();
    } catch (error) {
      message = error instanceof Error ? `Source sync failed: ${error.message}` : "Source sync failed";
    }
  };

  const queueBackgroundSync = async () => {
    try {
      message = "Queueing background sync...";
      await rag.index.syncAllSources({ background: true });
      message = "Background sync queued.";
      await refreshData();
    } catch (error) {
      message = error instanceof Error ? `Failed to queue background sync: ${error.message}` : "Failed to queue background sync";
    }
  };

  const syncSource = async (id: string) => {
    try {
      message = `Syncing ${id}...`;
      const result = await rag.index.syncSource(id);
      message = "source" in result ? `Synced ${result.source.label}.` : `Synced ${id}.`;
      await refreshData();
    } catch (error) {
      message = error instanceof Error ? `Failed to sync ${id}: ${error.message}` : `Failed to sync ${id}`;
    }
  };

  const queueBackgroundSourceSync = async (id: string) => {
    try {
      message = `Queueing ${id} in the background...`;
      const result = await rag.index.syncSource(id, { background: true });
      message = "source" in result ? `Queued ${result.source.label}.` : `Queued ${id}.`;
      await refreshData();
    } catch (error) {
      message = error instanceof Error ? `Failed to queue ${id}: ${error.message}` : `Failed to queue ${id}`;
    }
  };
</script>

<svelte:head>
  {#if cssPath}
    <link rel="stylesheet" href={cssPath} />
  {/if}
</svelte:head>


<div class="rag-demo-page">
  <header>
    <div class="header-left">
      <a class="logo" href="/">
        <img
          alt="AbsoluteJS"
          height="24"
          src="/assets/png/absolutejs-temp.png"
        />
        AbsoluteJS
      </a>
    </div>
    <nav>
      {#each backendOptions as backend}
        <div class="demo-nav-row">
          <span class={backend.id === selectedMode ? "demo-nav-row-label active" : "demo-nav-row-label"}>
            {backend.label}
          </span>
          {#each demoFrameworks as framework}
            <a
              class={[framework.id === "svelte" && backend.id === selectedMode ? "active" : "", backend.available ? "" : "disabled"].filter(Boolean).join(" ")}
              href={backend.available ? getDemoPagePath(framework.id, backend.id) : undefined}
              aria-disabled={!backend.available}
              title={backend.available ? undefined : backend.reason}
            >
              {framework.label}
            </a>
          {/each}
        </div>
      {/each}
    </nav>
  </header>

  <main class="demo-layout">
    <section class="demo-card">
      <span class="demo-hero-kicker">Svelte workflow surface</span>
      <h1>AbsoluteJS RAG Workflow Demo - Svelte</h1>
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
      {#if message}
        <p class="demo-banner">{message}</p>
      {/if}
      {#if restoredSharedState}
        <p class="demo-banner">{restoredSharedStateSummary}</p>
      {/if}
        {#if loading}
          <p class="demo-banner">Loading status and documents...</p>
        {/if}
      </div>
    {#if status}
      <section class="demo-grid">
        <article class="demo-card">
          <h2>Diagnostics</h2>
            <dl class="demo-stat-grid">
              <div>
                <dt>Selected mode</dt>
                <dd>{selectedMode}</dd>
              </div>
              <div>
                <dt>Backend</dt>
                <dd>{status.backend}</dd>
            </div>
            <div>
              <dt>Vector mode</dt>
              <dd>{status.vectorMode}</dd>
            </div>
            <div>
              <dt>Embedding dimensions</dt>
              <dd>{status.dimensions ?? "n/a"}</dd>
            </div>
            <div>
              <dt>Documents</dt>
              <dd>{status.documents.total}</dd>
            </div>
            <div>
              <dt>Total chunks</dt>
              <dd>{status.chunkCount}</dd>
            </div>
            <div>
              <dt>Seed docs</dt>
              <dd>{status.documents.byKind.seed}</dd>
            </div>
            <div>
              <dt>Custom docs</dt>
              <dd>{status.documents.byKind.custom}</dd>
            </div>
            <div>
              <dt>Vector acceleration</dt>
              <dd>{status.native.active ? "active" : "inactive"}</dd>
            </div>
            <div>
              <dt>Native source</dt>
              <dd>{status.native.sourceLabel ?? "Not applicable"}</dd>
            </div>
            <div>
              <dt>Reranker</dt>
              <dd>{status.reranker.label}</dd>
            </div>
          </dl>
          
          {#if status.native.fallbackReason}
            <p class="demo-metadata">{status.native.fallbackReason}</p>
          {/if}
          <p class="demo-metadata">{status.reranker.summary}</p>
          <p class="demo-metadata">
            Backend capabilities: <strong>{status.capabilities.join(" · ")}</strong>
          </p>
          <div class="demo-results">
            <h3>Knowledge Base Operations</h3>
            {#if $opsErrorStore}
              <p class="demo-error">{$opsErrorStore}</p>
            {/if}
            <ul class="demo-detail-list">
              {#each formatReadinessSummary($opsReadinessStore) as line}
                <li>{line}</li>
              {/each}
            </ul>
            <ul class="demo-detail-list">
              {#each formatHealthSummary($opsHealthStore) as line}
                <li>{line}</li>
              {/each}
            </ul>
            <ul class="demo-detail-list">
              {#each formatFailureSummary($opsHealthStore) as line}
                <li>{line}</li>
              {/each}
            </ul>
            <div class="demo-result-grid">
              <article class="demo-result-item">
                <h4>Sync Sources</h4>
                <div class="demo-actions">
                  <button on:click={syncAllSources} type="button">Sync all sources</button>
                  <button on:click={queueBackgroundSync} type="button">Queue background sync</button>
                </div>
                <div class="demo-badge-row">
                  {#each formatSyncDeltaChips(sortedSyncSources) as chip, index (`sync-delta-${index}`)}
                    <span class="demo-state-chip">{chip.replace(/^sync /, "")}</span>
                  {/each}
                </div>
                <div class="demo-stat-grid">
                  {#each syncOverviewLines as line, index (`sync-overview-${index}`)}
                    <article class="demo-stat-card">
                      <span class="demo-stat-label">Sync overview</span>
                      <strong>{line.includes(':') ? line.slice(0, line.indexOf(':')) : 'Sync overview'}</strong>
                      <p>{line.includes(':') ? line.slice(line.indexOf(':') + 1).trim() : line}</p>
                    </article>
                  {/each}
                </div>
                <ul class="demo-detail-list">
                  {#each (sortedSyncSources.length > 0 ? sortedSyncSources.flatMap((source) => [formatSyncSourceSummary(source), ...formatSyncSourceDetails(source)]) : ["No sync sources configured yet."]) as line}
                    <li>{line}</li>
                  {/each}
                </ul>
                <div class="demo-actions">
                  {#each sortedSyncSources as source}
                    <details class:demo-sync-action-failed={source.status === "failed"} class="demo-sync-action-details" open={source.status === "failed"}>
                      <summary>{formatSyncSourceCollapsedSummary(source)}</summary>
                      <div class="demo-sync-action-group">
                        <div class="demo-actions">
                          <button on:click={() => syncSource(source.id)} type="button">Sync {source.label}</button>
                          <button on:click={() => queueBackgroundSourceSync(source.id)} type="button">Queue {source.label}</button>
                          {#if source.status === "failed"}
                            <button on:click={() => syncSource(source.id)} type="button">Retry now</button>
                            <button on:click={() => queueBackgroundSourceSync(source.id)} type="button">Retry in background</button>
                          {/if}
                        </div>
                        <p class="demo-metadata demo-sync-action-meta">{formatSyncSourceActionSummary(source)}</p>
                        {#if formatSyncSourceActionBadges(source).length > 0}
                          <div class="demo-badge-row">
                            {#each formatSyncSourceActionBadges(source) as badge, index (`${source.id}-${index}`)}
                              <span class="demo-badge">{badge}</span>
                            {/each}
                          </div>
                        {/if}
                      </div>
                    </details>
                  {/each}
                </div>
              </article>
              <article class="demo-result-item">
                <h4>Admin Jobs</h4>
                <ul class="demo-detail-list">
                  {#each (formatAdminJobList($opsAdminJobsStore).length > 0 ? formatAdminJobList($opsAdminJobsStore) : ["No admin jobs recorded yet."]) as line}
                    <li>{line}</li>
                  {/each}
                </ul>
              </article>
              <article class="demo-result-item">
                <h4>Recent Admin Actions</h4>
                <ul class="demo-detail-list">
                  {#each (formatAdminActionList($opsAdminActionsStore).length > 0 ? formatAdminActionList($opsAdminActionsStore) : ["No admin actions recorded yet."]) as line}
                    <li>{line}</li>
                  {/each}
                </ul>
              </article>
            </div>
          </div>
          <div class="demo-actions">
            <button on:click={reseed} type="button">Re-seed defaults</button>
            <button on:click={resetCustom} type="button">Reset custom docs</button>
            <button on:click={refreshData} type="button">Refresh</button>
          </div>
        </article>

        <article class="demo-card">
          <h2>Retrieve And Verify</h2>
          <p class="demo-metadata">
            This section is powered by <code>createRAG</code>. Run a query, then
            confirm the returned chunk text and source label match the indexed source list below.
          </p>
          <div class="demo-preset-grid">
            <button
              type="button"
              on:click={() => runPresetSearch("How do metadata filters change retrieval quality?", { kind: "seed" }, "preset: filter behavior", "filter-behavior")}
            >
              Filter behavior
            </button>
            <button type="button" on:click={() => runPresetSearch("What should I verify after ingesting a new source?", {}, "preset: verify ingestion", "verify-ingestion")}>
              Verify ingestion
            </button>
            <button
              type="button"
              on:click={() => runPresetSearch("List support policies for shipping and returns.", { source: "guide/demo.md" }, "preset: source filter", "source-filter")}
            >
              Source filter
            </button>
            <button
              type="button"
              on:click={() => runPresetSearch("Why should metadata be stable?", { source: "guides/metadata.md" }, "preset: metadata discipline", "metadata-discipline")}
            >
              Metadata discipline
            </button>
          </div>
          <form class="demo-search-form" on:submit={submitSearch}>
            <label for="query">Query</label>
            <input
              id="query"
              name="query"
              on:input={onSearchInput}
              placeholder="e.g. How do metadata filters work?"
              required
              type="text"
              value={searchForm.query}
            />

            <label for="topK">Top K</label>
            <input
              id="topK"
              max={20}
              min={1}
              name="topK"
              on:input={onSearchInput}
              type="number"
              value={searchForm.topK}
            />

            <label for="scoreThreshold">Minimum score (0-1)</label>
            <input
              id="scoreThreshold"
              name="scoreThreshold"
              on:input={onSearchInput}
              placeholder="optional"
              type="number"
              step="0.01"
              min={0}
              max={1}
              value={searchForm.scoreThreshold}
            />

            <label for="kind">Kind filter</label>
            <select
              id="kind"
              name="kind"
              on:change={onSearchInput}
              value={searchForm.kind}
            >
              <option value="">Any</option>
              <option value="seed">Seed</option>
              <option value="custom">Custom</option>
            </select>

            <label for="source">Source filter</label>
            <input
              class:demo-filter-active={searchForm.source.trim().length > 0}
              id="source"
              name="source"
              on:input={(event) => { scopeDriver = "manual filters"; onSearchInput(event); }}
              placeholder="e.g. guide/demo.md"
              type="text"
              value={searchForm.source}
            />

            <label for="documentId">Document ID filter</label>
            <input
              class:demo-filter-active={searchForm.documentId.trim().length > 0}
              id="documentId"
              name="documentId"
              on:input={(event) => { scopeDriver = "manual filters"; onSearchInput(event); }}
              placeholder="e.g. rag-demo"
              type="text"
              value={searchForm.documentId}
            />

            <button type="submit">Search index</button>
          </form>
          <div class="demo-results">
            <h3>Active Retrieval Scope</h3>
            <div class="demo-badge-row">
              <span class="demo-state-chip">{retrievalScopeSummary}</span>
              <span class="demo-state-chip">Changed by: {scopeDriver.replace(/^row action: /, "row action · ")}</span>
              <span class="demo-state-chip">Results: {searchResults?.count ?? 0}</span>
            </div>
            <p class="demo-metadata">{retrievalScopeHint}</p>
            <div class="demo-actions">
              <button disabled={searchForm.query.trim().length === 0 && searchForm.source.trim().length === 0 && searchForm.documentId.trim().length === 0 && searchForm.kind.length === 0} on:click={clearRetrievalScope} type="button">Clear scope</button>
              <button disabled={searchForm.query.trim().length === 0} on:click={rerunLastQuery} type="button">Rerun query</button>
              <button on:click={clearAllRetrievalState} type="button">Clear search</button>
            </div>
            {#if recentQueries.length > 0}
              <p class="demo-section-caption">Recent Searches</p>
              <div class="demo-badge-row">
                {#each recentQueries as entry, index (`recent-query-${index}`)}
                  <button class="demo-state-chip" on:click={() => rerunRecentQuery(entry.state)} type="button">{entry.label}</button>
                {/each}
              </div>
            {/if}
          </div>
          {#if searchError}
            <p class="demo-error">{searchError}</p>
          {/if}
          {#if searchResults}
            <div class="demo-results">
              <p>{searchResults.count} results for “{searchResults.query}” in {searchResults.elapsedMs}ms</p>
              <p class="demo-metadata">{retrievalScopeSummary}</p>
              <p class="demo-metadata">Scope changed by: {scopeDriver}</p>
              <p class="demo-metadata">Reranking is active: AbsoluteJS reorders the first vector hits with the built-in heuristic provider before these results render.</p>
              <p class="demo-metadata">
                Verification rule: a good result shows chunk text that answers the query
                and a source label you can trace back to the indexed source list.
              </p>
              <div class="demo-result-grid">
                {#each searchResults.chunks as chunk}
                  <article class="demo-result-item">
                    <h3>{chunk.title}</h3>
                    <p class="demo-result-score">score: {formatScore(chunk.score)}</p>
                    <p class="demo-result-source">source: {chunk.source}</p>
                    {#each formatDemoMetadataSummary(chunk.metadata) as line}
                    <p class="demo-metadata">{line}</p>
                  {/each}
                  <p class="demo-result-text">{chunk.text}</p>
                  </article>
                {/each}
              </div>
            </div>
          {/if}

          <div class="demo-results">
            <h3>Benchmark Retrieval</h3>
            <p class="demo-metadata">
              This section uses <code>createRAG().evaluate</code> to run a built-in benchmark suite. Each case names the source we expect retrieval to surface so you can compare expected, retrieved, and missing evidence directly.
            </p>
            <div class="demo-preset-grid">
              {#each demoEvaluationPresets as preset}
                <button
                  type="button"
                  title={preset.description}
                  on:click={() => runPresetSearch(preset.query, { source: preset.expectedSources[0] ?? "" }, `benchmark preset: ${preset.label}`, preset.id)}
                >
                  {preset.label}
                </button>
              {/each}
            </div>
            <div class="demo-actions">
              <button disabled={$evaluationIsEvaluatingStore} on:click={runEvaluation} type="button">
                {$evaluationIsEvaluatingStore ? "Running benchmark suite..." : "Run benchmark suite"}
              </button>
            </div>
            {#if evaluationMessage}
              <p class="demo-metadata">{evaluationMessage}</p>
            {/if}
            {#if $evaluationErrorStore}
              <p class="demo-error">{$evaluationErrorStore}</p>
            {/if}
            {#if $evaluationStore}
              <p class="demo-metadata">Benchmark summary: {formatEvaluationSummary($evaluationStore as RAGEvaluationResponse)}</p>
              <div class="demo-result-grid">
                {#each $evaluationStore.cases as entry}
                  <article class={`demo-result-item demo-evaluation-card demo-evaluation-${entry.status}`}>
                    <h4>{entry.label ?? entry.caseId}</h4>
                    <p class="demo-result-source">{entry.query}</p>
                    <p class="demo-evaluation-status">{entry.status.toUpperCase()}</p>
                    <p class="demo-metadata">{formatEvaluationCaseSummary(entry)}</p>
                    <p class="demo-metadata">expected: {formatEvaluationExpected(entry)}</p>
                    <p class="demo-metadata">retrieved: {formatEvaluationRetrieved(entry)}</p>
                    <p class="demo-result-text">missing: {formatEvaluationMissing(entry)}</p>
                  </article>
                {/each}
              </div>
            {/if}
          </div>

          <div class="demo-results">
            <h3>Retrieval Quality Tooling</h3>
            <p class="demo-metadata">This section uses the saved evaluation suite plus first-class retrieval-strategy, reranker comparison, and persisted benchmark history primitives. The suite stays registered in the page state, the leaderboard ranks prior suite runs, and the history cards call out the latest benchmark drift for each strategy.</p>
            <ul class="demo-detail-list">
              {#each ($evaluationSuitesStore.length > 0 ? $evaluationSuitesStore : [evaluationSuite]) as suite (suite.id)}
                <li>{suite.label ?? suite.id} · {suite.input.cases.length} case(s){suite.description ? ` · ${suite.description}` : ""}</li>
              {/each}
            </ul>
            <div class="demo-actions">
              <button disabled={$evaluationIsEvaluatingStore} on:click={runSavedSuite} type="button">{$evaluationIsEvaluatingStore ? "Running saved suite..." : "Run saved suite"}</button>
            </div>
            <div class="demo-result-grid">
              <article class="demo-result-item">
                <h4>Suite leaderboard</h4>
                <ul class="demo-detail-list">
                  {#if $evaluationLeaderboardStore.length > 0}
                    {#each $evaluationLeaderboardStore as entry (entry.runId)}
                      <li>{formatEvaluationLeaderboardEntry(entry)}</li>
                    {/each}
                  {:else}
                    <li>Run the saved suite to rank workflow benchmark runs.</li>
                  {/if}
                </ul>
              </article>
              <article class="demo-result-item">
                <h4>Quality winners</h4>
                <ul class="demo-detail-list">
                  {#if qualityData}
                    {#each [...formatRetrievalComparisonSummary(qualityData.retrievalComparison), ...formatRerankerComparisonSummary(qualityData.rerankerComparison), formatGroundingEvaluationSummary(qualityData.groundingEvaluation), ...(qualityData.providerGroundingComparison ? formatGroundingProviderSummary(qualityData.providerGroundingComparison) : ["Configure an AI provider to compare real model-grounded answers."])] as line, index (`quality-summary-${index}`)}
                      <li>{line}</li>
                    {/each}
                  {:else}
                    <li>Loading quality comparison...</li>
                  {/if}
                </ul>
              </article>
            </div>
            {#if qualityData}
              <div class="demo-result-grid">
                {#each qualityData.retrievalComparison.entries as entry (entry.retrievalId)}
                  <article class="demo-result-item">
                    <h4>{entry.label}</h4>
                    <p class="demo-metadata">{formatRetrievalComparisonEntry(entry)}</p>
                  </article>
                {/each}
              </div>
              <div class="demo-result-grid">
                {#each qualityData.rerankerComparison.entries as entry (entry.rerankerId)}
                  <article class="demo-result-item">
                    <h4>{entry.label}</h4>
                    <p class="demo-metadata">{formatRerankerComparisonEntry(entry)}</p>
                  </article>
                {/each}
              </div>
              <div class="demo-result-grid">
                {#each qualityData.groundingEvaluation.cases as entry (`grounding-${entry.caseId}`)}
                  <article class="demo-result-item">
                    <h4>{entry.label ?? entry.caseId}</h4>
                    <p class="demo-metadata">{formatGroundingEvaluationCase(entry)}</p>
                    <ul class="demo-detail-list">
                      {#each formatGroundingEvaluationDetails(entry) as line, index (`${entry.caseId}-${index}`)}
                        <li>{line}</li>
                      {/each}
                    </ul>
                  </article>
                {/each}
              </div>
              {#if qualityData.providerGroundingComparison}
                <div class="demo-result-grid">
                  {#each qualityData.providerGroundingComparison.entries as entry (`provider-grounding-${entry.providerKey}`)}
                    <article class="demo-result-item">
                      <h4>{entry.label}</h4>
                      <p class="demo-metadata">{formatGroundingProviderEntry(entry)}</p>
                    </article>
                  {/each}
                </div>
                <div class="demo-result-grid">
                  {#each qualityData.providerGroundingComparison.entries as entry (`provider-grounding-history-${entry.providerKey}`)}
                    <article class="demo-result-item">
                      <h4>{entry.label} history</h4>
                      <ul class="demo-detail-list">
                        {#each [...formatGroundingHistorySummary(qualityData.providerGroundingHistories[entry.providerKey]), ...formatGroundingHistoryDiff(qualityData.providerGroundingHistories[entry.providerKey]), ...formatGroundingHistorySnapshots(qualityData.providerGroundingHistories[entry.providerKey])] as line, index (`${entry.providerKey}-history-${index}`)}
                          <li>{line}</li>
                        {/each}
                      </ul>
                    </article>
                  {/each}
                </div>
                <div class="demo-result-grid">
                  {#each qualityData.providerGroundingComparison.entries as entry (`provider-grounding-artifact-trail-${entry.providerKey}`)}
                    <article class="demo-result-item">
                      <h4>{entry.label} artifact trail</h4>
                      <ul class="demo-detail-list">
                        {#each formatGroundingHistoryArtifactTrail(qualityData.providerGroundingHistories[entry.providerKey]) as line, index (`${entry.providerKey}-trail-${index}`)}
                          <li>{line}</li>
                        {/each}
                      </ul>
                    </article>
                  {/each}
                </div>
                <div class="demo-result-grid">
                  <article class="demo-result-item">
                    <h4>Hardest grounding cases</h4>
                    <ul class="demo-detail-list">
                      {#each qualityData.providerGroundingComparison.difficultyLeaderboard as entry (`provider-grounding-difficulty-${entry.caseId}`)}
                        <li>{formatGroundingCaseDifficultyEntry(entry)}</li>
                      {/each}
                    </ul>
                  </article>
                  <article class="demo-result-item">
                    <h4>Grounding difficulty history</h4>
                    <ul class="demo-detail-list">
                      {#each [...formatGroundingDifficultyHistorySummary(qualityData.providerGroundingDifficultyHistory), ...formatGroundingDifficultyHistoryDiff(qualityData.providerGroundingDifficultyHistory)] as line, index (`provider-grounding-difficulty-history-${index}`)}
                        <li>{line}</li>
                      {/each}
                    </ul>
                  </article>
                </div>
                <div class="demo-result-grid">
                  {#each qualityData.providerGroundingComparison.caseComparisons as entry (`provider-grounding-case-${entry.caseId}`)}
                    <article class="demo-result-item">
                      <h4>{entry.label}</h4>
                      <ul class="demo-detail-list">
                        {#each [...formatGroundingProviderCaseSummary(entry), ...entry.entries.flatMap((candidate) => [formatGroundingProviderCaseEntry(candidate), ...formatGroundingProviderCaseDetails(candidate)])] as line, index (`${entry.caseId}-${index}`)}
                          <li>{line}</li>
                        {/each}
                      </ul>
                    </article>
                  {/each}
                </div>
              {/if}
              <div class="demo-result-grid">
                {#each qualityData.retrievalComparison.entries as entry (entry.retrievalId)}
                  <article class="demo-result-item">
                    <h4>{entry.label} history</h4>
                    <ul class="demo-detail-list">
                      {#each [...formatEvaluationHistorySummary(qualityData.retrievalHistories[entry.retrievalId]), ...formatEvaluationHistoryDiff(qualityData.retrievalHistories[entry.retrievalId])] as line, index (`${entry.retrievalId}-${index}`)}
                        <li>{line}</li>
                      {/each}
                    </ul>
                  </article>
                {/each}
              </div>
              <div class="demo-result-grid">
                {#each qualityData.rerankerComparison.entries as entry (entry.rerankerId)}
                  <article class="demo-result-item">
                    <h4>{entry.label} history</h4>
                    <ul class="demo-detail-list">
                      {#each [...formatEvaluationHistorySummary(qualityData.rerankerHistories[entry.rerankerId]), ...formatEvaluationHistoryDiff(qualityData.rerankerHistories[entry.rerankerId])] as line, index (`${entry.rerankerId}-${index}`)}
                        <li>{line}</li>
                      {/each}
                    </ul>
                  </article>
                {/each}
              </div>
            {/if}
          </div>

          <div class="demo-stream-panel">
            <h3>Stream Retrieval Workflow</h3>
            <p class="demo-metadata">
              This page composes <code>createRAG()</code> for the broader demo, and this stream section proves the explicit workflow contract through <code>createRAG().workflow</code>.
            </p>
            <form class="demo-stream-form" on:submit|preventDefault={submitStreamQuery}>
              <label for="stream-model-key">Answer model</label>
              <select id="stream-model-key" bind:value={selectedAIModelKey}>
                {#if aiModelCatalog.models.length === 0}
                  <option value="">Configure an AI provider</option>
                {:else}
                  {#each aiModelCatalog.models as model}
                    <option value={model.key}>{formatDemoAIModelLabel(model)}</option>
                  {/each}
                {/if}
              </select>
              <p class="demo-metadata">Model switching stays on the official AbsoluteJS plugin path by selecting the provider and model sent with the retrieval stream request.</p>
              <label for="stream-query">Question</label>
              <input id="stream-query" bind:value={streamPrompt} placeholder="e.g. What should I verify after ingesting a new source?" type="text" />
              <div class="demo-actions">
                {#if !$streamBusyStore}
                  <button type="submit">Ask with retrieval stream</button>
                {:else}
                  <button on:click={workflow.cancel} type="button">Cancel</button>
                {/if}
              </div>
            </form>
            <div class="demo-result-grid">
              <article class="demo-result-item">
                <h4>Workflow Contract</h4>
                <ul class="demo-detail-list">
                  <li>Explicit workflow surface: createRAG().workflow</li>
                  <li>Snapshot stage: {$streamWorkflowStateStore.stage}</li>
                  <li>Live stage field: {$streamStageStore}</li>
                  <li>Snapshot sources: {$streamWorkflowStateStore.sources.length}</li>
                  <li>Snapshot running: {$streamWorkflowStateStore.isRunning ? "yes" : "no"}</li>
                </ul>
              </article>
              <article class="demo-result-item">
                <h4>Workflow Proof</h4>
                <ul class="demo-detail-list">
                  <li>Retrieved: {$streamWorkflowStateStore.hasRetrieved ? "yes" : "no"}</li>
                  <li>Has sources: {$streamWorkflowStateStore.hasSources ? "yes" : "no"}</li>
                  <li>Citation count: {$streamCitationsStore.length}</li>
                  <li>Grounding coverage: {$streamGroundedAnswerStore.coverage}</li>
                </ul>
              </article>
            </div>
            <div class="demo-stage-row">
              {#each streamStages as stage}
                <span class={["demo-stage-pill", $streamStageStore === stage ? "current" : "", isStreamStageComplete(stage, $streamStageStore) ? "complete" : ""].filter(Boolean).join(" ")}>{stage}</span>
              {/each}
            </div>
            {#if $streamRetrievalStore}
              <dl class="demo-stream-stats">
                <div><dt>Retrieval started</dt><dd>{$streamRetrievalStore.retrievalStartedAt ? formatDate($streamRetrievalStore.retrievalStartedAt) : "n/a"}</dd></div>
                <div><dt>Retrieval duration</dt><dd>{$streamRetrievalStore.retrievalDurationMs ?? 0}ms</dd></div>
                <div><dt>Retrieved sources</dt><dd>{$streamRetrievalStore.sources.length}</dd></div>
                <div><dt>Current stage</dt><dd>{$streamStageStore}</dd></div>
              </dl>
            {/if}
            {#if $streamErrorStore}
              <p class="demo-error">{$streamErrorStore}</p>
            {/if}
            {#if $streamLatestMessageStore?.thinking}
              <div class="demo-stream-block">
                <h4>Thinking</h4>
                <p class="demo-result-text">{$streamLatestMessageStore.thinking}</p>
              </div>
            {/if}
            {#if $streamLatestMessageStore?.content}
              <div class="demo-stream-block">
                <h4>Answer</h4>
                <p class="demo-result-text">{$streamLatestMessageStore.content}</p>
              </div>
            {/if}
            {#if $streamLatestMessageStore?.content}
              <div class="demo-results">
                <h4>Answer Grounding</h4>
                <p class={["demo-grounding-badge", `demo-grounding-${$streamGroundedAnswerStore.coverage}`].join(" ")}>
                  {formatGroundingCoverage($streamGroundedAnswerStore.coverage)}
                </p>
                <ul class="demo-detail-list">
                  {#each formatGroundingSummary($streamGroundedAnswerStore) as line}
                    <li>{line}</li>
                  {/each}
                </ul>
                {#if $streamGroundedAnswerStore.parts.some((part) => part.type === "citation")}
                  <div class="demo-result-grid">
                    {#each $streamGroundedAnswerStore.parts.filter((part) => part.type === "citation") as part, index}
                    <article class="demo-result-item demo-grounding-card">
                      <p class="demo-citation-badge">{formatGroundingPartReferences(part.referenceNumbers)}</p>
                      {#each formatGroundedAnswerPartDetails(part) as line}
                        <p class="demo-metadata">{line}</p>
                      {/each}
                      <p class="demo-result-text">{part.text}</p>
                    </article>
                    {/each}
                  </div>
                {/if}
              </div>
            {/if}
            {#if $streamGroundingReferencesStore.length > 0}
              <div class="demo-results">
                <h4>Grounding Reference Map</h4>
                <p class="demo-metadata">
                  Each reference resolves answer citations back to concrete evidence with page, sheet, slide, archive, or thread context when available.
                </p>
                <div class="demo-result-grid">
                  {#each $streamGroundingReferencesStore as reference}
                    <article class="demo-result-item demo-grounding-card">
                      <p class="demo-citation-badge">[{reference.number}] {formatGroundingReferenceLabel(reference)}</p>
                      <p class="demo-result-score">{formatGroundingReferenceSummary(reference)}</p>
                      {#each formatGroundingReferenceDetails(reference) as line}
                        <p class="demo-metadata">{line}</p>
                      {/each}
                      <p class="demo-result-text">{formatGroundingReferenceExcerpt(reference)}</p>
                    </article>
                  {/each}
                </div>
              </div>
            {/if}
            {#if $streamSourceSummariesStore.length > 0}
              <div class="demo-results">
                <h4>Evidence Sources</h4>
                <div class="demo-result-grid">
                  {#each $streamSourceSummariesStore as summary}
                    <article class="demo-result-item">
                      <h3>{summary.label}</h3>
                      {#each formatSourceSummaryDetails(summary) as line}
                        <p class="demo-metadata">{line}</p>
                      {/each}
                      <p class="demo-result-text">{summary.excerpt}</p>
                    </article>
                  {/each}
                </div>
              </div>
            {/if}
            {#if $streamCitationsStore.length > 0}
              <div class="demo-results">
                <h4>Citation Trail</h4>
                <p class="demo-metadata">
                  Each citation maps a concrete retrieved chunk to a stable reference number you can carry into the answer UI.
                </p>
                <div class="demo-result-grid">
                  {#each $streamCitationsStore as citation, index}
                    <article class="demo-result-item demo-citation-card">
                      <p class="demo-citation-badge">[{index + 1}] {formatCitationLabel(citation)}</p>
                      <p class="demo-result-score">{formatCitationSummary(citation)}</p>
                      {#each formatCitationDetails(citation) as line}
                        <p class="demo-metadata">{line}</p>
                      {/each}
                      <p class="demo-result-text">{formatCitationExcerpt(citation)}</p>
                    </article>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        </article>
      </section>
    {/if}

    <section class="demo-grid">
      <article class="demo-card">
        <h2>Ingest Document</h2>
        <p class="demo-metadata">
          Add a document, choose its source format and chunking strategy, then verify how AbsoluteJS indexes it.
        </p>
        <div class="demo-results">
          <h3>Upload Extracted Fixtures</h3>
          <p class="demo-metadata">
            These buttons use <code>createRAG().ingest.ingestUploads</code> directly. Each fixture is fetched from the local demo corpus, sent through the published upload ingest route, and then verified with a retrieval query against the uploaded source path.
          </p>
          <p class="demo-metadata">
            Upload fixtures validate the extractor pipeline immediately. The managed document list below stays focused on authored example documents, while uploaded binaries are verified through retrieval.
          </p>
          <div class="demo-preset-grid">
            {#each demoUploadPresets as preset (preset.id)}
              <button
                disabled={$ingestIsIngestingStore}
                title={preset.description}
                type="button"
                on:click={() => void ingestDemoUpload(preset)}
              >
                {preset.label}
              </button>
            {/each}
          </div>
          <div class="demo-upload-row">
            <input
              accept={SUPPORTED_FILE_TYPE_OPTIONS.slice(1).map((entry) => entry[0]).join(",")}
              type="file"
              on:change={(event) => {
                selectedUploadFile = (event.currentTarget as HTMLInputElement).files?.[0] ?? null;
              }}
            />
            <button disabled={$ingestIsIngestingStore || selectedUploadFile === null} type="button" on:click={() => void uploadSelectedFile()}>
              Upload file
            </button>
          </div>
          {#if selectedUploadFile}
            <p class="demo-metadata">Selected file: {selectedUploadFile.name}</p>
          {/if}
          {#if uploadError}<p class="demo-error">{uploadError}</p>{/if}
        </div>
        <form class="demo-add-form" on:submit={submitAddDocument}>
          <label for="customId">Optional ID</label>
          <input id="customId" name="id" on:input={onAddInput} type="text" value={addForm.id} />
          <label for="customTitle">Title</label>
          <input id="customTitle" name="title" on:input={onAddInput} required type="text" value={addForm.title} />
          <label for="customSource">Source</label>
          <input
            id="customSource"
            name="source"
            on:input={onAddInput}
            required
            placeholder="e.g. onboarding-guide.md"
            type="text"
            value={addForm.source}
          />
          <label for="customFormat">Source format</label>
          <select id="customFormat" name="format" on:change={onAddInput} value={addForm.format}>
            {#each demoContentFormats as format}
              <option value={format}>{formatContentFormat(format)}</option>
            {/each}
          </select>
          <label for="customChunkStrategy">Chunking strategy</label>
          <select id="customChunkStrategy" name="chunkStrategy" on:change={onAddInput} value={addForm.chunkStrategy}>
            {#each demoChunkingStrategies as strategy}
              <option value={strategy}>{formatChunkStrategy(strategy)}</option>
            {/each}
          </select>
          <label for="customText">Text</label>
          <textarea id="customText" name="text" on:input={onAddInput} required rows="6">{addForm.text}</textarea>
          <button type="submit">Ingest document and rebuild index</button>
        </form>
        {#if addError}
          <p class="demo-error">{addError}</p>
        {/if}
      </article>

      <article class="demo-card">
        <h2>Indexed Sources</h2>
        <div class="demo-stat-grid">
          <article class="demo-stat-card">
            <span class="demo-stat-label">Indexed documents</span>
            <strong>{filteredDocuments.length}</strong>
            <p>{filteredDocuments.filter((document) => document.kind === "seed").length} seed · {filteredDocuments.filter((document) => document.kind === "custom").length} custom</p>
          </article>
        </div>
        <div class="demo-source-filter-row">
          <input
            bind:value={documentSearchTerm}
            placeholder="Search indexed sources by title, source, or text"
            type="text"
            on:input={() => {
              documentPage = 1;
            }}
          />
          <select
            bind:value={documentTypeFilter}
            on:change={() => {
              documentPage = 1;
            }}
          >
            {#each SUPPORTED_FILE_TYPE_OPTIONS as [value, label]}
              <option value={value}>{label}</option>
            {/each}
          </select>
        </div>
        <div class="demo-pagination-row">
          <p class="demo-metadata">Showing {paginatedDocuments.length} of {filteredDocuments.length} matching documents</p>
          <div class="demo-pagination-controls">
            <button disabled={documentPage <= 1} type="button" on:click={() => (documentPage = Math.max(1, documentPage - 1))}>Prev</button>
            {#each Array.from({ length: totalDocumentPages }, (_, index) => index + 1) as pageNumber}
              <button
                class={pageNumber === documentPage ? "demo-page-button demo-page-button-active" : "demo-page-button"}
                type="button"
                on:click={() => (documentPage = pageNumber)}
              >
                {pageNumber}
              </button>
            {/each}
            <button disabled={documentPage >= totalDocumentPages} type="button" on:click={() => (documentPage = Math.min(totalDocumentPages, documentPage + 1))}>Next</button>
          </div>
        </div>
        <div class="demo-document-list">
          {#if paginatedDocuments.length === 0}
            <p class="demo-metadata">No indexed sources match the current filters.</p>
          {:else}
            {#each paginatedDocuments as doc}
              <details class="demo-document-item demo-document-collapsible">
                <summary>
                  <div class="demo-document-header">
                    <div>
                      <h3>{doc.title}</h3>
                      <p class="demo-metadata">{doc.source} · {doc.kind} · {doc.chunkCount} chunk(s)</p>
                    </div>
                    <div class="demo-badge-row">
                      <span class="demo-badge">{formatContentFormat(doc.format)}</span>
                      <span class="demo-badge">{formatChunkStrategy(doc.chunkStrategy)}</span>
                      <span class="demo-badge">chunk target {doc.chunkSize} chars</span>
                    </div>
                  </div>
                </summary>
                <div class="demo-collapsible-content">
                  <div class="demo-actions">
                    <button type="button" on:click={() => inspectChunks(doc.id)}>Inspect chunks</button>
                    <button
                      type="button"
                      on:click={() => runPresetSearch(`Source search for ${doc.source}`, { source: doc.source }, `row action: source ${doc.source}`)}
                    >
                      Search source
                    </button>
                    <button
                      type="button"
                      on:click={() => runPresetSearch(`Explain ${doc.title}`, { documentId: doc.id }, `row action: document ${doc.id}`)}
                    >
                      Search document
                    </button>
                    {#if doc.kind === "custom"}
                      <button type="button" on:click={() => deleteDocument(doc.id)}>Delete</button>
                    {/if}
                  </div>
                  <div class="demo-key-value-grid">
                    <div class="demo-key-value-row"><span>Source</span><strong>{doc.source}</strong></div>
                    <div class="demo-key-value-row"><span>Created</span><strong>{formatDate(doc.createdAt)}</strong></div>
                    <div class="demo-key-value-row"><span>Kind</span><strong>{doc.kind}</strong></div>
                    <div class="demo-key-value-row"><span>Chunks</span><strong>{doc.chunkCount}</strong></div>
                    {#each formatDemoMetadataSummary(doc.metadata) as line}
                      <div class="demo-key-value-row"><span>Metadata</span><strong>{line}</strong></div>
                    {/each}
                  </div>
                  <p class="demo-document-preview">{doc.text}</p>
                  <div class="demo-inline-preview">
                    {#if $chunkPreviewLoadingStore && $chunkPreviewStore?.document.id !== doc.id}
                      <p class="demo-metadata">Preparing chunk preview...</p>
                    {:else if $chunkPreviewStore?.document.id === doc.id}
                      <p class="demo-section-caption">Chunk Preview</p>
                      <p class="demo-metadata">
                        {$chunkPreviewStore.document.title} · {formatContentFormat($chunkPreviewStore.document.format as DemoContentFormat)} · {formatChunkStrategy($chunkPreviewStore.document.chunkStrategy as DemoChunkingStrategy)} · {$chunkPreviewStore.chunks.length} chunk(s)
                      </p>
                      <article class="demo-result-item">
                        <h3>Normalized text</h3>
                        <p class="demo-result-text">{$chunkPreviewStore.normalizedText}</p>
                      </article>
                      <div class="demo-result-grid">
                        {#each $chunkPreviewStore.chunks as chunk}
                          <article class="demo-result-item">
                            <h3>{chunk.chunkId}</h3>
                            <p class="demo-result-source">source: {chunk.source ?? $chunkPreviewStore.document.source}</p>
                            <p class="demo-metadata">{chunkIndexText(chunk, $chunkPreviewStore.chunks.length)}</p>
                            <p class="demo-result-text">{chunk.text}</p>
                          </article>
                        {/each}
                      </div>
                    {/if}
                  </div>
                </div>
              </details>
            {/each}
          {/if}
        </div>
      </article>
    </section>
  </main>
</div>

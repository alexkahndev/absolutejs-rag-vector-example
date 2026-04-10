import { Fragment, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useRAG } from "@absolutejs/absolute/react/ai";
import { Head } from "@absolutejs/absolute/react/components";
import type { RAGEvaluationResponse } from "@absolutejs/absolute";
import {
  type AddFormState,
  type DemoAIModelCatalogResponse,
  type DemoActiveRetrievalState,
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
  formatGroundingHistorySummary,
  formatGroundingHistoryArtifactTrail,
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
} from "../../demo-backends";

type DemoProps = {
  availableBackends?: DemoBackendDescriptor[];
  cssPath?: string;
  mode?: DemoBackendMode;
};

const initialSearch: SearchFormState = {
  query: "",
  topK: 6,
  scoreThreshold: "",
  kind: "",
  source: "",
  documentId: "",
};

const initialAddForm: AddFormState = {
  id: "",
  title: "",
  source: "",
  format: "markdown",
  chunkStrategy: "source_aware",
  text: "",
};

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

export const ReactRAGVectorDemo = ({ availableBackends, cssPath, mode }: DemoProps) => {
  const [selectedMode, setSelectedMode] = useState<DemoBackendMode>(
    mode ?? getInitialBackendMode(),
  );
  const [searchForm, setSearchForm] = useState<SearchFormState>(initialSearch);
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [addForm, setAddForm] = useState<AddFormState>(initialAddForm);
  const [searchError, setSearchError] = useState("");
  const [addError, setAddError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [evaluationMessage, setEvaluationMessage] = useState("");
  const [scopeDriver, setScopeDriver] = useState("manual filters");
  const [restoredSharedState, setRestoredSharedState] = useState(false);
  const [restoredSharedStateSummary, setRestoredSharedStateSummary] = useState("");
  const [retrievalPresetId, setRetrievalPresetId] = useState("");
  const [benchmarkPresetId, setBenchmarkPresetId] = useState("");
  const [uploadPresetId, setUploadPresetId] = useState("");
  const [recentQueries, setRecentQueries] = useState<Array<{ label: string; state: SearchFormState }>>([]);
  const [pendingScrollTarget, setPendingScrollTarget] = useState<"search-results" | null>(null);
  const [documentPage, setDocumentPage] = useState(1);
  const [documentSearchTerm, setDocumentSearchTerm] = useState("");
  const [documentTypeFilter, setDocumentTypeFilter] = useState("all");
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);
  const [qualityData, setQualityData] = useState<DemoRetrievalQualityResponse | null>(null);
  const [qualityView, setQualityView] = useState<"overview" | "strategies" | "grounding" | "history">("overview");
  const [aiModelCatalog, setAiModelCatalog] = useState<DemoAIModelCatalogResponse>({ defaultModelKey: null, models: [] });
  const [selectedAIModelKey, setSelectedAIModelKey] = useState("");
  const [streamPrompt, setStreamPrompt] = useState("How do metadata filters change retrieval quality?");
  const activeRagPath = useMemo(() => getRAGPathForMode(selectedMode), [selectedMode]);
  const backendOptions = useMemo(() => getAvailableDemoBackends(availableBackends), [availableBackends]);
  const evaluationSuite = useMemo(() => buildDemoEvaluationSuite(), []);

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

  const rag = useRAG(activeRagPath, { autoLoadStatus: false });
  const documents = rag.documents.documents as DemoDocument[];
  const filteredDocuments = useMemo(() => {
    const query = documentSearchTerm.trim().toLowerCase();
    return documents.filter((document) => {
      const matchesQuery =
        query.length === 0 ||
        document.title.toLowerCase().includes(query) ||
        document.source.toLowerCase().includes(query) ||
        document.text.toLowerCase().includes(query);
      const matchesType =
        documentTypeFilter === "all" || inferDocumentExtension(document) === documentTypeFilter;
      return matchesQuery && matchesType;
    });
  }, [documentSearchTerm, documentTypeFilter, documents]);
  const chunkPreview = rag.chunkPreview.preview as DemoChunkPreview | null;
  const evaluation = rag.evaluate.lastResponse as RAGEvaluationResponse | null;
  const workflow = rag.workflow;
  const workflowState = workflow.state;
  const streamLatestMessage = workflow.latestAssistantMessage;
  const streamRetrieval = workflow.retrieval;
  const streamGroundedAnswer = workflow.groundedAnswer;
  const streamGroundingReferences = workflow.groundingReferences;
  const streamBusy = workflow.isRetrieving || workflow.isAnswerStreaming;
  const sortedSyncSources = useMemo(() => sortSyncSources(rag.ops.syncSources), [rag.ops.syncSources]);
  const totalDocumentPages = Math.max(1, Math.ceil(filteredDocuments.length / DOCUMENTS_PER_PAGE));
  const paginatedDocuments = useMemo(() => {
    const start = (documentPage - 1) * DOCUMENTS_PER_PAGE;
    return filteredDocuments.slice(start, start + DOCUMENTS_PER_PAGE);
  }, [documentPage, filteredDocuments]);


  const status = useMemo(
    () =>
      buildStatusView(
        rag.status.status,
        rag.status.capabilities,
        documents,
        selectedMode,
      ),
    [documents, rag.status.capabilities, rag.status.status, selectedMode],
  );

  const refreshData = async () => {
    setLoading(true);
    try {
  
      const [documentsData, _statusData, _opsData, aiModelsResponse, qualityResponse] = await Promise.all([
        rag.documents.load(),
        rag.status.refresh(),
        rag.ops.refresh(),
        fetch("/demo/ai-models").then((response) => response.json()) as Promise<DemoAIModelCatalogResponse>,
        fetch(`/demo/quality/${selectedMode}`).then((response) => response.json()) as Promise<DemoRetrievalQualityResponse>,
      ]);
      setAiModelCatalog(aiModelsResponse);
      setQualityData(qualityResponse);
      rag.evaluate.saveSuite(evaluationSuite);
      setSelectedAIModelKey((current) => current || aiModelsResponse.defaultModelKey || aiModelsResponse.models[0]?.key || "");
      if (chunkPreview && !documentsData.documents.some((document) => document.id === chunkPreview.document.id)) {
        rag.chunkPreview.clear();
      }
      setMessage("");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `Unable to load demo data: ${error.message}`
          : "Unable to load demo data",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshData();
  }, []);

  useEffect(() => {
    void loadRecentQueries("react", selectedMode).then((entries) => {
      setRecentQueries(entries);
    });
    void loadActiveRetrievalState("react", selectedMode).then((state) => {
      if (state) {
        setSearchForm(state.searchForm);
        setScopeDriver(state.scopeDriver);
        setRetrievalPresetId(state.retrievalPresetId ?? "");
        setBenchmarkPresetId(state.benchmarkPresetId ?? "");
        setUploadPresetId(state.uploadPresetId ?? "");
        setSelectedAIModelKey(state.streamModelKey ?? "");
        setStreamPrompt(state.streamPrompt ?? "How do metadata filters change retrieval quality?");
        setRestoredSharedState(true);
        const label =
          demoUploadPresets.find((preset) => preset.id === state.uploadPresetId)?.label ??
          demoEvaluationPresets.find((preset) => preset.id === state.benchmarkPresetId)?.label ??
          state.retrievalPresetId ??
          "manual state";
        setRestoredSharedStateSummary(
          `Restored from shared demo state · ${label} · ${new Date(state.lastUpdatedAt ?? Date.now()).toLocaleString()}.`,
        );
      } else {
        setRestoredSharedState(false);
        setRestoredSharedStateSummary("");
      }
    });
  }, [selectedMode]);

  useEffect(() => {
    void saveRecentQueries("react", selectedMode, recentQueries);
  }, [recentQueries, selectedMode]);

  useEffect(() => {
    if (pendingScrollTarget !== "search-results" || searchResults === null) {
      return;
    }

    const timeout = window.setTimeout(() => {
      document.getElementById("search-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
      setPendingScrollTarget(null);
    }, 60);

    return () => window.clearTimeout(timeout);
  }, [pendingScrollTarget, searchResults]);

  useEffect(() => {
    setDocumentPage((current) => Math.min(Math.max(1, current), Math.max(1, Math.ceil(filteredDocuments.length / DOCUMENTS_PER_PAGE))));
  }, [filteredDocuments.length]);

  useEffect(() => {
    const state: DemoActiveRetrievalState = { searchForm, scopeDriver };
    state.lastUpdatedAt = Date.now();
    state.retrievalPresetId = retrievalPresetId || undefined;
    state.benchmarkPresetId = benchmarkPresetId || undefined;
    state.uploadPresetId = uploadPresetId || undefined;
    state.streamModelKey = selectedAIModelKey || undefined;
    state.streamPrompt = streamPrompt;
    void saveActiveRetrievalState("react", selectedMode, state);
  }, [benchmarkPresetId, retrievalPresetId, scopeDriver, searchForm, selectedAIModelKey, selectedMode, streamPrompt, uploadPresetId]);

  const onSearchFieldChange = (evt: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setScopeDriver("manual filters");
    const { name, value } = evt.target;
    if (name === "topK") {
      setSearchForm((prev) => ({ ...prev, topK: Number(value) || prev.topK }));
      return;
    }

    if (name === "kind") {
      setSearchForm((prev) => ({
        ...prev,
        kind: value === "seed" || value === "custom" ? value : "",
      }));
      return;
    }

    setSearchForm((prev) => ({ ...prev, [name]: value }));
  };

  const onAddFieldChange = (evt: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = evt.target;
    setAddForm((prev) => ({ ...prev, [name]: value }));
  };

  const executeSearch = async (searchValues: SearchFormState) => {
    setSearchError("");
    setSearchResults(null);
    const query = searchValues.query.trim();
    if (query.length === 0) {
      setSearchError("query is required");
      return;
    }

    try {
      const payload = buildSearchPayload({
        ...searchValues,
        query,
      });
      const start = performance.now();
      const results = await rag.search.search(payload as never);
      setRecentQueries((prev) => {
        const next = [
          { label: query, state: { ...searchValues, query } },
          ...prev.filter(
            (entry) =>
              JSON.stringify(entry.state) !== JSON.stringify({ ...searchValues, query }),
          ),
        ];
        return next.slice(0, 4);
      });
      setSearchResults(
        buildSearchResponse(query, payload, results, Math.round(performance.now() - start)),
      );
    } catch (error) {
      setSearchError(
        error instanceof Error ? `Search failed: ${error.message}` : "Search failed",
      );
    }
  };

  const submitSearch = async (evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
    setScopeDriver("manual filters");
    setPendingScrollTarget("search-results");
    await executeSearch(searchForm);
  };

  const clearRetrievalScope = () => {
    const nextSearch = { ...searchForm, kind: "", source: "", documentId: "" } as SearchFormState;
    setSearchForm(nextSearch);
    setScopeDriver("chip reset");
    if (nextSearch.query.trim().length > 0) {
      void executeSearch(nextSearch);
    }
  };

  const clearAllRetrievalState = () => {
    const nextSearch = { ...searchForm, query: "", kind: "", source: "", documentId: "", scoreThreshold: "" } as SearchFormState;
    setSearchForm(nextSearch);
    setSearchResults(null);
    setSearchError("");
    setScopeDriver("clear all state");
  };

  const rerunLastQuery = () => {
    if (searchForm.query.trim().length === 0) return;
    setScopeDriver("rerun last query");
    setPendingScrollTarget("search-results");
    void executeSearch(searchForm);
  };

  const rerunRecentQuery = (state: SearchFormState) => {
    setSearchForm(state);
    setScopeDriver("recent query");
    setPendingScrollTarget("search-results");
    void executeSearch(state);
  };

  const submitStreamQuery = (evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
    const prompt = streamPrompt.trim();
    if (prompt.length === 0) {
      setMessage("Enter a retrieval question before starting the stream.");
      return;
    }
    if (selectedAIModelKey.length === 0) {
      setMessage("Configure an AI provider to enable retrieval streaming.");
      return;
    }

    setMessage("");
    workflow.query(buildDemoAIStreamPrompt(selectedAIModelKey, prompt));
  };

  const runSavedSuite = async () => {
    setEvaluationMessage("");
    try {
      const run = await rag.evaluate.runSuite(evaluationSuite);
      setEvaluationMessage(`Saved suite run finished in ${run.elapsedMs}ms and ranked ${rag.evaluate.leaderboard.length} workflow run(s).`);
    } catch (error) {
      setEvaluationMessage(
        error instanceof Error ? `Saved suite failed: ${error.message}` : "Saved suite failed",
      );
    }
  };

  const runEvaluation = async () => {
    setEvaluationMessage("");
    try {
      const response = await rag.evaluate.evaluate(buildDemoEvaluationInput());
      setEvaluationMessage(
        `Benchmark suite finished in ${response.elapsedMs}ms across ${response.totalCases} benchmark queries.`,
      );
    } catch (error) {
      setEvaluationMessage(
        error instanceof Error ? `Evaluation failed: ${error.message}` : "Evaluation failed",
      );
    }
  };

  const runPresetSearch = (query: string, options: Partial<SearchFormState> = {}, driver = "preset", presetId = "", scrollTarget: "search-results" | null = "search-results") => {
    const nextSearch = {
      ...searchForm,
      ...options,
      query,
      kind:
        options.kind === "seed" || options.kind === "custom"
          ? options.kind
          : "",
      source: options.source ?? "",
      documentId: options.documentId ?? "",
      scoreThreshold: options.scoreThreshold ?? "",
      topK: options.topK ?? 6,
    } as SearchFormState;

    setSearchForm(nextSearch);
    setScopeDriver(driver);
    if (scrollTarget) {
      setPendingScrollTarget(scrollTarget);
    }
    if (driver.startsWith("benchmark preset:")) {
      setBenchmarkPresetId(presetId);
      setRetrievalPresetId("");
      setUploadPresetId("");
    } else if (driver === "upload verification") {
      setRetrievalPresetId("");
      setBenchmarkPresetId("");
    } else {
      setRetrievalPresetId(presetId);
      setBenchmarkPresetId("");
      setUploadPresetId("");
    }
    void executeSearch(nextSearch);
  };

  const uploadSelectedFile = async () => {
    if (!selectedUploadFile) {
      setUploadError("Choose a file before uploading.");
      return;
    }

    setUploadError("");
    setMessage(`Uploading ${selectedUploadFile.name}...`);
    try {
      const result = await rag.ingest.ingestUploads({
        baseMetadata: {
          fileKind: "uploaded-user-file",
          kind: "custom",
        },
        uploads: [
          {
            name: selectedUploadFile.name,
            source: `uploads/${selectedUploadFile.name}`,
            title: selectedUploadFile.name,
            contentType: selectedUploadFile.type || "application/octet-stream",
            encoding: "base64",
            content: encodeArrayBufferToBase64(await selectedUploadFile.arrayBuffer()),
            metadata: {
              kind: "custom",
              uploadedFrom: "react-general-upload",
            },
          },
        ],
      });
      setMessage(`Uploaded ${selectedUploadFile.name}. Extracted ${result.count ?? 0} chunk(s) across ${result.documentCount ?? 1} document(s).`);
      setSelectedUploadFile(null);
      await refreshData();
      runPresetSearch(`Explain ${selectedUploadFile.name}`, { source: `uploads/${selectedUploadFile.name}`, topK: 6 }, "upload verification", "", "search-results");
    } catch (error) {
      setUploadError(error instanceof Error ? `Upload failed: ${error.message}` : "Upload failed");
      setMessage("");
    }
  };

  const ingestDemoUpload = async (preset: (typeof demoUploadPresets)[number]) => {
    setUploadError("");
    setMessage(`Uploading ${preset.label}...`);
    try {
      const response = await fetch(getDemoUploadFixtureUrl(preset.id));
      if (!response.ok) {
        throw new Error(`Failed to load ${preset.fileName}: ${response.status}`);
      }

      const result = await rag.ingest.ingestUploads(
        buildDemoUploadIngestInput(preset, encodeArrayBufferToBase64(await response.arrayBuffer())),
      );
      setMessage(`Uploaded ${preset.label}. Extracted ${result.count ?? 0} chunk(s) across ${result.documentCount ?? 1} document(s).`);
      setUploadPresetId(preset.id);
      runPresetSearch(preset.query, { source: preset.expectedSources[0] ?? preset.source, topK: 6 }, "upload verification");
    } catch (error) {
      setUploadError(
        error instanceof Error ? `Upload failed: ${error.message}` : "Upload failed",
      );
      setMessage("");
    }
  };

  const submitAddDocument = async (evt: FormEvent<HTMLFormElement>) => {    evt.preventDefault();
    setAddError("");
    setSearchError("");
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

      setMessage(`Inserted ${response.inserted ?? addForm.title.trim()}`);
      setAddForm(initialAddForm);
      await refreshData();
    } catch (error) {
      setAddError(
        error instanceof Error
          ? `Failed to insert: ${error.message}`
          : "Failed to insert document",
      );
    }
  };

  const inspectChunks = async (id: string) => {
    try {
      await rag.chunkPreview.inspect(id);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `Failed to inspect ${id}: ${error.message}`
          : `Failed to inspect ${id}`,
      );
    }
  };

  const deleteDocument = async (id: string) => {
    setMessage("");
    try {
      await rag.index.deleteDocument(id);
      setMessage(`Deleted ${id}`);
      if (chunkPreview?.document.id === id) {
        rag.chunkPreview.clear();
      }
      await refreshData();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `Failed to delete ${id}: ${error.message}`
          : "Failed to delete document",
      );
    }
  };

  const reseed = async () => {
    setMessage("Reseeding...");
    try {
      const result = await rag.index.reseed();
      setMessage(`Reseeded seed corpus. Documents=${result.documents ?? 0}`);
      await refreshData();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `Reseed failed: ${error.message}`
          : "Reseed failed",
      );
    }
  };

  const resetCustom = async () => {
    setMessage("Resetting custom documents...");
    try {
      const result = await rag.index.reset();
      setMessage(`Reset complete. Documents=${result.documents ?? 0}`);
      setSearchResults(null);
      await refreshData();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `Reset failed: ${error.message}`
          : "Reset failed",
      );
    }
  };

  const syncAllSources = async () => {
    setMessage("Syncing all sources...");
    try {
      const result = await rag.index.syncAllSources();
      const sourceCount = "sources" in result ? result.sources.length : 0;
      setMessage(`Synced ${sourceCount} source(s).`);
      await refreshData();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `Source sync failed: ${error.message}`
          : "Source sync failed",
      );
    }
  };

  const queueBackgroundSync = async () => {
    setMessage("Queueing background sync...");
    try {
      await rag.index.syncAllSources({ background: true });
      setMessage("Background sync queued.");
      await refreshData();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `Failed to queue background sync: ${error.message}`
          : "Failed to queue background sync",
      );
    }
  };

  const syncSource = async (id: string) => {
    setMessage(`Syncing ${id}...`);
    try {
      const result = await rag.index.syncSource(id);
      const sourceLabel = "source" in result ? result.source.label : id;
      setMessage(`Synced ${sourceLabel}.`);
      await refreshData();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `Failed to sync ${id}: ${error.message}`
          : `Failed to sync ${id}`,
      );
    }
  };

  const queueBackgroundSourceSync = async (id: string) => {
    setMessage(`Queueing ${id} in the background...`);
    try {
      const result = await rag.index.syncSource(id, { background: true });
      const sourceLabel = "source" in result ? result.source.label : id;
      setMessage(`Queued ${sourceLabel}.`);
      await refreshData();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `Failed to queue ${id}: ${error.message}`
          : `Failed to queue ${id}`,
      );
    }
  };

  return (
    <html lang="en">
      <Head
        cssPath={cssPath}
        description="AbsoluteJS RAG demo using framework-native RAG primitives."
        title="AbsoluteJS RAG Workflow Demo - React"
      />
      <body className="rag-demo-page">
        <header>
          <div className="header-left">
            <a className="logo" href="/">
              <img alt="AbsoluteJS" height={24} src="/assets/png/absolutejs-temp.png" />
              AbsoluteJS
            </a>
          </div>
          <nav>
            {backendOptions.map((backend) => (
              <div className="demo-nav-row" key={backend.id}>
                <span className={backend.id === selectedMode ? "demo-nav-row-label active" : "demo-nav-row-label"}>
                  {backend.label}
                </span>
                {demoFrameworks.map((framework) => (
                  <a
                    className={[framework.id === "react" && backend.id === selectedMode ? "active" : "", backend.available ? "" : "disabled"].filter(Boolean).join(" ")}
                    href={backend.available ? getDemoPagePath(framework.id, backend.id) : undefined}
                    aria-disabled={!backend.available}
                    title={backend.available ? undefined : backend.reason}
                    key={`${backend.id}-${framework.id}`}
                  >
                    {framework.label}
                  </a>
                ))}
              </div>
            ))}
          </nav>
        </header>

        <main className="demo-layout">
          <section className="demo-card">
            <span className="demo-hero-kicker">React workflow surface</span>
            <h1>AbsoluteJS RAG Workflow Demo - React</h1>
            <p>
              Use one route to ingest, sync, retrieve, stream grounded answers, and inspect
              ops health against the same stuffed multi-format knowledge base.
            </p>
            <div className="demo-hero-grid">
              <article className="demo-stat-card">
                <span className="demo-stat-label">Corpus</span>
                <strong>Stuffed multi-format index</strong>
                <p>PDF, Office, archive, image, audio, video, EPUB, email, markdown, and legacy files on one page.</p>
              </article>
              <article className="demo-stat-card">
                <span className="demo-stat-label">Retrieval</span>
                <strong>Search with source proof</strong>
                <p>Row actions jump straight into scoped retrieval and inline chunk inspection instead of making you type filters by hand.</p>
              </article>
              <article className="demo-stat-card">
                <span className="demo-stat-label">Workflow</span>
                <strong>Grounded answers and citations</strong>
                <p>Drive the first-class workflow primitive, then inspect coverage, references, and resolved citations without leaving the route.</p>
              </article>
              <article className="demo-stat-card">
                <span className="demo-stat-label">Ops</span>
                <strong>Ingest, sync, benchmark</strong>
                <p>Exercise directory, URL, storage, and email sync adapters alongside ingest mutations, benchmarks, and admin status.</p>
              </article>
            </div>
            <div className="demo-pill-row">
              <span className="demo-pill">1. Retrieve and verify</span>
              <span className="demo-pill">2. Inspect chunks inline</span>
              <span className="demo-pill">3. Sync a source</span>
              <span className="demo-pill">4. Run quality benchmarks</span>
            </div>
          </section>

          <div className="demo-results">
            <h3>Sync Feedback</h3>
            <p className="demo-metadata">Run a sync, ingest, reset, or delete action to see the latest mutation summary here.</p>
            <p className="demo-metadata">This panel stays on the same route as diagnostics and retrieval so ops feedback is always visible.</p>
            {message && <p className="demo-banner">{message}</p>}
            {loading && <p className="demo-banner">Loading status and documents...</p>}
            {restoredSharedState && <p className="demo-banner">{restoredSharedStateSummary}</p>}
          </div>

          {status && (
            <section className="demo-grid">
              <article className="demo-card">
                <h2>Diagnostics</h2>
                <dl className="demo-stat-grid">
                  <div><dt>Selected mode</dt><dd>{selectedMode}</dd></div>
                  <div><dt>Backend</dt><dd>{status.backend}</dd></div>
                  <div><dt>Vector mode</dt><dd>{status.vectorMode}</dd></div>
                  <div><dt>Embedding dimensions</dt><dd>{status.dimensions ?? "n/a"}</dd></div>
                  <div><dt>Documents</dt><dd>{status.documents.total}</dd></div>
                  <div><dt>Total chunks</dt><dd>{status.chunkCount}</dd></div>
                  <div><dt>Seed docs</dt><dd>{status.documents.byKind.seed}</dd></div>
                  <div><dt>Custom docs</dt><dd>{status.documents.byKind.custom}</dd></div>
                  <div><dt>Vector acceleration</dt><dd>{status.native.active ? "active" : "inactive"}</dd></div>
                  <div><dt>Native source</dt><dd>{status.native.sourceLabel ?? "Not applicable"}</dd></div>
                  <div><dt>Reranker</dt><dd>{status.reranker.label}</dd></div>
                </dl>
                {status.native.fallbackReason && (
                  <p className="demo-metadata">{status.native.fallbackReason}</p>
                )}
                <p className="demo-metadata">{status.reranker.summary}</p>
                <p className="demo-metadata">
                  Backend capabilities: <strong>{status.capabilities.join(" · ")}</strong>
                </p>
                <div className="demo-results">
                  <h3>Knowledge Base Operations</h3>
                  {rag.ops.error && <p className="demo-error">{rag.ops.error}</p>}
                  <div className="demo-stat-grid">
                    <article className="demo-stat-card">
                      <span className="demo-stat-label">Provider</span>
                      <strong>{rag.ops.readiness?.providerConfigured ? (rag.ops.readiness?.providerName ?? "Runtime provider routing") : "Not configured"}</strong>
                      <p>{rag.ops.readiness?.providerConfigured ? (rag.ops.readiness?.model ? `Requests route through ${rag.ops.readiness?.providerName ?? "the runtime provider registry"} with default model ${rag.ops.readiness.model}.` : `Requests route through ${rag.ops.readiness?.providerName ?? "the runtime provider registry"}.`) : "Provider-backed retrieval is not configured yet."}</p>
                    </article>
                    <article className="demo-stat-card">
                      <span className="demo-stat-label">Embeddings</span>
                      <strong>{rag.ops.readiness?.embeddingConfigured ? (rag.ops.readiness?.embeddingModel === "collection-managed embeddings" ? "Collection-managed" : "Configured") : "Missing"}</strong>
                      <p>{rag.ops.readiness?.embeddingConfigured ? (rag.ops.readiness?.embeddingModel === "collection-managed embeddings" ? "Embeddings come from the collection and vector store layer, so retrieval stays vector-backed without a separate top-level embedding provider." : (rag.ops.readiness?.embeddingModel ?? "Embedding model configured.")) : "Embeddings are not configured yet."}</p>
                    </article>
                    <article className="demo-stat-card">
                      <span className="demo-stat-label">Retrieval Stack</span>
                      <strong>{rag.ops.readiness?.rerankerConfigured ? "Reranker ready" : "Vector only"}</strong>
                      <p>{rag.ops.readiness?.indexManagerConfigured ? "Index manager configured." : "Index manager not configured."}</p>
                    </article>
                    <article className="demo-stat-card">
                      <span className="demo-stat-label">Extractors</span>
                      <strong>{rag.ops.readiness?.extractorsConfigured ? `${rag.ops.readiness.extractorNames.length} configured` : "None configured"}</strong>
                      <div className="demo-pill-row">
                        {(rag.ops.readiness?.extractorNames.length ? rag.ops.readiness.extractorNames : ["No extractors configured"]).map((name) => (
                          <span className="demo-pill" key={name}>{name}</span>
                        ))}
                      </div>
                    </article>
                  </div>
                  <div className="demo-ops-metric-grid">
                    <article className="demo-result-item demo-score-card">
                      <h4>Corpus coverage</h4>
                      <p className="demo-score-headline">{rag.ops.health ? `Formats: ${Object.entries(rag.ops.health.coverageByFormat).map(([key, value]) => `${key} ${value}`).join(' · ')}` : 'Waiting for corpus health...'}</p>
                      <p className="demo-metadata">{rag.ops.health ? `Kinds: ${Object.entries(rag.ops.health.coverageByKind).map(([key, value]) => `${key} ${value}`).join(' · ')}` : ''}</p>
                    </article>
                    <article className="demo-result-item demo-score-card">
                      <h4>Chunk quality</h4>
                      <p className="demo-score-headline">{rag.ops.health ? `${rag.ops.health.averageChunksPerDocument.toFixed(2)} avg chunks/doc` : 'Waiting for corpus health...'}</p>
                      <p className="demo-metadata">{rag.ops.health ? `Empty docs ${rag.ops.health.emptyDocuments} · empty chunks ${rag.ops.health.emptyChunks} · low signal ${rag.ops.health.lowSignalChunks}` : ''}</p>
                    </article>
                    <article className="demo-result-item demo-score-card">
                      <h4>Freshness</h4>
                      <p className="demo-score-headline">{rag.ops.health ? `${rag.ops.health.staleDocuments.length} stale docs` : 'Waiting for corpus health...'}</p>
                      <p className="demo-metadata">{rag.ops.health ? `Oldest ${formatHealthSummary(rag.ops.health)[7]?.replace('Document age window: oldest ', '') ?? ''}` : ''}</p>
                    </article>
                    <article className="demo-result-item demo-score-card">
                      <h4>Failures</h4>
                      <p className="demo-score-headline">{rag.ops.health ? `${rag.ops.health.failedIngestJobs} ingest · ${rag.ops.health.failedAdminJobs} admin` : 'Waiting for corpus health...'}</p>
                      <p className="demo-metadata">{rag.ops.health ? `Duplicate sources ${rag.ops.health.duplicateSourceGroups.length} · duplicate ids ${rag.ops.health.duplicateDocumentIdGroups.length}` : ''}</p>
                    </article>
                  </div>
                  <div className="demo-result-grid">
                    <article className="demo-result-item">
                      <h4>Sync Sources</h4>
                      <p className="demo-metadata">The default view now shows source health and actions first. Full protocol and run history stay inside each source card instead of flooding the page.</p>
                      <div className="demo-actions">
                        <button onClick={syncAllSources} type="button">Sync all sources</button>
                        <button onClick={queueBackgroundSync} type="button">Queue background sync</button>
                      </div>
                      <div className="demo-stat-grid">
                        {formatSyncSourceOverview(sortedSyncSources).map((line) => (
                          <article className="demo-stat-card" key={`sync-overview-${line}`}>
                            <span className="demo-stat-label">Sync overview</span>
                            <strong>{line.includes(':') ? line.slice(0, line.indexOf(':')) : 'Sync overview'}</strong>
                            <p>{line.includes(':') ? line.slice(line.indexOf(':') + 1).trim() : line}</p>
                          </article>
                        ))}
                      </div>
                      <div className="demo-badge-row">
                        {formatSyncDeltaChips(sortedSyncSources).map((chip) => (
                          <span className="demo-state-chip" key={chip}>{chip.replace(/^sync /, "")}</span>
                        ))}
                      </div>
                      <div className="demo-sync-source-grid">
                        {sortedSyncSources.length > 0 ? sortedSyncSources.map((source) => (
                          <details className={source.status === "failed" ? "demo-sync-source-card demo-sync-source-card-failed" : "demo-sync-source-card"} key={source.id} open={source.status === "failed"}>
                            <summary>
                              <div className="demo-sync-source-header">
                                <div>
                                  <h5>{source.label}</h5>
                                  <p className="demo-metadata">{source.target ?? source.description ?? 'No target configured.'}</p>
                                </div>
                                <div className="demo-badge-row">
                                  <span className="demo-badge">{source.kind}</span>
                                  <span className="demo-badge">{source.status.toUpperCase()}</span>
                                  {typeof source.documentCount === 'number' && <span className="demo-badge">{source.documentCount} docs</span>}
                                  {typeof source.chunkCount === 'number' && <span className="demo-badge">{source.chunkCount} chunks</span>}
                                </div>
                              </div>
                            </summary>
                            <div className="demo-collapsible-content">
                              <div className="demo-actions">
                                <button onClick={() => void syncSource(source.id)} type="button">Sync now</button>
                                <button onClick={() => void queueBackgroundSourceSync(source.id)} type="button">Queue in background</button>
                              </div>
                              <p className="demo-metadata demo-sync-action-meta">{formatSyncSourceActionSummary(source)}</p>
                              {formatSyncSourceActionBadges(source).length > 0 && (
                                <div className="demo-badge-row">
                                  {formatSyncSourceActionBadges(source).map((badge) => (
                                    <span className="demo-badge" key={`${source.id}-${badge}`}>{badge}</span>
                                  ))}
                                </div>
                              )}
                              <div className="demo-key-value-grid">
                                {source.description && (<div className="demo-key-value-row"><span>Purpose</span><strong>{source.description}</strong></div>)}
                                {source.target && (<div className="demo-key-value-row"><span>Target</span><strong>{source.target}</strong></div>)}
                                {typeof source.metadata?.provider === 'string' && (<div className="demo-key-value-row"><span>Provider</span><strong>{source.metadata.provider}</strong></div>)}
                                {typeof source.metadata?.accountMode === 'string' && (<div className="demo-key-value-row"><span>Account mode</span><strong>{source.metadata.accountMode}</strong></div>)}
                                {typeof source.metadata?.schedule === 'string' && (<div className="demo-key-value-row"><span>Schedule</span><strong>{source.metadata.schedule}</strong></div>)}
                                {typeof source.lastSuccessfulSyncAt === 'number' && (<div className="demo-key-value-row"><span>Last success</span><strong>{formatSyncSourceDetails(source).find((line) => line.startsWith('last successful sync:'))?.replace('last successful sync: ', '') ?? ''}</strong></div>)}
                                {source.lastError && (<div className="demo-key-value-row"><span>Last error</span><strong>{source.lastError}</strong></div>)}
                              </div>
                              {Array.isArray(source.metadata?.recentRuns) && (source.metadata.recentRuns as Array<Record<string, unknown>>).length > 0 && (
                                <div>
                                  <p className="demo-section-caption">Recent runs</p>
                                  <div className="demo-pill-row">
                                    {formatSyncSourceDetails(source).filter((line) => line.startsWith('recent run')).map((line) => (
                                      <span className="demo-pill" key={`${source.id}-${line}`}>{line}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </details>
                        )) : <p className="demo-metadata">No sync sources configured yet.</p>}
                      </div>
                    </article>
                    <article className="demo-result-item">
                      <h4>Admin Timeline</h4>
                      <div className="demo-insight-stack">
                        <div className="demo-insight-card">
                          <span className="demo-stat-label">Recent jobs</span>
                          <div className="demo-pill-row">
                            {(formatAdminJobList(rag.ops.adminJobs).length > 0 ? formatAdminJobList(rag.ops.adminJobs) : ["No admin jobs recorded yet."]).map((line) => (
                              <span className="demo-pill" key={line}>{line}</span>
                            ))}
                          </div>
                        </div>
                        <div className="demo-insight-card">
                          <span className="demo-stat-label">Recent actions</span>
                          <div className="demo-pill-row">
                            {(formatAdminActionList(rag.ops.adminActions).length > 0 ? formatAdminActionList(rag.ops.adminActions) : ["No admin actions recorded yet."]).map((line) => (
                              <span className="demo-pill" key={line}>{line}</span>
                            ))}
                          </div>
                        </div>
                        <div className="demo-insight-card">
                          <span className="demo-stat-label">Failure breakdown</span>
                          {formatFailureSummary(rag.ops.health).map((line) => (
                            <p className="demo-metadata" key={line}>{line}</p>
                          ))}
                        </div>
                      </div>
                    </article>
                  </div>
                </div>
                <div className="demo-actions">
                  <button onClick={reseed} type="button">Re-seed defaults</button>
                  <button onClick={resetCustom} type="button">Reset custom docs</button>
                  <button onClick={refreshData} type="button">Refresh</button>
                </div>
              </article>

              <article className="demo-card">
                <h2>Retrieve And Verify</h2>
                <p className="demo-metadata">
                  This section is powered by <code>useRAG</code>. Run a query, then
                  confirm the returned chunk text and source label match the indexed
                  source list below.
                </p>
                <div className="demo-preset-grid">
                  <button type="button" onClick={() => runPresetSearch("How do metadata filters change retrieval quality?", { kind: "seed" }, "preset: filter behavior", "filter-behavior")}>Filter behavior</button>
                  <button type="button" onClick={() => runPresetSearch("What should I verify after ingesting a new source?", {}, "preset: verify ingestion", "verify-ingestion")}>Verify ingestion</button>
                  <button type="button" onClick={() => runPresetSearch("List support policies for shipping and returns.", { source: "guide/demo.md" }, "preset: source filter", "source-filter")}>Source filter</button>
                  <button type="button" onClick={() => runPresetSearch("Why should metadata be stable?", { source: "guides/metadata.md" }, "preset: metadata discipline", "metadata-discipline")}>Metadata discipline</button>
                </div>
                <form className="demo-search-form" onSubmit={submitSearch}>
                  <label htmlFor="query">Query</label>
                  <input id="query" name="query" onChange={onSearchFieldChange} placeholder="e.g. How do metadata filters work?" required type="text" value={searchForm.query} />
                  <label htmlFor="topK">Top K</label>
                  <input id="topK" max={20} min={1} name="topK" onChange={onSearchFieldChange} type="number" value={searchForm.topK} />
                  <label htmlFor="scoreThreshold">Minimum score (0-1)</label>
                  <input id="scoreThreshold" name="scoreThreshold" onChange={onSearchFieldChange} placeholder="optional" type="number" step="0.01" min={0} max={1} value={searchForm.scoreThreshold} />
                  <label htmlFor="kind">Kind filter</label>
                  <select id="kind" name="kind" onChange={onSearchFieldChange} value={searchForm.kind}>
                    <option value="">Any</option>
                    <option value="seed">Seed</option>
                    <option value="custom">Custom</option>
                  </select>
                  <label htmlFor="source">Source filter</label>
                  <input className={searchForm.source.trim().length > 0 ? "demo-filter-active" : undefined} id="source" name="source" onChange={onSearchFieldChange} placeholder="e.g. guide/demo.md" type="text" value={searchForm.source} />
                  <label htmlFor="documentId">Document ID filter</label>
                  <input className={searchForm.documentId.trim().length > 0 ? "demo-filter-active" : undefined} id="documentId" name="documentId" onChange={onSearchFieldChange} placeholder="e.g. rag-demo" type="text" value={searchForm.documentId} />
                  <button type="submit">Search index</button>
                </form>
                <div className="demo-results">
                  <h3>Active Retrieval Scope</h3>
                  <div className="demo-badge-row">
                    <span className="demo-state-chip">{formatRetrievalScopeSummary(searchForm)}</span>
                    <span className="demo-state-chip">Changed by: {scopeDriver.replace(/^row action: /, "row action · ")}</span>
                    <span className="demo-state-chip">Results: {searchResults?.count ?? 0}</span>
                  </div>
                  <p className="demo-metadata">{formatRetrievalScopeHint(searchForm)}</p>
                  <div className="demo-actions">
                    <button disabled={searchForm.query.trim().length === 0 && searchForm.source.trim().length === 0 && searchForm.documentId.trim().length === 0 && searchForm.kind.length === 0} onClick={clearRetrievalScope} type="button">Clear scope</button>
                    <button disabled={searchForm.query.trim().length === 0} onClick={rerunLastQuery} type="button">Rerun query</button>
                    <button onClick={clearAllRetrievalState} type="button">Clear search</button>
                  </div>
                  {recentQueries.length > 0 && (
                    <>
                      <p className="demo-section-caption">Recent Searches</p>
                      <div className="demo-badge-row">
                        {recentQueries.map((entry) => (
                          <button className="demo-state-chip" key={`${entry.label}-${entry.state.source}-${entry.state.documentId}-${entry.state.kind}`} onClick={() => rerunRecentQuery(entry.state)} type="button">
                            {entry.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                {searchError && <p className="demo-error">{searchError}</p>}
                {searchResults && (
                  <div className="demo-search-results" id="search-results">
                    <p className="demo-metadata">{searchResults.count} results for “{searchResults.query}” in {searchResults.elapsedMs}ms</p>
                    <p className="demo-metadata">{formatRetrievalScopeSummary(searchForm)}</p>
                    <p className="demo-metadata">Scope changed by: {scopeDriver}</p>
                    <p className="demo-metadata">Reranking is active: AbsoluteJS reorders the first vector hits with the built-in heuristic provider before these results render.</p>
                    <p className="demo-metadata">Verification rule: a good result shows chunk text that answers the query and a source label you can trace back to the indexed source list.</p>
                    <div className="demo-result-grid">
                      {searchResults.chunks.map((chunk) => (
                        <article className="demo-result-item" key={chunk.chunkId}>
                          <h3>{chunk.title}</h3>
                          <p className="demo-result-score">score: {formatScore(chunk.score)}</p>
                          <p className="demo-result-source">source: {chunk.source}</p>
                          {formatDemoMetadataSummary(chunk.metadata).map((line) => (
                            <p className="demo-metadata" key={line}>{line}</p>
                          ))}
                          <p className="demo-result-text">{chunk.text}</p>
                        </article>
                      ))}
                    </div>
                  </div>
                )}

                <div className="demo-results">
                  <h3>Benchmark Retrieval</h3>
                  <p className="demo-metadata">
                    This section uses <code>useRAG().evaluate</code> to run a built-in benchmark suite. Each case names the source we expect retrieval to surface so you can compare expected, retrieved, and missing evidence directly.
                  </p>
                  <div className="demo-preset-grid">
                    {demoEvaluationPresets.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        title={preset.description}
                        onClick={() => runPresetSearch(preset.query, { source: preset.expectedSources[0] ?? "" }, `benchmark preset: ${preset.label}`, preset.id)}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <div className="demo-actions">
                    <button disabled={rag.evaluate.isEvaluating} onClick={runEvaluation} type="button">
                      {rag.evaluate.isEvaluating ? "Running benchmark suite..." : "Run benchmark suite"}
                    </button>
                  </div>
                  {evaluationMessage && <p className="demo-metadata">{evaluationMessage}</p>}
                  {rag.evaluate.error && <p className="demo-error">{rag.evaluate.error}</p>}
                  {evaluation && (
                    <>
                      <p className="demo-metadata">Benchmark summary: {formatEvaluationSummary(evaluation)}</p>
                      <div className="demo-result-grid">
                        {evaluation.cases.map((entry) => (
                          <article className={`demo-result-item demo-evaluation-card demo-evaluation-${entry.status}`} key={entry.caseId}>
                            <h4>{entry.label ?? entry.caseId}</h4>
                            <p className="demo-result-source">{entry.query}</p>
                            <p className="demo-evaluation-status">{entry.status.toUpperCase()}</p>
                            <p className="demo-metadata">{formatEvaluationCaseSummary(entry)}</p>
                            <p className="demo-metadata">expected: {formatEvaluationExpected(entry)}</p>
                            <p className="demo-metadata">retrieved: {formatEvaluationRetrieved(entry)}</p>
                            <p className="demo-result-text">missing: {formatEvaluationMissing(entry)}</p>
                          </article>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <div className="demo-results">
                  <h3>Retrieval Quality Tooling</h3>
                  <p className="demo-metadata">This section now behaves like an evaluation dashboard instead of a log dump. The summary cards answer who is winning, the strategy tab shows why, the grounding tab keeps case drill-downs collapsed until needed, and the history tab only expands when you want regression detail.</p>
                  <div className="demo-pill-row">
                    {(rag.evaluate.suites.length > 0 ? rag.evaluate.suites : [evaluationSuite]).map((suite) => (
                      <span className="demo-pill" key={suite.id}>{suite.label ?? suite.id} · {suite.input.cases.length} cases</span>
                    ))}
                  </div>
                  <div className="demo-actions">
                    <button disabled={rag.evaluate.isEvaluating} onClick={runSavedSuite} type="button">
                      {rag.evaluate.isEvaluating ? "Running saved suite..." : "Run saved suite"}
                    </button>
                  </div>
                  <div className="demo-tab-row">
                    {(["overview", "strategies", "grounding", "history"] as const).map((view) => (
                      <button
                        key={view}
                        className={qualityView === view ? "demo-tab demo-tab-active" : "demo-tab"}
                        onClick={() => setQualityView(view)}
                        type="button"
                      >
                        {view[0].toUpperCase() + view.slice(1)}
                      </button>
                    ))}
                  </div>
                  <div className="demo-stat-grid">
                    <article className="demo-stat-card">
                      <span className="demo-stat-label">Saved suite leader</span>
                      <strong>{rag.evaluate.leaderboard[0]?.label ?? "Run the saved suite"}</strong>
                      <p>{rag.evaluate.leaderboard[0] ? formatEvaluationLeaderboardEntry(rag.evaluate.leaderboard[0]) : "The leaderboard will rank repeated workflow benchmark runs."}</p>
                    </article>
                    <article className="demo-stat-card">
                      <span className="demo-stat-label">Retrieval winner</span>
                      <strong>{qualityData?.retrievalComparison.entries[0]?.label ?? "Loading comparison"}</strong>
                      <p>{qualityData ? formatRetrievalComparisonSummary(qualityData.retrievalComparison)[0] : "Running retrieval comparison..."}</p>
                    </article>
                    <article className="demo-stat-card">
                      <span className="demo-stat-label">Reranker winner</span>
                      <strong>{qualityData?.rerankerComparison.entries[0]?.label ?? "Loading comparison"}</strong>
                      <p>{qualityData ? formatRerankerComparisonSummary(qualityData.rerankerComparison)[0] : "Running reranker comparison..."}</p>
                    </article>
                    <article className="demo-stat-card">
                      <span className="demo-stat-label">Grounding winner</span>
                      <strong>{qualityData?.providerGroundingComparison?.summary.bestByPassingRate ?? "Stored workflow evaluation"}</strong>
                      <p>{qualityData ? formatGroundingEvaluationSummary(qualityData.groundingEvaluation) : "Loading grounding comparison..."}</p>
                    </article>
                  </div>
                  {qualityData ? (<>
                    {qualityView === "overview" && (
                      <div className="demo-result-grid">
                        <article className="demo-result-item">
                          <h4>Winners at a glance</h4>
                          <div className="demo-key-value-grid">
                            {[
                              ...formatRetrievalComparisonSummary(qualityData.retrievalComparison),
                              ...formatRerankerComparisonSummary(qualityData.rerankerComparison),
                              formatGroundingEvaluationSummary(qualityData.groundingEvaluation),
                              ...(qualityData.providerGroundingComparison ? formatGroundingProviderSummary(qualityData.providerGroundingComparison) : ["Configure an AI provider to compare grounded answers."]),
                            ].map((line) => (
                              <div className="demo-key-value-row" key={line}>
                                <span>{line.split(":")[0]}</span>
                                <strong>{line.includes(":") ? line.slice(line.indexOf(":") + 1).trim() : line}</strong>
                              </div>
                            ))}
                          </div>
                        </article>
                        <article className="demo-result-item">
                          <h4>Why this matters</h4>
                          <div className="demo-insight-stack">
                            <p className="demo-insight-card">The example should answer three questions quickly: which strategy wins, whether grounding is stable, and whether the result regressed. Those are summary cards now, not buried in history text.</p>
                            <p className="demo-insight-card">Detailed case-by-case evidence is still present, but it stays behind collapsible sections so the page reads like a product surface instead of a console buffer.</p>
                          </div>
                        </article>
                      </div>
                    )}
                    {qualityView === "strategies" && (<>
                      <div className="demo-result-grid">
                        {qualityData.retrievalComparison.entries.map((entry) => (
                          <article className="demo-result-item demo-score-card" key={entry.retrievalId}>
                            <h4>{entry.label}</h4>
                            <p className="demo-score-headline">{formatRetrievalComparisonEntry(entry)}</p>
                          </article>
                        ))}
                      </div>
                      <div className="demo-result-grid">
                        {qualityData.rerankerComparison.entries.map((entry) => (
                          <article className="demo-result-item demo-score-card" key={entry.rerankerId}>
                            <h4>{entry.label}</h4>
                            <p className="demo-score-headline">{formatRerankerComparisonEntry(entry)}</p>
                          </article>
                        ))}
                      </div>
                    </>)}
                    {qualityView === "grounding" && (<>
                      <div className="demo-result-grid">
                        {qualityData.groundingEvaluation.cases.map((entry) => (
                          <details className="demo-result-item demo-collapsible" key={`grounding-${entry.caseId}`}>
                            <summary>
                              <span>{entry.label ?? entry.caseId}</span>
                              <strong>{formatGroundingEvaluationCase(entry)}</strong>
                            </summary>
                            <div className="demo-collapsible-content">
                              {formatGroundingEvaluationDetails(entry).map((line) => (
                                <p className="demo-metadata" key={`${entry.caseId}-${line}`}>{line}</p>
                              ))}
                            </div>
                          </details>
                        ))}
                      </div>
                      {qualityData.providerGroundingComparison && (
                        <div className="demo-result-grid">
                          {qualityData.providerGroundingComparison.entries.map((entry) => (
                            <article className="demo-result-item demo-score-card" key={`provider-grounding-${entry.providerKey}`}>
                              <h4>{entry.label}</h4>
                              <p className="demo-score-headline">{formatGroundingProviderEntry(entry)}</p>
                            </article>
                          ))}
                          <article className="demo-result-item">
                            <h4>Hardest cases</h4>
                            <div className="demo-pill-row">
                              {qualityData.providerGroundingComparison.difficultyLeaderboard.map((entry) => (
                                <span className="demo-pill" key={`provider-grounding-difficulty-${entry.caseId}`}>{formatGroundingCaseDifficultyEntry(entry)}</span>
                              ))}
                            </div>
                          </article>
                        </div>
                      )}
                      {qualityData.providerGroundingComparison && (
                        <div className="demo-result-grid">
                          {qualityData.providerGroundingComparison.caseComparisons.map((entry) => (
                            <details className="demo-result-item demo-collapsible" key={`provider-grounding-case-${entry.caseId}`}>
                              <summary>
                                <span>{entry.label}</span>
                                <strong>{formatGroundingProviderCaseSummary(entry)[0] ?? "Case comparison"}</strong>
                              </summary>
                              <div className="demo-collapsible-content">
                                {entry.entries.flatMap((candidate) => [formatGroundingProviderCaseEntry(candidate), ...formatGroundingProviderCaseDetails(candidate)]).map((line) => (
                                  <p className="demo-metadata" key={`${entry.caseId}-${line}`}>{line}</p>
                                ))}
                              </div>
                            </details>
                          ))}
                        </div>
                      )}
                    </>)}
                    {qualityView === "history" && (<>
                      <div className="demo-result-grid">
                        {qualityData.retrievalComparison.entries.map((entry) => (
                          <details className="demo-result-item demo-collapsible" key={`retrieval-history-${entry.retrievalId}`}>
                            <summary>
                              <span>{entry.label} history</span>
                              <strong>{formatEvaluationHistorySummary(qualityData.retrievalHistories[entry.retrievalId])[0] ?? "No runs yet"}</strong>
                            </summary>
                            <div className="demo-collapsible-content">
                              {[...formatEvaluationHistorySummary(qualityData.retrievalHistories[entry.retrievalId]).slice(1), ...formatEvaluationHistoryDiff(qualityData.retrievalHistories[entry.retrievalId])].map((line) => (
                                <p className="demo-metadata" key={`${entry.retrievalId}-${line}`}>{line}</p>
                              ))}
                            </div>
                          </details>
                        ))}
                      </div>
                      <div className="demo-result-grid">
                        {qualityData.rerankerComparison.entries.map((entry) => (
                          <details className="demo-result-item demo-collapsible" key={`reranker-history-${entry.rerankerId}`}>
                            <summary>
                              <span>{entry.label} history</span>
                              <strong>{formatEvaluationHistorySummary(qualityData.rerankerHistories[entry.rerankerId])[0] ?? "No runs yet"}</strong>
                            </summary>
                            <div className="demo-collapsible-content">
                              {[...formatEvaluationHistorySummary(qualityData.rerankerHistories[entry.rerankerId]).slice(1), ...formatEvaluationHistoryDiff(qualityData.rerankerHistories[entry.rerankerId])].map((line) => (
                                <p className="demo-metadata" key={`${entry.rerankerId}-${line}`}>{line}</p>
                              ))}
                            </div>
                          </details>
                        ))}
                      </div>
                      {qualityData.providerGroundingComparison && (
                        <div className="demo-result-grid">
                          {qualityData.providerGroundingComparison.entries.map((entry) => (
                            <details className="demo-result-item demo-collapsible" key={`provider-grounding-history-${entry.providerKey}`}>
                              <summary>
                                <span>{entry.label} history</span>
                                <strong>{formatGroundingHistorySummary(qualityData.providerGroundingHistories[entry.providerKey])[0] ?? "No runs yet"}</strong>
                              </summary>
                              <div className="demo-collapsible-content">
                                {[
                                  ...formatGroundingHistorySummary(qualityData.providerGroundingHistories[entry.providerKey]).slice(1),
                                  ...formatGroundingHistoryDiff(qualityData.providerGroundingHistories[entry.providerKey]),
                                  ...formatGroundingHistorySnapshots(qualityData.providerGroundingHistories[entry.providerKey]),
                                  ...formatGroundingHistoryArtifactTrail(qualityData.providerGroundingHistories[entry.providerKey]),
                                ].map((line) => (
                                  <p className="demo-metadata" key={`${entry.providerKey}-${line}`}>{line}</p>
                                ))}
                              </div>
                            </details>
                          ))}
                          <details className="demo-result-item demo-collapsible">
                            <summary>
                              <span>Grounding difficulty history</span>
                              <strong>{formatGroundingDifficultyHistorySummary(qualityData.providerGroundingDifficultyHistory)[0] ?? "No history yet"}</strong>
                            </summary>
                            <div className="demo-collapsible-content">
                              {[...formatGroundingDifficultyHistorySummary(qualityData.providerGroundingDifficultyHistory).slice(1), ...formatGroundingDifficultyHistoryDiff(qualityData.providerGroundingDifficultyHistory)].map((line) => (
                                <p className="demo-metadata" key={`provider-grounding-difficulty-history-${line}`}>{line}</p>
                              ))}
                            </div>
                          </details>
                        </div>
                      )}
                    </>)}
                  </>) : (
                    <p className="demo-metadata">Loading quality dashboard…</p>
                  )}
                </div>

                <div className="demo-stream-panel">
                  <h3>Stream Retrieval Workflow</h3>
                  <p className="demo-metadata">
                    This page composes <code>useRAG()</code> for the broader demo, and this stream section proves the explicit workflow contract through <code>useRAG().workflow</code>.
                  </p>
                  <form className="demo-stream-form" onSubmit={submitStreamQuery}>
                    <label htmlFor="stream-model-key">Answer model</label>
                    <select
                      id="stream-model-key"
                      onChange={(evt) => setSelectedAIModelKey(evt.target.value)}
                      value={selectedAIModelKey}
                    >
                      {aiModelCatalog.models.length === 0 ? (
                        <option value="">Configure an AI provider</option>
                      ) : (
                        aiModelCatalog.models.map((model) => (
                          <option key={model.key} value={model.key}>{formatDemoAIModelLabel(model)}</option>
                        ))
                      )}
                    </select>
                    <p className="demo-metadata">Model switching stays on the official AbsoluteJS plugin path by selecting the provider and model sent with the retrieval stream request.</p>
                    <label htmlFor="stream-query">Question</label>
                    <input
                      id="stream-query"
                      onChange={(evt) => setStreamPrompt(evt.target.value)}
                      placeholder="e.g. What should I verify after ingesting a new source?"
                      type="text"
                      value={streamPrompt}
                    />
                    <div className="demo-actions">
                      {streamBusy ? (
                        <button onClick={workflow.cancel} type="button">Cancel</button>
                      ) : (
                        <button type="submit">Ask with retrieval stream</button>
                      )}
                    </div>
                  </form>
                  <div className="demo-result-grid">
                    <article className="demo-result-item">
                      <h4>Workflow Contract</h4>
                      <ul className="demo-detail-list">
                        <li>Explicit workflow surface: useRAG().workflow</li>
                        <li>Snapshot stage: {workflowState.stage}</li>
                        <li>Live stage field: {workflow.stage}</li>
                        <li>Snapshot sources: {workflowState.sources.length}</li>
                        <li>Snapshot running: {workflowState.isRunning ? "yes" : "no"}</li>
                      </ul>
                    </article>
                    <article className="demo-result-item">
                      <h4>Workflow Proof</h4>
                      <ul className="demo-detail-list">
                        <li>Retrieved: {workflowState.hasRetrieved ? "yes" : "no"}</li>
                        <li>Has sources: {workflowState.hasSources ? "yes" : "no"}</li>
                        <li>Citation count: {workflow.citations.length}</li>
                        <li>Grounding coverage: {streamGroundedAnswer.coverage}</li>
                      </ul>
                    </article>
                  </div>
                  <div className="demo-stage-row">
                    {streamStages.map((stage) => {
                      const currentStage = workflow.stage;
                      const isCurrent = currentStage === stage;
                      const isComplete = currentStage === "complete"
                        ? stage === "complete" || streamStages.indexOf(stage) < streamStages.indexOf(currentStage as typeof streamStages[number])
                        : streamStages.indexOf(stage) < streamStages.indexOf(currentStage as typeof streamStages[number]);

                      return (
                        <span
                          className={[
                            "demo-stage-pill",
                            isCurrent ? "current" : "",
                            isComplete ? "complete" : "",
                          ].filter(Boolean).join(" ")}
                          key={stage}
                        >
                          {stage}
                        </span>
                      );
                    })}
                  </div>
                  {streamRetrieval && (
                    <dl className="demo-stream-stats">
                      <div><dt>Retrieval started</dt><dd>{streamRetrieval.retrievalStartedAt ? formatDate(streamRetrieval.retrievalStartedAt) : "n/a"}</dd></div>
                      <div><dt>Retrieval duration</dt><dd>{streamRetrieval.retrievalDurationMs ?? 0}ms</dd></div>
                      <div><dt>Retrieved sources</dt><dd>{streamRetrieval.sources.length}</dd></div>
                      <div><dt>Current stage</dt><dd>{workflow.stage}</dd></div>
                    </dl>
                  )}
                  {workflow.error && <p className="demo-error">{workflow.error}</p>}
                  {streamLatestMessage?.thinking && (
                    <div className="demo-stream-block">
                      <h4>Thinking</h4>
                      <p className="demo-result-text">{streamLatestMessage.thinking}</p>
                    </div>
                  )}
                  {streamLatestMessage?.content && (
                    <div className="demo-stream-block">
                      <h4>Answer</h4>
                      <p className="demo-result-text">{streamLatestMessage.content}</p>
                    </div>
                  )}
                  {streamLatestMessage?.content && (
                    <div className="demo-results">
                      <h4>Answer Grounding</h4>
                      <p className={["demo-grounding-badge", `demo-grounding-${streamGroundedAnswer.coverage}`].join(" ")}>
                        {formatGroundingCoverage(streamGroundedAnswer.coverage)}
                      </p>
                      <ul className="demo-detail-list">
                        {formatGroundingSummary(streamGroundedAnswer).map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                      {streamGroundedAnswer.parts.some((part) => part.type === "citation") && (
                        <div className="demo-result-grid">
                          {streamGroundedAnswer.parts.map((part, index) =>
                            part.type === "citation" ? (
                              <article className="demo-result-item demo-grounding-card" key={`${part.text}-${index}`}>
                                <p className="demo-citation-badge">{formatGroundingPartReferences(part.referenceNumbers)}</p>
                                {formatGroundedAnswerPartDetails(part).map((line) => (
                                  <p className="demo-metadata" key={line}>{line}</p>
                                ))}
                                <p className="demo-result-text">{part.text}</p>
                              </article>
                            ) : null,
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {streamGroundingReferences.length > 0 && (
                    <div className="demo-results">
                      <h4>Grounding Reference Map</h4>
                      <p className="demo-metadata">
                        Each reference resolves answer citations back to concrete evidence with page, sheet, slide, archive, or thread context when available.
                      </p>
                      <div className="demo-result-grid">
                        {streamGroundingReferences.map((reference) => (
                          <article className="demo-result-item demo-grounding-card" key={reference.chunkId}>
                            <p className="demo-citation-badge">[{reference.number}] {formatGroundingReferenceLabel(reference)}</p>
                            <p className="demo-result-score">{formatGroundingReferenceSummary(reference)}</p>
                            {formatGroundingReferenceDetails(reference).map((line) => (
                              <p className="demo-metadata" key={line}>{line}</p>
                            ))}
                            <p className="demo-result-text">{formatGroundingReferenceExcerpt(reference)}</p>
                          </article>
                        ))}
                      </div>
                    </div>
                  )}
                  {workflow.sourceSummaries.length > 0 && (
                    <div className="demo-results">
                      <h4>Evidence Sources</h4>
                      <div className="demo-result-grid">
                        {workflow.sourceSummaries.map((summary) => (
                          <article className="demo-result-item" key={summary.key}>
                            <h3>{summary.label}</h3>
                            {formatSourceSummaryDetails(summary).map((line) => (
                              <p className="demo-metadata" key={line}>{line}</p>
                            ))}
                            <p className="demo-result-text">{summary.excerpt}</p>
                          </article>
                        ))}
                      </div>
                    </div>
                  )}
                  {workflow.citations.length > 0 && (
                    <div className="demo-results">
                      <h4>Citation Trail</h4>
                      <p className="demo-metadata">
                        Each citation maps a concrete retrieved chunk to a stable reference number you can carry into the answer UI.
                      </p>
                      <div className="demo-result-grid">
                        {workflow.citations.map((citation, index) => (
                          <article className="demo-result-item demo-citation-card" key={citation.chunkId}>
                            <p className="demo-citation-badge">[{index + 1}] {formatCitationLabel(citation)}</p>
                            <p className="demo-result-score">{formatCitationSummary(citation)}</p>
                            {formatCitationDetails(citation).map((line) => (
                              <p className="demo-metadata" key={line}>{line}</p>
                            ))}
                            <p className="demo-result-text">{formatCitationExcerpt(citation)}</p>
                          </article>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </article>
            </section>
          )}

          <section className="demo-grid">
            <article className="demo-card">
              <h2>Ingest Document</h2>
              <p className="demo-metadata">
                Add a document, choose its source format and chunking strategy, then search for it using the RAG hook-powered retrieval form above.
              </p>
              <div className="demo-results">
                <h3>Upload Extracted Fixtures</h3>
                <p className="demo-metadata">
                  These buttons use <code>useRAG().ingest.ingestUploads</code> directly. Each fixture is fetched from the local demo corpus, sent through the published upload ingest route, and then verified with a retrieval query against the uploaded source path.
                </p>
                <p className="demo-metadata">
                  Upload fixtures validate the extractor pipeline immediately. The managed document list below stays focused on authored example documents, while uploaded binaries are verified through retrieval.
                </p>
                <div className="demo-preset-grid">
                  {demoUploadPresets.map((preset) => (
                    <button
                      disabled={rag.ingest.isIngesting}
                      key={preset.id}
                      onClick={() => void ingestDemoUpload(preset)}
                      title={preset.description}
                      type="button"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <div className="demo-upload-row">
                  <input
                    accept={SUPPORTED_FILE_TYPE_OPTIONS.slice(1).map((entry) => entry[0]).join(",")}
                    onChange={(evt) => setSelectedUploadFile(evt.target.files?.[0] ?? null)}
                    type="file"
                  />
                  <button disabled={rag.ingest.isIngesting || selectedUploadFile === null} onClick={() => void uploadSelectedFile()} type="button">Upload file</button>
                </div>
                {selectedUploadFile && <p className="demo-metadata">Selected file: {selectedUploadFile.name}</p>}
                {uploadError && <p className="demo-error">{uploadError}</p>}
              </div>
              <form className="demo-add-form" onSubmit={submitAddDocument}>
                <label htmlFor="doc-id">Document ID (optional)</label>
                <input id="doc-id" name="id" onChange={onAddFieldChange} placeholder="auto-generated if blank" type="text" value={addForm.id} />
                <label htmlFor="doc-title">Title</label>
                <input id="doc-title" name="title" onChange={onAddFieldChange} required type="text" value={addForm.title} />
                <label htmlFor="doc-source">Source</label>
                <input id="doc-source" name="source" onChange={onAddFieldChange} placeholder="e.g. custom/launch-notes.md" type="text" value={addForm.source} />
                <label htmlFor="doc-format">Source format</label>
                <select id="doc-format" name="format" onChange={onAddFieldChange} value={addForm.format}>
                  {demoContentFormats.map((format) => (
                    <option key={format} value={format}>{formatContentFormat(format)}</option>
                  ))}
                </select>
                <label htmlFor="doc-chunk-strategy">Chunking strategy</label>
                <select id="doc-chunk-strategy" name="chunkStrategy" onChange={onAddFieldChange} value={addForm.chunkStrategy}>
                  {demoChunkingStrategies.map((strategy) => (
                    <option key={strategy} value={strategy}>{formatChunkStrategy(strategy)}</option>
                  ))}
                </select>
                <label htmlFor="doc-text">Body</label>
                <textarea id="doc-text" name="text" onChange={onAddFieldChange} required rows={8} value={addForm.text} />
                <button type="submit">Index document</button>
              </form>
              {addError && <p className="demo-error">{addError}</p>}
            </article>

            <article className="demo-card">
              <h2>Indexed Sources</h2>
              <div className="demo-stat-grid">
                <article className="demo-stat-card">
                  <span className="demo-stat-label">Indexed documents</span>
                  <strong>{filteredDocuments.length}</strong>
                  <p>{filteredDocuments.filter((document) => document.kind === "seed").length} seed · {filteredDocuments.filter((document) => document.kind === "custom").length} custom</p>
                </article>
              </div>
              <div className="demo-source-filter-row">
                <input
                  onChange={(evt) => {
                    setDocumentSearchTerm(evt.target.value);
                    setDocumentPage(1);
                  }}
                  placeholder="Search indexed sources by title, source, or text"
                  type="text"
                  value={documentSearchTerm}
                />
                <select
                  onChange={(evt) => {
                    setDocumentTypeFilter(evt.target.value);
                    setDocumentPage(1);
                  }}
                  value={documentTypeFilter}
                >
                  {SUPPORTED_FILE_TYPE_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="demo-pagination-row">
                <p className="demo-metadata">Showing {paginatedDocuments.length} of {filteredDocuments.length} matching documents</p>
                <div className="demo-pagination-controls">
                  <button disabled={documentPage <= 1} onClick={() => setDocumentPage((page) => Math.max(1, page - 1))} type="button">Prev</button>
                  {Array.from({ length: totalDocumentPages }, (_, index) => index + 1).map((pageNumber) => (
                    <button
                      className={pageNumber === documentPage ? "demo-page-button demo-page-button-active" : "demo-page-button"}
                      key={pageNumber}
                      onClick={() => setDocumentPage(pageNumber)}
                      type="button"
                    >
                      {pageNumber}
                    </button>
                  ))}
                  <button disabled={documentPage >= totalDocumentPages} onClick={() => setDocumentPage((page) => Math.min(totalDocumentPages, page + 1))} type="button">Next</button>
                </div>
              </div>
              <div className="demo-document-list">
                {paginatedDocuments.length > 0 ? (
                  paginatedDocuments.map((document) => (
                    <details className="demo-document-item demo-document-collapsible" key={document.id}>
                      <summary>
                        <div className="demo-document-header">
                          <div>
                            <h3>{document.title}</h3>
                            <p className="demo-metadata">{document.source} · {document.kind} · {document.chunkCount} chunk(s)</p>
                          </div>
                          <div className="demo-badge-row">
                            <span className="demo-badge">{formatContentFormat(document.format)}</span>
                            <span className="demo-badge">{formatChunkStrategy(document.chunkStrategy)}</span>
                            <span className="demo-badge">chunk target {document.chunkSize} chars</span>
                          </div>
                        </div>
                      </summary>
                      <div className="demo-collapsible-content">
                        <div className="demo-actions">
                          <button onClick={() => inspectChunks(document.id)} type="button">Inspect chunks</button>
                          <button onClick={() => runPresetSearch(`Source search for ${document.source}`, { source: document.source }, `row action: source ${document.source}`, "", "search-results")} type="button">Search source</button>
                          <button onClick={() => runPresetSearch(`Explain ${document.title}`, { documentId: document.id }, `row action: document ${document.id}`, "", "search-results")} type="button">Search document</button>
                          {document.kind === "custom" && <button onClick={() => deleteDocument(document.id)} type="button">Delete</button>}
                        </div>
                        <div className="demo-key-value-grid">
                          <div className="demo-key-value-row"><span>Source</span><strong>{document.source}</strong></div>
                          <div className="demo-key-value-row"><span>Created</span><strong>{formatDate(document.createdAt)}</strong></div>
                          <div className="demo-key-value-row"><span>Kind</span><strong>{document.kind}</strong></div>
                          <div className="demo-key-value-row"><span>Chunks</span><strong>{document.chunkCount}</strong></div>
                          {formatDemoMetadataSummary(document.metadata).map((line) => (
                            <div className="demo-key-value-row" key={line}><span>Metadata</span><strong>{line}</strong></div>
                          ))}
                        </div>
                        <p className="demo-document-preview">{document.text}</p>
                        <div className="demo-inline-preview">
                          {rag.chunkPreview.isLoading && chunkPreview?.document.id !== document.id && <p className="demo-metadata">Preparing chunk preview...</p>}
                          {!rag.chunkPreview.isLoading && chunkPreview?.document.id === document.id && (
                            <>
                              <p className="demo-section-caption">Chunk Preview</p>
                              <p className="demo-metadata">
                                {chunkPreview.document.title} · {formatContentFormat(chunkPreview.document.format)} · {formatChunkStrategy(chunkPreview.document.chunkStrategy)} · {chunkPreview.chunks.length} chunk(s)
                              </p>
                              <div className="demo-result-grid">
                                {chunkPreview.chunks.map((chunk) => (
                                  <article className="demo-result-item" key={chunk.chunkId}>
                                    <h3>{chunk.chunkId}</h3>
                                    <p className="demo-result-source">source: {chunk.source ?? chunkPreview.document.source}</p>
                                    <p className="demo-metadata">chunk index: {String((chunk.metadata?.chunkIndex as number | undefined) ?? 0)} / count: {String((chunk.metadata?.chunkCount as number | undefined) ?? chunkPreview.chunks.length)}</p>
                                    <p className="demo-result-text">{chunk.text}</p>
                                  </article>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </details>
                  ))
                ) : (
                  <p className="demo-metadata">No indexed sources match the current filters.</p>
                )}
              </div>
            </article>
          </section>
        </main>
      </body>
    </html>
  );
};

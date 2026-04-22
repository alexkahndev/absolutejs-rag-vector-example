const templateLiteral = (value: string) => value;

const renderTracePanel = ({
  title,
  summary,
  trace,
}: {
  title: string;
  summary: string;
  trace?: Parameters<typeof buildTracePresentation>[0];
}) => {
  if (!trace) {
    return "";
  }

  const presentation = buildTracePresentation(trace);
  return [
    '<div class="demo-results">',
    `<h4>${escapeHtml(title)}</h4>`,
    `<p class="demo-metadata">${escapeHtml(summary)}</p>`,
    '<div class="demo-stat-grid">',
    presentation.stats
      .map((row) => `<article class="demo-stat-card"><p class="demo-section-caption">${escapeHtml(row.label)}</p><strong>${escapeHtml(row.value)}</strong></article>`)
      .join(""),
    '</div>',
    '<div>',
    presentation.details
      .map((row) => `<p class="demo-key-value-row"><strong>${escapeHtml(row.label)}</strong><span>${escapeHtml(row.value)}</span></p>`)
      .join(""),
    '</div>',
    '<div class="demo-result-grid">',
    presentation.steps
      .map(
        (step, index) => `
          <details class="demo-collapsible demo-result-item" ${index === 0 ? 'open' : ''}>
            <summary><strong>${index + 1}. ${escapeHtml(step.label)}</strong></summary>
            ${step.rows.map((row) => `<p class="demo-key-value-row"><strong>${escapeHtml(row.label)}</strong><span>${escapeHtml(row.value)}</span></p>`).join("")}
          </details>`,
      )
      .join(""),
    '</div>',
    '</div>',
  ].join("");
};
import {
  createRAGHTMXWorkflowRenderConfig,
  type AIHTMXRenderConfig,
  type RAGEvaluationCaseResult,
  type RAGEvaluationSummary,
  type RAGHTMXWorkflowRenderConfig,
  type RAGSourceGroup,
} from "@absolutejs/rag";
import {
  buildRAGCitations,
  buildRAGGroundedAnswer,
  buildRAGGroundingReferences,
  buildRAGSourceGroups,
  buildRAGSourceSummaries,
} from "@absolutejs/rag/ui";
import { buildRAGChunkPreviewNavigation } from "@absolutejs/rag/client/ui";
import type {
  RAGAdminActionRecord,
  RAGAdminJobRecord,
  RAGCorpusHealth,
  RAGExtractorReadiness,
  RAGGroundedAnswerPart,
  RAGGroundedAnswerSectionSummary,
  RAGSyncSourceRecord,
} from "@absolutejs/rag";
import {
  DEMO_RERANKER_LABEL,
  DEMO_RERANKER_SUMMARY,
  buildActiveChunkPreviewSectionDiagnostic,
  attributionBenchmarkNotes,
  benchmarkOutcomeRail,
  formatBenchmarkOutcomeRailLabel,
  resolveBenchmarkRetrievalPresetId,
  buildSearchResponse,
  buildSearchSectionGroups,
  buildTracePresentation,
  formatAdminActionList,
  formatAdminJobList,
  formatCitationDetails,
  formatCitationExcerpt,
  formatCitationLabel,
  formatCitationSummary,
  formatChunkNavigationNodeLabel,
  formatChunkNavigationSectionLabel,
  formatChunkSectionGroupLabel,
  formatSectionDiagnosticAttributionFocus,
  formatSectionDiagnosticChannels,
  formatSectionDiagnosticCompetition,
  formatSectionDiagnosticDistributionRows,
  formatSectionDiagnosticPipeline,
  formatSectionDiagnosticStageBounds,
  formatSectionDiagnosticStageFlow,
  formatSectionDiagnosticStageWeightReasons,
  formatSectionDiagnosticStageWeightRows,
  formatSectionDiagnosticReasons,
  formatSectionDiagnosticTopEntry,
  formatDemoMetadataSummary,
  formatEvaluationHistoryDiff,
  formatEvaluationHistoryDetails,
  formatEvaluationHistoryRows,
  formatEvaluationHistorySummary,
  formatEvaluationHistoryTracePresentations,
  formatEvaluationLeaderboardEntry,
  formatGroundingEvaluationCase,
  formatGroundingEvaluationDetails,
  formatGroundingEvaluationSummary,
  formatGroundingHistorySummary,
  formatGroundingHistoryDetails,
  formatGroundingHistorySnapshotPresentations,
  formatGroundingCaseDifficultyEntry,
  formatGroundingDifficultyHistorySummary,
  formatGroundingDifficultyHistoryDetails,
  formatGroundingProviderCasePresentations,
  formatGroundingProviderPresentations,
  formatGroundingProviderOverviewPresentation,
  formatQualityOverviewPresentation,
  formatQualityOverviewNotes,
  buildDemoReleasePanelState,
  buildCitationGroups,
  buildGroundingReferenceGroups,
  buildSourceSummarySectionGroups,
  formatFailureSummary,
  buildInspectionEntries,
  formatInspectionSamples,
  formatInspectionSummary,
  formatGroundingCoverage,
  formatGroundedAnswerPartDetails,
  formatGroundedAnswerPartExcerpt,
  formatGroundingPartReferences,
  formatGroundingReferenceDetails,
  formatGroundingReferenceExcerpt,
  formatGroundingReferenceLabel,
  formatGroundingReferenceSummary,
  formatGroundedAnswerSectionSummaryDetails,
  formatGroundedAnswerSectionSummaryExcerpt,
  formatGroundingSummary,
  formatHealthSummary,
  formatReadinessSummary,
  formatRerankerComparisonPresentations,
  formatRerankerComparisonOverviewPresentation,
  formatRerankerComparisonSummary,
  formatRetrievalComparisonPresentations,
  formatRetrievalComparisonOverviewPresentation,
  formatRetrievalComparisonSummary,
  formatSourceSummaryDetails,
  formatSyncSourceDetails,
  formatSyncSourceExtendedDetails,
  formatSyncSourceRecentRuns,
  formatSyncSourceSubtype,
  formatSyncSourceSummary,
  demoReleaseWorkspaces,
  type DemoBackendMode,
  type DemoReleaseOpsResponse,
  type DemoRetrievalQualityResponse,
} from "../../frontend/demo-backends";

type RAGDocumentSummary = {
  total: number;
  chunkCount: number;
  byKind: Record<string, number>;
};

type RAGBackendCapabilities = {
  backend: string;
  persistence: string;
  nativeVectorSearch: boolean;
  serverSideFiltering: boolean;
  streamingIngestStatus: boolean;
};

type RAGVectorStoreStatus = {
  backend: string;
  vectorMode: string;
  dimensions?: number;
  native?: {
    active: boolean;
    fallbackReason?: string;
  };
};

type RAGSource = {
  chunkId: string;
  score: number;
  text: string;
  title?: string;
  source?: string;
};

type RAGIndexedDocument = {
  id: string;
  title: string;
  source: string;
  kind?: string;
  format?: string;
  chunkStrategy?: string;
  chunkSize?: number;
  chunkCount?: number;
  metadata?: Record<string, unknown>;
};

type RAGDocumentChunk = {
  chunkId: string;
  text: string;
  source?: string;
  metadata?: Record<string, unknown>;
};

type RAGDocumentChunkPreview = {
  document: RAGIndexedDocument;
  normalizedText: string;
  chunks: RAGDocumentChunk[];
};

const DOCUMENTS_PER_PAGE = 10;
const SUPPORTED_FILE_TYPE_OPTIONS = [
  ['all', 'All supported types'],
  ['.txt', '.txt'],
  ['.md', '.md'],
  ['.mdx', '.mdx'],
  ['.html', '.html'],
  ['.htm', '.htm'],
  ['.json', '.json'],
  ['.csv', '.csv'],
  ['.xml', '.xml'],
  ['.yaml', '.yaml'],
  ['.yml', '.yml'],
  ['.log', '.log'],
  ['.ts', '.ts'],
  ['.tsx', '.tsx'],
  ['.js', '.js'],
  ['.jsx', '.jsx'],
  ['.pdf', '.pdf'],
  ['.epub', '.epub'],
  ['.docx', '.docx'],
  ['.xlsx', '.xlsx'],
  ['.pptx', '.pptx'],
  ['.odt', '.odt'],
  ['.ods', '.ods'],
  ['.odp', '.odp'],
  ['.rtf', '.rtf'],
  ['.doc', '.doc'],
  ['.xls', '.xls'],
  ['.ppt', '.ppt'],
  ['.msg', '.msg'],
  ['.eml', '.eml'],
  ['.png', '.png'],
  ['.jpg', '.jpg'],
  ['.jpeg', '.jpeg'],
  ['.webp', '.webp'],
  ['.tiff', '.tiff'],
  ['.tif', '.tif'],
  ['.bmp', '.bmp'],
  ['.gif', '.gif'],
  ['.heic', '.heic'],
  ['.mp3', '.mp3'],
  ['.wav', '.wav'],
  ['.m4a', '.m4a'],
  ['.aac', '.aac'],
  ['.flac', '.flac'],
  ['.ogg', '.ogg'],
  ['.opus', '.opus'],
  ['.mp4', '.mp4'],
  ['.mov', '.mov'],
  ['.mkv', '.mkv'],
  ['.webm', '.webm'],
  ['.avi', '.avi'],
  ['.m4v', '.m4v'],
  ['.zip', '.zip'],
  ['.tar', '.tar'],
  ['.gz', '.gz'],
  ['.tgz', '.tgz'],
  ['.bz2', '.bz2'],
  ['.xz', '.xz'],
] as const;

type RAGMutationResponse = {
  ok: boolean;
  error?: string;
  deleted?: string;
  inserted?: string;
  status?: string;
};

type RAGOperationsResponse = {
  readiness?: RAGExtractorReadiness;
  health?: RAGCorpusHealth;
  adminJobs?: RAGAdminJobRecord[];
  adminActions?: RAGAdminActionRecord[];
  syncSources?: RAGSyncSourceRecord[];
};

const STREAM_STAGES = ["submitting", "retrieving", "retrieved", "streaming", "complete"] as const;

const escapeHtml = (text: string) =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const formatScore = (value: number) =>
  Number.isFinite(value) ? value.toFixed(3) : "0.000";

const formatTime = (timestamp?: number) => {
  if (!timestamp) {
    return "n/a";
  }

  return new Date(timestamp).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
};

const formatDuration = (durationMs?: number) => {
  if (typeof durationMs !== "number" || durationMs < 0) {
    return "n/a";
  }

  return `${durationMs}ms`;
};

const renderStageRow = (currentStage: (typeof STREAM_STAGES)[number]) =>
  `<div class="demo-stage-row">${STREAM_STAGES.map((stage) => {
    const classNames = ["demo-stage-pill"];

    if (stage === "complete") {
      classNames.push("complete");
    }

    if (stage === currentStage) {
      classNames.push("current");
    }

    return `<span class="${classNames.join(" ")}">${escapeHtml(stage)}</span>`;
  }).join("")}</div>`;

const renderCapabilities = (capabilities?: RAGBackendCapabilities) => {
  if (!capabilities) {
    return '<p class="demo-metadata">Backend capabilities unavailable.</p>';
  }

  const values = [
    capabilities.backend,
    capabilities.persistence,
    capabilities.nativeVectorSearch ? "native vector search" : "managed fallback search",
    capabilities.serverSideFiltering ? "server-side filters" : "client-side filters",
    capabilities.streamingIngestStatus ? "streaming ingest status" : "polled ingest status",
  ];

  return `<p class="demo-metadata">Backend capabilities: <strong>${escapeHtml(values.join(" · "))}</strong></p>`;
};

const renderNativeSource = (status?: RAGVectorStoreStatus) => {
  const native = status?.native;
  if (!native || !native.active) {
    return "Not applicable";
  }

  if (status?.backend === "sqlite") {
    return "Packaged sqlite-vec";
  }

  if (status?.backend === "postgres") {
    return "PostgreSQL pgvector extension";
  }

  return "Managed by AbsoluteJS";
};

const renderStatusSummary = (status?: RAGVectorStoreStatus) => {
  if (!status) {
    return "No backend status is available.";
  }

  if (status.native?.active) {
    return "Native vector acceleration is active.";
  }

  if (status.vectorMode === "json_fallback") {
    return "Owned JSON fallback retrieval is active.";
  }

  return `Vector mode ${status.vectorMode} is active.`;
};

const renderStatusMessage = (status?: RAGVectorStoreStatus) => {
  if (!status) {
    return "Backend status unavailable.";
  }

  return status.native?.fallbackReason ?? renderStatusSummary(status);
};

const renderAdminJobCards = (jobs?: RAGAdminJobRecord[]) => {
  const records = (jobs ?? []).slice(0, 3);
  if (records.length === 0) {
    return '<p class="demo-metadata">No admin jobs recorded yet.</p>';
  }

  return `<div class="demo-stat-grid">${records
    .map((job) => {
      const target = job.target ?? 'global';
      const timing =
        typeof job.startedAt === 'number'
          ? formatTime(job.startedAt)
          : 'n/a';

      return `<article class="demo-stat-card">
        <span class="demo-stat-label">${escapeHtml(job.action)}</span>
        <strong>${escapeHtml(job.status.toUpperCase())}</strong>
        <p>${escapeHtml(target)}</p>
        <div class="demo-key-value-list">
          <div class="demo-key-value-row"><span>Started</span><strong>${escapeHtml(timing)}</strong></div>
          ${typeof job.elapsedMs === 'number' ? `<div class="demo-key-value-row"><span>Elapsed</span><strong>${escapeHtml(formatDuration(job.elapsedMs))}</strong></div>` : ''}
        </div>
      </article>`;
    })
    .join('')}</div>`;
};

const renderAdminActionCards = (actions?: RAGAdminActionRecord[]) => {
  const records = (actions ?? []).slice(0, 3);
  if (records.length === 0) {
    return '<p class="demo-metadata">No admin actions recorded yet.</p>';
  }

  return `<div class="demo-stat-grid">${records
    .map((action) => {
      const target = action.documentId ?? action.target ?? 'global';
      const timing =
        typeof action.elapsedMs === 'number'
          ? formatDuration(action.elapsedMs)
          : typeof action.startedAt === 'number'
            ? formatTime(action.startedAt)
            : 'n/a';

      return `<article class="demo-stat-card">
        <span class="demo-stat-label">${escapeHtml(action.action)}</span>
        <strong>${escapeHtml(action.status.toUpperCase())}</strong>
        <p>${escapeHtml(target)}</p>
        <div class="demo-key-value-list">
          <div class="demo-key-value-row"><span>When</span><strong>${escapeHtml(timing)}</strong></div>
        </div>
      </article>`;
    })
    .join('')}</div>`;
};

const renderSourceGroups = (sourceGroups: RAGSourceGroup[]) => {
  if (sourceGroups.length === 0) {
    return '<p class="demo-metadata">Retrieved source groups: 0</p>';
  }

  return [
    `<p class="demo-metadata">Retrieved source groups: ${sourceGroups.length}</p>`,
    '<div class="demo-result-grid">',
    sourceGroups
      .map(
        (group) => `
          <article class="demo-result-item">
            <h3>${escapeHtml(group.label)}</h3>
            <p class="demo-result-source">best score ${formatScore(group.bestScore)} · ${group.count} chunk(s)</p>
            ${group.chunks
              .map(
                (chunk) => `
                  <p class="demo-metadata">[${escapeHtml(chunk.chunkId)}] ${escapeHtml(chunk.text)}</p>`,
              )
              .join("")}
          </article>`,
      )
      .join(""),
    '</div>',
  ].join('');
};

const renderSourceSummaries = (sources: RAGSource[]) => {
  const summaries = buildRAGSourceSummaries(sources);
  if (summaries.length === 0) {
    return '<p class="demo-metadata">Retrieved source groups: 0</p>';
  }

  const groups = buildSourceSummarySectionGroups(summaries);
  return [
    `<p class="demo-metadata">Retrieved source groups: ${summaries.length}</p>`,
    '<div class="demo-result-grid">',
    groups
      .map(
        (group) => `
          <article class="demo-result-item" id="${escapeHtml(group.targetId)}">
            <h3>${escapeHtml(group.label)}</h3>
            <p class="demo-result-source">${escapeHtml(group.summary)}</p>
            <div class="demo-result-grid">
              ${group.summaries
                .map(
                  (summary) => `
                    <article class="demo-result-item">
                      <h4>${escapeHtml(summary.label)}</h4>
                      ${formatSourceSummaryDetails(summary).map((line) => `<p class="demo-metadata">${escapeHtml(line)}</p>`).join("")}
                      <p class="demo-result-text">${escapeHtml(summary.excerpt)}</p>
                    </article>`,
                )
                .join("")}
            </div>
          </article>`,
      )
      .join(""),
    '</div>',
  ].join('');
};

const renderCitations = (sources: RAGSource[]) => {
  const citations = buildRAGCitations(sources);
  if (citations.length === 0) {
    return '';
  }

  return [
    '<div class="demo-results">',
    '<h4>Citation Trail</h4>',
    '<p class="demo-metadata">Each citation maps a concrete retrieved chunk to a stable reference number you can carry into the answer UI.</p>',
    '<div class="demo-result-grid">',
    buildCitationGroups(citations)
      .map(
        (group) => `
          <article class="demo-result-item" id="${escapeHtml(group.targetId)}">
            <h3>${escapeHtml(group.label)}</h3>
            <p class="demo-result-source">${escapeHtml(group.summary)}</p>
            <div class="demo-result-grid">
              ${group.citations
                .map(
                  (citation, index) => `
                    <article class="demo-result-item demo-citation-card">
                      <p class="demo-citation-badge">[${index + 1}] ${escapeHtml(formatCitationLabel(citation))}</p>
                      <p class="demo-result-score">${escapeHtml(formatCitationSummary(citation))}</p>
                      ${formatCitationDetails(citation).map((line) => `<p class="demo-metadata">${escapeHtml(line)}</p>`).join("")}
                      <p class="demo-result-text">${escapeHtml(formatCitationExcerpt(citation))}</p>
                    </article>`,
                )
                .join("")}
            </div>
          </article>`,
      )
      .join(""),
    '</div>',
    '</div></details>',
  ].join('');
};

const renderDetailList = (lines: string[], fallback: string) => {
  const values = lines.length > 0 ? lines : [fallback];
  return `<ul class="demo-detail-list">${values.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>`;
};

const inferDocumentExtension = (document: RAGIndexedDocument) => {
  const candidates = [document.source, document.title];
  for (const candidate of candidates) {
    const match = candidate.toLowerCase().match(/(\.[a-z0-9]+)(?:[#?].*)?$/);
    if (match) {
      return match[1];
    }
  }

  if (document.format === 'markdown') {
    return '.md';
  }
  if (document.format === 'html') {
    return '.html';
  }
  return '.txt';
};

const getChunkIndexText = (chunk: { metadata?: Record<string, unknown> }, fallbackCount: number) => {
  const chunkIndex = typeof chunk.metadata?.chunkIndex === 'number' ? chunk.metadata.chunkIndex : 0;
  const chunkCount = typeof chunk.metadata?.chunkCount === 'number' ? chunk.metadata.chunkCount : fallbackCount;
  return `chunk index: ${String(chunkIndex)} / count: ${String(chunkCount)}`;
};

const renderSectionDiagnosticCard = (diagnostic: {
  key: string;
  label: string;
  summary: string;
}) => [
  `<article class="demo-result-item">`,
  `<h4>${escapeHtml(diagnostic.label)}</h4>`,
  `<p class="demo-result-source">${escapeHtml(diagnostic.summary)}</p>`,
  `<p class="demo-metadata">${escapeHtml(formatSectionDiagnosticChannels(diagnostic as never))}</p>`,
  `<p class="demo-metadata">${escapeHtml(formatSectionDiagnosticAttributionFocus(diagnostic as never))}</p>`,
  `<p class="demo-metadata">${escapeHtml(formatSectionDiagnosticPipeline(diagnostic as never))}</p>`,
  `${formatSectionDiagnosticStageFlow(diagnostic as never) ? `<p class="demo-metadata">${escapeHtml(formatSectionDiagnosticStageFlow(diagnostic as never) ?? "")}</p>` : ""}`,
  `${formatSectionDiagnosticStageBounds(diagnostic as never) ? `<p class="demo-metadata">${escapeHtml(formatSectionDiagnosticStageBounds(diagnostic as never) ?? "")}</p>` : ""}`,
  `${formatSectionDiagnosticStageWeightRows(diagnostic as never).map((line: string) => `<p class="demo-metadata">${escapeHtml(line)}</p>`).join("")}`,
  `<p class="demo-metadata">${escapeHtml(formatSectionDiagnosticTopEntry(diagnostic as never))}</p>`,
  `${formatSectionDiagnosticCompetition(diagnostic as never) ? `<p class="demo-metadata">${escapeHtml(formatSectionDiagnosticCompetition(diagnostic as never) ?? "")}</p>` : ""}`,
  `${[...formatSectionDiagnosticReasons(diagnostic as never), ...formatSectionDiagnosticStageWeightReasons(diagnostic as never)].length > 0 ? `<div class="demo-badge-row">${[...formatSectionDiagnosticReasons(diagnostic as never), ...formatSectionDiagnosticStageWeightReasons(diagnostic as never)].map((reason) => `<span class="demo-state-chip">${escapeHtml(reason)}</span>`).join("")}</div>` : ""}`,
  `${formatSectionDiagnosticDistributionRows(diagnostic as never).map((line) => `<p class="demo-metadata">${escapeHtml(line)}</p>`).join("")}`,
  `</article>`,
].join("");

export const renderHtmxChunkPreviewFragment = (
  preview: RAGDocumentChunkPreview,
  options?: {
    mode?: string;
    query?: string;
    fileType?: string;
    page?: number;
    selectedChunkId?: string;
  },
) => {
  const navigation = buildRAGChunkPreviewNavigation(
    preview as Parameters<typeof buildRAGChunkPreviewNavigation>[0],
    options?.selectedChunkId,
  );
  const activeChunkId = navigation.activeChunkId;
  const query = options?.query ?? "";
  const fileType = options?.fileType ?? "all";
  const page = options?.page ?? 1;
  const previewUrlBase =
    options?.mode
      ? `/demo/documents/${encodeURIComponent(options.mode)}/${encodeURIComponent(preview.document.id)}/chunks?query=${encodeURIComponent(query)}&fileType=${encodeURIComponent(fileType)}&page=${page}`
      : undefined;

  const activeSectionDiagnostic = buildActiveChunkPreviewSectionDiagnostic(preview as never, activeChunkId ?? undefined);

  return [
    '<p class="demo-section-caption">Chunk Preview</p>',
    `<p class="demo-metadata">${escapeHtml(preview.document.title)} · ${escapeHtml(preview.document.format ?? 'text')} · ${escapeHtml(preview.document.chunkStrategy ?? 'paragraphs')} · ${preview.chunks.length} chunk(s)</p>`,
    '<article class="demo-result-item">',
    '<h3>Normalized text</h3>',
    `<p class="demo-result-text">${escapeHtml(preview.normalizedText)}</p>`,
    '</article>',
    navigation.activeNode
      ? [
          '<div class="demo-chunk-nav">',
          '<div class="demo-chunk-nav-row">',
          `<p class="demo-metadata">Section · ${escapeHtml(formatChunkNavigationSectionLabel(navigation))}</p>`,
          '<div class="demo-actions">',
          navigation.previousNode && previewUrlBase
            ? `<button type="button" hx-get="${escapeHtml(`${previewUrlBase}&chunkId=${encodeURIComponent(navigation.previousNode.chunkId)}`)}" hx-target="#chunk-preview-${escapeHtml(preview.document.id)}" hx-swap="innerHTML">Previous chunk</button>`
            : '<button type="button" disabled>Previous chunk</button>',
          navigation.nextNode && previewUrlBase
            ? `<button type="button" hx-get="${escapeHtml(`${previewUrlBase}&chunkId=${encodeURIComponent(navigation.nextNode.chunkId)}`)}" hx-target="#chunk-preview-${escapeHtml(preview.document.id)}" hx-swap="innerHTML">Next chunk</button>`
            : '<button type="button" disabled>Next chunk</button>',
          '</div>',
          '</div>',
          navigation.sectionNodes.length > 0
            ? `<div class="demo-chunk-nav-strip">${navigation.sectionNodes
                .map((node) =>
                  previewUrlBase
                    ? `<button type="button" class="${node.chunkId === activeChunkId ? 'demo-chunk-nav-chip demo-chunk-nav-chip-active' : 'demo-chunk-nav-chip'}" hx-get="${escapeHtml(`${previewUrlBase}&chunkId=${encodeURIComponent(node.chunkId)}`)}" hx-target="#chunk-preview-${escapeHtml(preview.document.id)}" hx-swap="innerHTML">${escapeHtml(formatChunkNavigationNodeLabel(node))}</button>`
                    : `<span class="${node.chunkId === activeChunkId ? 'demo-chunk-nav-chip demo-chunk-nav-chip-active' : 'demo-chunk-nav-chip'}">${escapeHtml(formatChunkNavigationNodeLabel(node))}</span>`,
                )
                .join("")}</div>`
            : "",
          navigation.parentSection || navigation.siblingSections.length > 0 || navigation.childSections.length > 0
            ? `<div class="demo-chunk-nav-strip">${[
                navigation.parentSection && previewUrlBase && navigation.parentSection.leadChunkId
                  ? `<button type="button" class="demo-chunk-nav-chip" hx-get="${escapeHtml(`${previewUrlBase}&chunkId=${encodeURIComponent(navigation.parentSection.leadChunkId)}`)}" hx-target="#chunk-preview-${escapeHtml(preview.document.id)}" hx-swap="innerHTML">Parent · ${escapeHtml(formatChunkSectionGroupLabel(navigation.parentSection))}</button>`
                  : '',
                ...navigation.siblingSections.map((section) =>
                  previewUrlBase && section.leadChunkId
                    ? `<button type="button" class="demo-chunk-nav-chip" hx-get="${escapeHtml(`${previewUrlBase}&chunkId=${encodeURIComponent(section.leadChunkId)}`)}" hx-target="#chunk-preview-${escapeHtml(preview.document.id)}" hx-swap="innerHTML">Sibling · ${escapeHtml(formatChunkSectionGroupLabel(section))}</button>`
                    : ''
                ),
                ...navigation.childSections.map((section) =>
                  previewUrlBase && section.leadChunkId
                    ? `<button type="button" class="demo-chunk-nav-chip" hx-get="${escapeHtml(`${previewUrlBase}&chunkId=${encodeURIComponent(section.leadChunkId)}`)}" hx-target="#chunk-preview-${escapeHtml(preview.document.id)}" hx-swap="innerHTML">Child · ${escapeHtml(formatChunkSectionGroupLabel(section))}</button>`
                    : ''
                )
              ].join('')}</div>`
            : "",
          '</div>',
        ].join("")
      : "",
    activeSectionDiagnostic
      ? renderSectionDiagnosticCard(activeSectionDiagnostic)
      : "",
    '<div class="demo-result-grid">',
    preview.chunks
      .map(
        (chunk) => `
        <article class="${chunk.chunkId === activeChunkId ? 'demo-result-item demo-result-item-active' : 'demo-result-item'}">
          <h3>${escapeHtml(chunk.chunkId)}</h3>
          <p class="demo-result-source">source: ${escapeHtml(chunk.source ?? preview.document.source)}</p>
          <p class="demo-metadata">${escapeHtml(getChunkIndexText(chunk, preview.chunks.length))}</p>
          <p class="demo-result-text">${escapeHtml(chunk.text)}</p>
        </article>`,
      )
      .join(''),
    '</div>',
  ].join('');
};

export const renderHtmxDocumentsPanel = ({
  documents,
  mode,
  query = '',
  fileType = 'all',
  page = 1,
  activeDocumentId,
  activePreviewHtml,
}: {
  documents: RAGIndexedDocument[];
  mode: string;
  query?: string;
  fileType?: string;
  page?: number;
  activeDocumentId?: string;
  activePreviewHtml?: string;
}) => {
  const normalizedQuery = query.trim().toLowerCase();
  const filteredDocuments = documents.filter((document) => {
    const matchesQuery =
      normalizedQuery.length === 0 ||
      document.title.toLowerCase().includes(normalizedQuery) ||
      document.source.toLowerCase().includes(normalizedQuery) ||
      (document as { text?: string }).text?.toLowerCase().includes(normalizedQuery) === true;
    const matchesType =
      fileType === 'all' || inferDocumentExtension(document) === fileType;
    return matchesQuery && matchesType;
  });
  const totalPages = Math.max(1, Math.ceil(filteredDocuments.length / DOCUMENTS_PER_PAGE));
  const activeDocumentPage =
    activeDocumentId
      ? Math.floor(
          Math.max(
            0,
            filteredDocuments.findIndex((document) => document.id === activeDocumentId),
          ) / DOCUMENTS_PER_PAGE,
        ) + 1
      : undefined;
  const currentPage = Math.min(
    totalPages,
    Math.max(1, activeDocumentPage ?? page),
  );
  const paginatedDocuments = filteredDocuments.slice((currentPage - 1) * DOCUMENTS_PER_PAGE, currentPage * DOCUMENTS_PER_PAGE);

  const renderPageButton = (pageNumber: number) => `
    <button
      class="${pageNumber === currentPage ? 'demo-page-button demo-page-button-active' : 'demo-page-button'}"
      type="button"
      hx-get="/demo/documents/${escapeHtml(mode)}?query=${encodeURIComponent(query)}&fileType=${encodeURIComponent(fileType)}&page=${pageNumber}"
      hx-target="#document-list"
      hx-swap="innerHTML"
    >${pageNumber}</button>`;

  return [
    '<div class="demo-stat-grid">',
    `<article class="demo-stat-card"><span class="demo-stat-label">Indexed documents</span><strong>${filteredDocuments.length}</strong><p>${filteredDocuments.filter((document) => document.kind === 'seed').length} seed · ${filteredDocuments.filter((document) => document.kind === 'custom').length} custom</p></article>`,
    '</div>',
    '<div class="demo-source-filter-row">',
    `<input name="query" value="${escapeHtml(query)}" placeholder="Search indexed sources by title, source, or text" type="text" hx-get="/demo/documents/${escapeHtml(mode)}" hx-trigger="input changed delay:150ms" hx-target="#document-list" hx-swap="innerHTML" hx-include="#document-type-filter" />`,
    `<select id="document-type-filter" name="fileType" hx-get="/demo/documents/${escapeHtml(mode)}" hx-trigger="change" hx-target="#document-list" hx-swap="innerHTML" hx-include="previous input">`,
    SUPPORTED_FILE_TYPE_OPTIONS.map(([value, label]) => `<option value="${value}"${value === fileType ? ' selected' : ''}>${label}</option>`).join(''),
    '</select>',
    '</div>',
    `<div class="demo-pagination-row"><p class="demo-metadata">Showing ${paginatedDocuments.length} of ${filteredDocuments.length} matching documents</p><div class="demo-pagination-controls">`,
    `<button type="button" ${currentPage <= 1 ? 'disabled' : ''} hx-get="/demo/documents/${escapeHtml(mode)}?query=${encodeURIComponent(query)}&fileType=${encodeURIComponent(fileType)}&page=${Math.max(1, currentPage - 1)}" hx-target="#document-list" hx-swap="innerHTML">Prev</button>`,
    Array.from({ length: totalPages }, (_, index) => renderPageButton(index + 1)).join(''),
    `<button type="button" ${currentPage >= totalPages ? 'disabled' : ''} hx-get="/demo/documents/${escapeHtml(mode)}?query=${encodeURIComponent(query)}&fileType=${encodeURIComponent(fileType)}&page=${Math.min(totalPages, currentPage + 1)}" hx-target="#document-list" hx-swap="innerHTML">Next</button>`,
    '</div></div>',
    paginatedDocuments.length === 0
      ? '<p class="demo-metadata">No indexed sources match the current filters.</p>'
      : `<div class="demo-document-list">${paginatedDocuments.map((doc) => {
          const inspectUrl = `/demo/documents/${mode}/${encodeURIComponent(doc.id)}/chunks`;
          const searchBySourceVals = escapeHtml(JSON.stringify({
            query: `Source search for ${doc.source}`,
            source: doc.source,
            topK: 6,
          }));
          const searchByDocumentVals = escapeHtml(JSON.stringify({
            query: `Explain ${doc.title}`,
            documentId: doc.id,
            topK: 6,
          }));
          const deleteButton =
            doc.kind === 'custom'
              ? `<button type="button" hx-delete="/rag/${escapeHtml(mode)}/documents/${encodeURIComponent(doc.id)}" hx-target="#mutation-status" hx-swap="innerHTML" hx-confirm="Delete ${escapeHtml(doc.title)}?">Delete</button>`
              : '';

          return `
            <details class="demo-document-item demo-document-collapsible"${doc.id === activeDocumentId ? ' open' : ''}>
              <summary>
                <div class="demo-document-header">
                  <div>
                    <h3>${escapeHtml(doc.title)}</h3>
                    <p class="demo-metadata">${escapeHtml(doc.source)} · ${escapeHtml(doc.kind ?? 'unknown')} · ${doc.chunkCount ?? 0} chunk(s)</p>
                  </div>
                  <div class="demo-badge-row">
                    <span class="demo-badge">${escapeHtml(doc.format ?? 'text')}</span>
                    <span class="demo-badge">${escapeHtml(doc.chunkStrategy ?? 'paragraphs')}</span>
                    <span class="demo-badge">chunk target ${doc.chunkSize ?? 0} chars</span>
                  </div>
                </div>
              </summary>
              <div class="demo-collapsible-content">
                <div class="demo-actions">
                  <button type="button" hx-get="${escapeHtml(inspectUrl)}" hx-target="#chunk-preview-${escapeHtml(doc.id)}" hx-swap="innerHTML">Inspect chunks</button>
                  <button type="button" hx-post="/demo/message/${escapeHtml(mode)}/search" hx-vals='${searchBySourceVals}' hx-target="#search-results" hx-swap="innerHTML" hx-on::after-request="document.getElementById('search-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })">Search source</button>
                  <button type="button" hx-post="/demo/message/${escapeHtml(mode)}/search" hx-vals='${searchByDocumentVals}' hx-target="#search-results" hx-swap="innerHTML" hx-on::after-request="document.getElementById('search-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })">Search document</button>
                  ${deleteButton}
                </div>
                <div class="demo-key-value-grid">
                  <div class="demo-key-value-row"><span>Source</span><strong>${escapeHtml(doc.source)}</strong></div>
                  <div class="demo-key-value-row"><span>Kind</span><strong>${escapeHtml(doc.kind ?? 'unknown')}</strong></div>
                  <div class="demo-key-value-row"><span>Chunks</span><strong>${doc.chunkCount ?? 0}</strong></div>
                  ${formatDemoMetadataSummary(doc.metadata).map((line) => `<div class="demo-key-value-row"><span>Metadata</span><strong>${escapeHtml(line)}</strong></div>`).join('')}
                </div>
                <div id="chunk-preview-${escapeHtml(doc.id)}" class="demo-inline-preview">${doc.id === activeDocumentId && activePreviewHtml ? activePreviewHtml : '<p class="demo-metadata">Pick Inspect chunks to compare normalized text with final chunk boundaries.</p>'}</div>
              </div>
            </details>`;
        }).join('')}</div>`,
  ].join('');
};

const renderWorkflowSummary = ({
  stage,
  sourceCount,
  isRunning,
  hasRetrieved,
  citationCount,
  coverage,
}: {
  stage: string;
  sourceCount: number;
  isRunning: boolean;
  hasRetrieved: boolean;
  citationCount: number;
  coverage: string;
}) => [
  '<div id="stream-workflow-summary" class="demo-result-grid" hx-swap-oob="outerHTML">',
  '<article class="demo-result-item">',
  '<h4>Workflow Contract</h4>',
  '<ul class="demo-detail-list">',
  '<li>Canonical entry point: HTMX workflow route</li>',
  '<li>Connected page surface: message + SSE transport</li>',
  `<li>Snapshot stage: ${escapeHtml(stage)}</li>`,
  `<li>Live stage field: ${escapeHtml(stage)}</li>`,
  `<li>Snapshot sources: ${String(sourceCount)}</li>`,
  `<li>Snapshot running: ${isRunning ? 'yes' : 'no'}</li>`,
  '</ul>',
  '</article>',
  '<article class="demo-result-item">',
  '<h4>Workflow Proof</h4>',
  '<ul class="demo-detail-list">',
  `<li>Retrieved: ${hasRetrieved ? 'yes' : 'no'}</li>`,
  `<li>Has sources: ${sourceCount > 0 ? 'yes' : 'no'}</li>`,
  `<li>Citation count: ${String(citationCount)}</li>`,
  `<li>Grounding coverage: ${escapeHtml(coverage)}</li>`,
  '</ul>',
  '</article>',
  '</div>',
].join('');

const renderIdleWorkflowSummary = () =>
  renderWorkflowSummary({
    stage: 'idle',
    sourceCount: 0,
    isRunning: false,
    hasRetrieved: false,
    citationCount: 0,
    coverage: 'ungrounded',
  });


const renderMutationRefreshes = () => [
  '<div id="search-results" class="demo-results" hx-swap-oob="innerHTML"><p class="demo-metadata">Run a search or use a document row action to inspect scoped retrieval.</p></div>',
  '<div id="chunk-preview-body" class="demo-results" hx-swap-oob="innerHTML"><p class="demo-metadata">Pick a document and click Inspect chunks to compare the normalized text with the final chunk boundaries.</p></div>',
].join('');

export const renderHtmxQualityPanel = ({ groundingEvaluation, providerGroundingComparison, providerGroundingDifficultyHistory, providerGroundingHistories, retrievalComparison, rerankerComparison, retrievalHistories, rerankerHistories, suite }: DemoRetrievalQualityResponse) => [
  (() => {
    const overview = formatQualityOverviewPresentation({
      retrievalComparison,
      rerankerComparison,
      groundingEvaluation,
      groundingProviderOverview: providerGroundingComparison
        ? formatGroundingProviderOverviewPresentation(providerGroundingComparison)
        : undefined,
    });
    return [
  `<div class="demo-results demo-quality-card">`,
  `<h3>Retrieval Quality Tooling</h3>`,
  `<p class="demo-metadata">This server-rendered HTMX version keeps the same summary-first hierarchy as the framework pages: winners up top, strategy cards next, grounding drill-downs after that, and history behind collapsible sections.</p>`,
  `<div class="demo-pill-row"><span class="demo-pill">${escapeHtml(suite.label ?? suite.id)} · ${suite.input.cases.length} cases</span></div>`,
  `<div class="demo-stat-grid">`,
  `<article class="demo-stat-card"><span class="demo-stat-label">Retrieval winner</span><strong>${escapeHtml(formatRetrievalComparisonOverviewPresentation(retrievalComparison).winnerLabel)}</strong><p>${escapeHtml(formatRetrievalComparisonOverviewPresentation(retrievalComparison).summary)}</p></article>`,
  `<article class="demo-stat-card"><span class="demo-stat-label">Reranker winner</span><strong>${escapeHtml(formatRerankerComparisonOverviewPresentation(rerankerComparison).winnerLabel)}</strong><p>${escapeHtml(formatRerankerComparisonOverviewPresentation(rerankerComparison).summary)}</p></article>`,
  `<article class="demo-stat-card"><span class="demo-stat-label">Grounding winner</span><strong>${escapeHtml(providerGroundingComparison ? formatGroundingProviderOverviewPresentation(providerGroundingComparison).winnerLabel : "Stored workflow evaluation")}</strong><p>${escapeHtml(providerGroundingComparison ? formatGroundingProviderOverviewPresentation(providerGroundingComparison).summary : formatGroundingEvaluationSummary(groundingEvaluation))}</p></article>`,
  `<article class="demo-stat-card"><span class="demo-stat-label">Why this matters</span><strong>Summary first</strong><p>Detailed evidence stays collapsed until you need to inspect regressions or grounding drift.</p></article>`,
  `</div>`,
  `<div class="demo-result-grid">`,
  `<article class="demo-result-item"><h4>Winners at a glance</h4><div class="demo-key-value-grid">${overview.rows.map((row) => `<div class="demo-key-value-row"><span>${escapeHtml(row.label)}</span><strong>${escapeHtml(row.value)}</strong></div>`).join("")}</div></article>`,
  `<article class="demo-result-item"><h4>Why this matters</h4><div class="demo-insight-stack">${formatQualityOverviewNotes().map((insight) => `<p class="demo-insight-card">${escapeHtml(insight)}</p>`).join("")}</div></article>`,
  `</div>`,
  `<div class="demo-result-grid">${formatRetrievalComparisonPresentations(retrievalComparison).map((card) => `<article class="demo-result-item demo-score-card"><h4>${escapeHtml(card.label)}</h4><p class="demo-score-headline">${escapeHtml(card.summary)}</p><div class="demo-key-value-grid demo-trace-summary-grid">${card.traceSummaryRows.map((row) => `<div class="demo-key-value-row"><span>${escapeHtml(row.label)}</span><strong>${escapeHtml(row.value)}</strong></div>`).join("")}</div><details class="demo-collapsible demo-trace-diff"><summary><span>Trace diff vs leader</span><strong>${escapeHtml(card.diffLabel)}</strong></summary><div class="demo-collapsible-content demo-trace-diff-grid">${card.diffRows.map((row) => `<div class="demo-key-value-row"><span>${escapeHtml(row.label)}</span><strong>${escapeHtml(row.value)}</strong></div>`).join("")}</div></details></article>`).join("")}${formatRerankerComparisonPresentations(rerankerComparison).map((card) => `<article class="demo-result-item demo-score-card"><h4>${escapeHtml(card.label)}</h4><p class="demo-score-headline">${escapeHtml(card.summary)}</p><div class="demo-key-value-grid demo-trace-summary-grid">${card.traceSummaryRows.map((row) => `<div class="demo-key-value-row"><span>${escapeHtml(row.label)}</span><strong>${escapeHtml(row.value)}</strong></div>`).join("")}</div><details class="demo-collapsible demo-trace-diff"><summary><span>Trace diff vs leader</span><strong>${escapeHtml(card.diffLabel)}</strong></summary><div class="demo-collapsible-content demo-trace-diff-grid">${card.diffRows.map((row) => `<div class="demo-key-value-row"><span>${escapeHtml(row.label)}</span><strong>${escapeHtml(row.value)}</strong></div>`).join("")}</div></details></article>`).join("")}</div>`,
  `<div class="demo-result-grid">${groundingEvaluation.cases.map((entry) => `<details class="demo-result-item demo-collapsible"><summary><span>${escapeHtml(entry.label ?? entry.caseId)}</span><strong>${escapeHtml(formatGroundingEvaluationCase(entry))}</strong></summary><div class="demo-collapsible-content">${formatGroundingEvaluationDetails(entry).map((line) => `<p class="demo-metadata">${escapeHtml(line)}</p>`).join("")}</div></details>`).join("")}</div>`,
  `${providerGroundingComparison ? `<div class="demo-result-grid">${formatGroundingProviderPresentations(providerGroundingComparison.entries).map((card: { label: string; summary: string }) => `<article class="demo-result-item demo-score-card"><h4>${escapeHtml(card.label)}</h4><p class="demo-score-headline">${escapeHtml(card.summary)}</p></article>`).join("")}<article class="demo-result-item"><h4>Hardest cases</h4><div class="demo-pill-row">${providerGroundingComparison.difficultyLeaderboard.map((entry) => `<span class="demo-pill">${escapeHtml(formatGroundingCaseDifficultyEntry(entry))}</span>`).join("")}</div></article></div>` : ''}`,
  `${providerGroundingComparison ? `<div class="demo-result-grid">${formatGroundingProviderCasePresentations(providerGroundingComparison.caseComparisons).map((card: { label: string; summary: string; rows: Array<{ label: string; value: string }> }) => `<details class="demo-result-item demo-collapsible"><summary><span>${escapeHtml(card.label)}</span><strong>${escapeHtml(card.summary)}</strong></summary><div class="demo-collapsible-content">${card.rows.map((row: { label: string; value: string }) => `<div class="demo-key-value-row"><span>${escapeHtml(row.label)}</span><strong>${escapeHtml(row.value)}</strong></div>`).join("")}</div></details>`).join("")}</div>` : ''}`,
  `<div class="demo-result-grid">${retrievalComparison.entries.map((entry) => `<details class="demo-result-item demo-collapsible"><summary><span>${escapeHtml(entry.label)} history</span><strong>${escapeHtml(formatEvaluationHistorySummary(retrievalHistories[entry.retrievalId])[0] ?? 'No runs yet')}</strong></summary><div class="demo-collapsible-content">${formatEvaluationHistoryRows(retrievalHistories[entry.retrievalId]).map((row) => `<div class="demo-key-value-row"><span>${escapeHtml(row.label)}</span><strong>${escapeHtml(row.value)}</strong></div>`).join("")}<div class="demo-result-grid">${formatEvaluationHistoryTracePresentations(retrievalHistories[entry.retrievalId]).map((traceCase) => `<details class="demo-result-item demo-collapsible"><summary><span>${escapeHtml(traceCase.label)}</span><strong>${escapeHtml(traceCase.summary)}</strong></summary><div class="demo-collapsible-content">${traceCase.rows.map((row) => `<div class="demo-key-value-row"><span>${escapeHtml(row.label)}</span><strong>${escapeHtml(row.value)}</strong></div>`).join("")}</div></details>`).join("")}</div></div></details>`).join("")}${rerankerComparison.entries.map((entry) => `<details class="demo-result-item demo-collapsible"><summary><span>${escapeHtml(entry.label)} history</span><strong>${escapeHtml(formatEvaluationHistorySummary(rerankerHistories[entry.rerankerId])[0] ?? 'No runs yet')}</strong></summary><div class="demo-collapsible-content">${formatEvaluationHistoryRows(rerankerHistories[entry.rerankerId]).map((row) => `<div class="demo-key-value-row"><span>${escapeHtml(row.label)}</span><strong>${escapeHtml(row.value)}</strong></div>`).join("")}<div class="demo-result-grid">${formatEvaluationHistoryTracePresentations(rerankerHistories[entry.rerankerId]).map((traceCase) => `<details class="demo-result-item demo-collapsible"><summary><span>${escapeHtml(traceCase.label)}</span><strong>${escapeHtml(traceCase.summary)}</strong></summary><div class="demo-collapsible-content">${traceCase.rows.map((row) => `<div class="demo-key-value-row"><span>${escapeHtml(row.label)}</span><strong>${escapeHtml(row.value)}</strong></div>`).join("")}</div></details>`).join("")}</div></div></details>`).join("")}</div>`,
  `${providerGroundingComparison ? `<div class="demo-result-grid">${providerGroundingComparison.entries.map((entry) => {
    const history = providerGroundingHistories[entry.providerKey];
    return `<details class="demo-result-item demo-collapsible"><summary><span>${escapeHtml(entry.label)} history</span><strong>${escapeHtml(formatGroundingHistorySummary(history)[0] ?? 'No runs yet')}</strong></summary><div class="demo-collapsible-content">${formatGroundingHistoryDetails(history).map((line) => `<p class="demo-metadata">${escapeHtml(line)}</p>`).join("")}${formatGroundingHistorySnapshotPresentations(history).length ? `<div class="demo-result-grid">${formatGroundingHistorySnapshotPresentations(history).map((snapshot) => `<details class="demo-result-item demo-collapsible"><summary><span>${escapeHtml(snapshot.label)}</span><strong>${escapeHtml(snapshot.summary)}</strong></summary><div class="demo-collapsible-content">${snapshot.rows.map((row) => `<p class="demo-key-value-row"><strong>${escapeHtml(row.label)}</strong><span>${escapeHtml(row.value)}</span></p>`).join("")}</div></details>`).join("")}</div>` : ''}</div></details>`;
  }).join("")}<details class="demo-result-item demo-collapsible"><summary><span>Grounding difficulty history</span><strong>${escapeHtml(formatGroundingDifficultyHistorySummary(providerGroundingDifficultyHistory)[0] ?? 'No history yet')}</strong></summary><div class="demo-collapsible-content">${formatGroundingDifficultyHistoryDetails(providerGroundingDifficultyHistory).map((line) => `<p class="demo-metadata">${escapeHtml(line)}</p>`).join("")}</div></details></div>` : ''}`,
  `</div>`,
].join('');
  })()
].join('');

export const renderHtmxOpsPanel = (ops: RAGOperationsResponse, mode?: string) => [
  '<div id="ops-panel" class="demo-results">',
  '<h3>Knowledge Base Operations</h3>',
  '<div class="demo-stat-grid">',
  `<article class="demo-stat-card">
      <span class="demo-stat-label">Provider</span>
      <strong>${escapeHtml(ops.readiness?.providerConfigured ? (ops.readiness?.providerName ?? 'Runtime provider routing') : 'Not configured')}</strong>
      <p>${escapeHtml(
        ops.readiness?.providerConfigured
          ? (ops.readiness?.model
              ? `Requests route through ${ops.readiness?.providerName ?? 'the runtime provider registry'} with default model ${ops.readiness.model}.`
              : `Requests route through ${ops.readiness?.providerName ?? 'the runtime provider registry'}.`)
          : 'Provider-backed retrieval is not configured yet.'
      )}</p>
    </article>`,
  `<article class="demo-stat-card">
      <span class="demo-stat-label">Embeddings</span>
      <strong>${escapeHtml(
        ops.readiness?.embeddingConfigured
          ? (ops.readiness?.embeddingModel === 'collection-managed embeddings' ? 'Collection-managed' : 'Configured')
          : 'Missing'
      )}</strong>
      <p>${escapeHtml(
        ops.readiness?.embeddingConfigured
          ? (ops.readiness?.embeddingModel === 'collection-managed embeddings'
              ? 'Embeddings come from the collection and vector store layer, so retrieval stays vector-backed without a separate top-level embedding provider.'
              : (ops.readiness?.embeddingModel ?? 'Embedding model configured.'))
          : 'Embeddings are not configured yet.'
      )}</p>
    </article>`,
  `<article class="demo-stat-card">
      <span class="demo-stat-label">Retrieval Stack</span>
      <strong>${escapeHtml(ops.readiness?.rerankerConfigured ? 'Reranker ready' : 'Vector only')}</strong>
      <p>${escapeHtml(ops.readiness?.indexManagerConfigured ? 'Index manager configured.' : 'Index manager not configured.')}</p>
    </article>`,
  `<article class="demo-stat-card">
      <span class="demo-stat-label">Extractors</span>
      <strong>${escapeHtml(ops.readiness?.extractorsConfigured ? `${ops.readiness.extractorNames.length} configured` : 'None configured')}</strong>
      <div class="demo-pill-row">${
        (ops.readiness?.extractorNames.length
          ? ops.readiness.extractorNames
          : ['No extractors configured'])
          .map((name) => `<span class="demo-pill">${escapeHtml(name)}</span>`)
          .join('')
      }</div>
    </article>`,
  '</div>',
  '<div class="demo-ops-metric-grid">',
  `<article class="demo-result-item demo-score-card">
      <h4>Corpus coverage</h4>
      <p class="demo-score-headline">${escapeHtml(
        ops.health
          ? `Formats: ${Object.entries(ops.health.coverageByFormat).map(([key, value]) => `${key} ${value}`).join(' · ') || 'none'}`
          : 'Waiting for corpus health...'
      )}</p>
      <div class="demo-key-value-list">
        <div class="demo-key-value-row"><span>By kind</span><strong>${escapeHtml(
          ops.health
            ? (Object.entries(ops.health.coverageByKind).map(([key, value]) => `${key} ${value}`).join(' · ') || 'none')
            : 'n/a'
        )}</strong></div>
        <div class="demo-key-value-row"><span>Average chunks per document</span><strong>${escapeHtml(
          ops.health ? ops.health.averageChunksPerDocument.toFixed(2) : 'n/a'
        )}</strong></div>
      </div>
    </article>`,
  `<article class="demo-result-item demo-score-card">
      <h4>Chunk quality</h4>
      <p class="demo-score-headline">${escapeHtml(
        ops.health
          ? `Empty docs ${ops.health.emptyDocuments} · Empty chunks ${ops.health.emptyChunks} · Low signal ${ops.health.lowSignalChunks}`
          : 'Waiting for corpus health...'
      )}</p>
      <div class="demo-key-value-list">
        <div class="demo-key-value-row"><span>Missing source</span><strong>${escapeHtml(String(ops.health?.documentsMissingSource ?? 'n/a'))}</strong></div>
        <div class="demo-key-value-row"><span>Missing title</span><strong>${escapeHtml(String(ops.health?.documentsMissingTitle ?? 'n/a'))}</strong></div>
        <div class="demo-key-value-row"><span>Missing metadata</span><strong>${escapeHtml(String(ops.health?.documentsMissingMetadata ?? 'n/a'))}</strong></div>
      </div>
    </article>`,
  `<article class="demo-result-item demo-score-card">
      <h4>Freshness</h4>
      <p class="demo-score-headline">${escapeHtml(
        ops.health
          ? `Stale documents ${ops.health.staleDocuments.length} within ${((ops.health.staleAfterMs ?? 0) / 86400000).toFixed(1)}d threshold`
          : 'Waiting for corpus health...'
      )}</p>
      <div class="demo-key-value-list">
        <div class="demo-key-value-row"><span>Oldest age</span><strong>${escapeHtml(
          ops.health?.oldestDocumentAgeMs ? `${(ops.health.oldestDocumentAgeMs / 3600000).toFixed(1)}h` : 'n/a'
        )}</strong></div>
        <div class="demo-key-value-row"><span>Newest age</span><strong>${escapeHtml(
          ops.health?.newestDocumentAgeMs ? `${(ops.health.newestDocumentAgeMs / 1000).toFixed(1)}s` : 'n/a'
        )}</strong></div>
      </div>
    </article>`,
  `<article class="demo-result-item demo-score-card">
      <h4>Failures</h4>
      <p class="demo-score-headline">${escapeHtml(
        ops.health
          ? `Failed ingest jobs ${ops.health.failedIngestJobs} · Failed admin jobs ${ops.health.failedAdminJobs}`
          : 'Waiting for corpus health...'
      )}</p>
      ${renderDetailList([...formatFailureSummary(ops.health), ...formatInspectionSummary(ops.health), ...formatInspectionSamples(ops.health)], 'No recorded failures.')}
      ${buildInspectionEntries(ops.health).length > 0 ? `<div class="demo-actions">${buildInspectionEntries(ops.health).map((entry) => {
        const targetMode = escapeHtml(mode ?? "sqlite-native");
        const query = entry.sourceQuery ? `query=${encodeURIComponent(entry.sourceQuery)}` : '';
        const documentId = entry.documentId ? `documentId=${encodeURIComponent(entry.documentId)}` : '';
        const inspect = entry.documentId ? 'inspect=true' : '';
        const href = `/demo/documents/${targetMode}${query || documentId || inspect ? `?${[query, documentId, inspect].filter(Boolean).join('&')}` : ''}`;
        return `<a class="demo-release-action demo-release-action-neutral" href="${href}">${escapeHtml(entry.documentId ? `Inspect ${entry.kind}` : "Open documents")} · ${escapeHtml(entry.label)}</a>`;
      }).join("")}</div>` : ""}
    </article>`,
  '</div>',
  '<div class="demo-result-grid">',
  '<article class="demo-result-item"><h4>Sync Sources</h4>'
    + (
      (ops.syncSources?.length ?? 0) > 0
        ? [
            `<div class="demo-actions"><button type="button" hx-post="/demo/sync/${escapeHtml(mode ?? "sqlite-native")}" hx-target="#ops-panel" hx-swap="outerHTML">Sync all sources</button><button type="button" hx-post="/demo/sync/${escapeHtml(mode ?? "sqlite-native")}" hx-vals='{"background":"true"}' hx-target="#ops-panel" hx-swap="outerHTML">Queue background sync</button></div>`,
            '<div class="demo-stat-grid">',
            ...(ops.syncSources ?? []).map((source) => [
              '<details class="demo-stat-card demo-sync-action-group">',
              `<summary><strong>${escapeHtml(source.label)}</strong><span class="demo-sync-action-meta">${escapeHtml(formatSyncSourceSummary(source))}</span></summary>`,
              `<p class="demo-metadata">${escapeHtml(formatSyncSourceSubtype(source))}</p>`,
              '<div class="demo-pill-row">',
              `<span class="demo-pill">${escapeHtml(source.kind)}</span>`,
              `<span class="demo-pill">${escapeHtml(source.status.toLowerCase())}</span>`,
              `${typeof source.documentCount === 'number' ? `<span class="demo-pill">${escapeHtml(`${source.documentCount} docs`)}</span>` : ''}`,
              `${typeof source.chunkCount === 'number' ? `<span class="demo-pill">${escapeHtml(`${source.chunkCount} chunks`)}</span>` : ''}`,
              '</div>',
              '<div class="demo-actions">',
              `<button type="button" hx-post="/demo/sync/${escapeHtml(mode ?? "sqlite-native")}/${encodeURIComponent(source.id)}" hx-target="#ops-panel" hx-swap="outerHTML">Sync now</button>`,
              `<button type="button" hx-post="/demo/sync/${escapeHtml(mode ?? "sqlite-native")}/${encodeURIComponent(source.id)}" hx-vals='{"background":"true"}' hx-target="#ops-panel" hx-swap="outerHTML">Queue in background</button>`,
              '</div>',
              `<div class="demo-key-value-list">${formatSyncSourceDetails(source)
                .slice(0, 4)
                .map((line) => {
                  const separator = line.indexOf(':');
                  if (separator < 0) {
                    return `<div class="demo-key-value-row"><span>detail</span><strong>${escapeHtml(line)}</strong></div>`;
                  }

                  return `<div class="demo-key-value-row"><span>${escapeHtml(line.slice(0, separator))}</span><strong>${escapeHtml(line.slice(separator + 1).trim())}</strong></div>`;
                })
                .join('')}</div>`,
              (() => {
                const recentRuns = formatSyncSourceRecentRuns(source);
                const extraDetails = [
                  ...formatSyncSourceDetails(source).slice(4),
                  ...formatSyncSourceExtendedDetails(source),
                ];

                return [
                  recentRuns.length > 0
                    ? `<div class="demo-key-value-list">${recentRuns
                        .map(
                          (run) => `
                            <div class="demo-key-value-row">
                              <span>${escapeHtml(run.label)}</span>
                              <strong>${escapeHtml(`${run.trigger} · ${run.status} · ${run.output} · ${run.duration} · ${run.finishedAt}`)}</strong>
                            </div>
                            ${run.error ? `<p class="demo-metadata">${escapeHtml(`Run error: ${run.error}`)}</p>` : ''}`,
                        )
                        .join('')}</div>`
                    : '',
                  extraDetails.length > 0
                    ? `<details class="demo-collapsible"><summary>More sync details</summary>${renderDetailList(extraDetails, 'No additional sync details.')}</details>`
                    : '',
                ].join('');
              })(),
              '</details>',
            ].join("")),
            '</div>',
          ].join("")
        : renderDetailList([], 'No sync sources configured yet.')
    )
    + '</article>',
  '<article class="demo-result-item"><h4>Admin Jobs</h4>' + renderAdminJobCards(ops.adminJobs) + '</article>',
  '<article class="demo-result-item"><h4>Recent Admin Actions</h4>' + renderAdminActionCards(ops.adminActions) + '</article>',
  '</div>',
  '</div>',
].join('');

export const renderHtmxReleasePanel = (
  releaseData: DemoReleaseOpsResponse,
  actionMessage?: string,
  mode: DemoBackendMode = "sqlite-native",
) => {
  const releasePanel = buildDemoReleasePanelState(releaseData);
  const activeWorkspace = releaseData.workspace?.id ?? "alpha";

  return [
    '<div id="release-panel" class="demo-results demo-release-card">',
    '<h3>Release Control</h3>',
    '<p class="demo-metadata">This panel exercises the same AbsoluteJS release-control surface that backs retrieval baselines, lane readiness, incidents, and remediation execution tracking.</p>',
    actionMessage ? `<p class="demo-banner">${escapeHtml(actionMessage)}</p>` : '',
    '<div class="demo-release-hero">',
    '<div class="demo-release-hero-copy">',
    '<p class="demo-release-kicker">AbsoluteJS release workflow</p>',
    `<p class="demo-release-banner">${escapeHtml(releasePanel.releaseHero)}</p>`,
    `<p class="demo-release-summary">${escapeHtml(releasePanel.releaseHeroSummary)}</p>`,
    `<p class="demo-metadata">${escapeHtml(releasePanel.releaseHeroMeta)}</p>`,
    `<p class="demo-metadata">${escapeHtml(releasePanel.releaseScopeNote)}</p>`,
    `<div class="demo-release-pills">${releasePanel.releaseHeroPills.map((pill) => pill.targetCardId || pill.targetActivityId ? `<a class="demo-release-pill demo-release-pill-${escapeHtml(pill.tone)}" href="#${escapeHtml(pill.targetActivityId ?? pill.targetCardId ?? '')}" data-target-card="${escapeHtml(pill.targetCardId ?? '')}" onclick="const targetCard=this.dataset.targetCard; if(targetCard==='release-promotion-candidates-card'||targetCard==='release-stable-handoff-card'||targetCard==='release-remediation-history-card'){document.getElementById('release-diagnostics')?.setAttribute('open','open');}"><span class="demo-release-pill-label">${escapeHtml(pill.label)}</span><span class="demo-release-pill-value">${escapeHtml(pill.value)}</span></a>` : `<span class="demo-release-pill demo-release-pill-${escapeHtml(pill.tone)}"><span class="demo-release-pill-label">${escapeHtml(pill.label)}</span><span class="demo-release-pill-value">${escapeHtml(pill.value)}</span></span>`).join('')}</div>`,
    `<div class="demo-release-scenario-switcher">${demoReleaseWorkspaces.map((entry) => `<span class="demo-release-scenario-chip demo-release-workspace-chip${entry.id === activeWorkspace ? ' demo-release-scenario-chip-active' : ''}"><button type="button" title="${escapeHtml(entry.description)}" hx-get="${escapeHtml(`/demo/release/${mode}/htmx?workspace=${entry.id}`)}" hx-target="#htmx-release" hx-swap="innerHTML" ${entry.id === activeWorkspace ? "disabled" : ""}>Workspace · ${escapeHtml(entry.label)}</button></span>`).join('')}${releasePanel.releaseScenarioActions.map((entry) => `<span class="demo-release-scenario-chip${entry.active ? ' demo-release-scenario-chip-active' : ''}">${entry.action ? `<button type="button" title="${escapeHtml(entry.action.description)}" hx-post="${escapeHtml(entry.action.path)}" hx-vals='${escapeHtml(JSON.stringify(entry.action.payload))}' hx-target="#htmx-release" hx-swap="innerHTML">${escapeHtml(entry.label)}</button>` : `<span>${escapeHtml(entry.label)}</span>`}</span>`).join('')}</div>`,
    `<div class="demo-release-path">${releasePanel.releasePathSteps.map((step) => `<article class="demo-release-path-step demo-release-path-step-${escapeHtml(step.status)}"><div class="demo-release-path-step-header"><h4>${escapeHtml(step.label)}</h4><span class="demo-release-path-status demo-release-path-status-${escapeHtml(step.status)}">${escapeHtml(step.status)}</span></div><p>${escapeHtml(step.summary)}</p><p class="demo-release-path-detail">${escapeHtml(step.detail)}</p>${step.action ? `<button class="demo-release-path-action" type="button" title="${escapeHtml(step.action.description)}" hx-post="${escapeHtml(step.action.path)}" hx-vals='${escapeHtml(JSON.stringify(step.action.payload))}' hx-target="#htmx-release" hx-swap="innerHTML">${escapeHtml(step.action.label)}</button>` : ''}</article>`).join('')}</div>`,
    '</div>',
    '<div class="demo-release-action-rail">',
    '<span class="demo-release-action-label">Live actions</span>',
    `<div class="demo-release-action-state"><span class="demo-release-action-state-badge">Scenario · ${escapeHtml(releasePanel.scenario?.label ?? 'Blocked stable lane')}</span><span class="demo-release-action-delta-badge demo-release-action-delta-badge-${escapeHtml(releasePanel.releaseRailDeltaChip.tone)}">${escapeHtml(releasePanel.releaseRailDeltaChip.label)}</span><span class="demo-release-action-delta-badge demo-release-action-delta-badge-${escapeHtml(releasePanel.railIncidentPostureChip.tone)}">Incident posture · ${escapeHtml(releasePanel.railIncidentPostureChip.label)}</span><span class="demo-release-action-delta-badge demo-release-action-delta-badge-${escapeHtml(releasePanel.railGateChip.tone)}">Gate posture · ${escapeHtml(releasePanel.railGateChip.label)}</span><span class="demo-release-action-delta-badge demo-release-action-delta-badge-${escapeHtml(releasePanel.railApprovalChip.tone)}">Approval posture · ${escapeHtml(releasePanel.railApprovalChip.label)}</span><span class="demo-release-action-delta-badge demo-release-action-delta-badge-${escapeHtml(releasePanel.railRemediationChip.tone)}">Remediation posture · ${escapeHtml(releasePanel.railRemediationChip.label)}</span></div>`,
    `<div class="demo-release-rail-meta">${releasePanel.releaseRailUpdateSource.targetCardId || releasePanel.releaseRailUpdateSource.targetActivityId ? `<a class="demo-release-activity-lane demo-release-activity-lane-${escapeHtml(releasePanel.releaseRailUpdateSource.tone)}" href="#${escapeHtml(releasePanel.releaseRailUpdateSource.targetActivityId ?? releasePanel.releaseRailUpdateSource.targetCardId ?? '')}" data-target-card="${escapeHtml(releasePanel.releaseRailUpdateSource.targetCardId ?? '')}" onclick="const targetCard=this.dataset.targetCard; if(targetCard==='release-promotion-candidates-card'||targetCard==='release-stable-handoff-card'||targetCard==='release-remediation-history-card'){document.getElementById('release-diagnostics')?.setAttribute('open','open');}">${escapeHtml(releasePanel.releaseRailUpdateSource.label)}</a>` : `<span class="demo-release-activity-lane demo-release-activity-lane-${escapeHtml(releasePanel.releaseRailUpdateSource.tone)}">${escapeHtml(releasePanel.releaseRailUpdateSource.label)}</span>`}<p class="demo-release-updated">${escapeHtml(releasePanel.releaseRailUpdatedLabel)}</p></div>`,
    releasePanel.latestReleaseAction
      ? `<details class="demo-collapsible demo-release-action-latest demo-release-action-latest-${escapeHtml(releasePanel.latestReleaseAction.tone)}"><summary>Latest action · ${escapeHtml(releasePanel.latestReleaseAction.title)}</summary>${releasePanel.latestReleaseAction.detail ? `<p>${escapeHtml(releasePanel.latestReleaseAction.detail)}</p>` : ''}<p class="demo-release-next-step">${escapeHtml(releasePanel.latestReleaseAction.nextStep)}</p></details>`
      : '',
    `<details class="demo-collapsible demo-release-rail-callout demo-release-rail-callout-${escapeHtml(releasePanel.releaseRailCallout.tone)}"><summary>${escapeHtml(releasePanel.releaseRailCallout.title)}</summary><p>${escapeHtml(releasePanel.releaseRailCallout.message)}</p>${releasePanel.releaseRailCallout.detail ? `<p>${escapeHtml(releasePanel.releaseRailCallout.detail)}</p>` : ''}<p class="demo-release-next-step">${escapeHtml(releasePanel.releaseRailCallout.nextStep)}</p></details>`,
    releasePanel.recentReleaseActivity.length
      ? `<div class="demo-release-activity-stack"><span class="demo-release-action-subtitle">Recent activity</span>${releasePanel.recentReleaseActivity.map((entry) => `<a id="${escapeHtml(entry.id)}" class="demo-release-activity demo-release-activity-${escapeHtml(entry.tone)}" href="#${escapeHtml(entry.targetCardId)}" onclick="if(this.getAttribute('href')==='#release-promotion-candidates-card'||this.getAttribute('href')==='#release-stable-handoff-card'){document.getElementById('release-diagnostics')?.setAttribute('open','open');}"><span class="demo-release-activity-lane demo-release-activity-lane-${escapeHtml(entry.tone)}">${escapeHtml(entry.laneLabel)}</span><strong>${escapeHtml(entry.title)}</strong>${entry.detail ? ` · ${escapeHtml(entry.detail)}` : ''}</a>`).join('')}</div>`
      : '',
    `<div class="demo-release-action-group"><span class="demo-release-action-subtitle">Release</span><div class="demo-release-actions">${releasePanel.primaryReleaseActions.map((action) => `<button class="demo-release-action demo-release-action-${escapeHtml(action.tone ?? 'neutral')}" type="button" title="${escapeHtml(action.description)}" hx-post="${escapeHtml(action.path)}" hx-vals='${escapeHtml(JSON.stringify(action.payload))}' hx-target="#htmx-release" hx-swap="innerHTML">${escapeHtml(action.label)}</button>`).join('')}</div></div>`,
    releasePanel.secondaryReleaseActions.length > 0
      ? `<details class="demo-collapsible demo-release-more-actions"><summary>More actions</summary><div class="demo-release-actions">${releasePanel.secondaryReleaseActions.map((action) => `<button class="demo-release-action demo-release-action-${escapeHtml(action.tone ?? 'neutral')}" type="button" title="${escapeHtml(action.description)}" hx-post="${escapeHtml(action.path)}" hx-vals='${escapeHtml(JSON.stringify(action.payload))}' hx-target="#htmx-release" hx-swap="innerHTML">${escapeHtml(action.label)}</button>`).join('')}</div></details>`
      : '',
    releasePanel.handoffActions.length > 0
      ? `<div class="demo-release-action-group"><span class="demo-release-action-subtitle">Handoff</span><div class="demo-release-actions">${releasePanel.handoffActions.map((action) => `<button class="demo-release-action demo-release-action-${escapeHtml(action.tone ?? 'neutral')}" type="button" title="${escapeHtml(action.description)}" hx-post="${escapeHtml(action.path)}" hx-vals='${escapeHtml(JSON.stringify(action.payload))}' hx-target="#htmx-release" hx-swap="innerHTML">${escapeHtml(action.label)}</button>`).join('')}</div></div>`
      : '',
    `<div class="demo-release-action-group"><span class="demo-release-action-subtitle">Evidence drills</span><div class="demo-release-actions">${releasePanel.releaseEvidenceDrills.map((drill) => `<button class="demo-release-action demo-release-action-${escapeHtml(drill.active ? 'primary' : 'neutral')}" type="button" hx-post="/demo/message/${escapeHtml(mode)}/search" hx-vals='${escapeHtml(JSON.stringify({ query: drill.query ?? "", topK: drill.topK, retrievalPresetId: drill.retrievalPresetId || undefined }))}' hx-target="#search-results" hx-swap="innerHTML" hx-on::after-request="document.getElementById('search-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })">${escapeHtml(drill.label ?? "")}</button>`).join('')}</div>${releasePanel.releaseEvidenceDrills.map((drill) => `<p class="demo-metadata"><strong>${escapeHtml(drill.classificationLabel ?? "")}:</strong> ${escapeHtml(drill.summary ?? "")} Expected source · ${escapeHtml(drill.expectedSource ?? "")}</p><p class="demo-metadata">${escapeHtml(drill.traceExpectation ?? "")}</p>`).join('')}</div>`,
    '</div>',
    '</div>',
    '<div class="demo-stat-grid">',
    `<article class="demo-stat-card"><span class="demo-stat-label">Stable baseline</span><strong>${escapeHtml(releasePanel.stableBaseline?.label ?? 'Not promoted')}</strong><p>${escapeHtml(releasePanel.stableBaseline ? `${releasePanel.stableBaseline.retrievalId} · v${releasePanel.stableBaseline.version}${releasePanel.stableBaseline.approvedBy ? ` · approved by ${releasePanel.stableBaseline.approvedBy}` : ''}` : 'No stable baseline has been promoted yet.')}</p></article>`,
    `<article class="demo-stat-card"><span class="demo-stat-label">Canary baseline</span><strong>${escapeHtml(releasePanel.canaryBaseline?.label ?? 'Not promoted')}</strong><p>${escapeHtml(releasePanel.canaryBaseline ? `${releasePanel.canaryBaseline.retrievalId} · v${releasePanel.canaryBaseline.version}${releasePanel.canaryBaseline.approvedAt ? ` · ${new Date(releasePanel.canaryBaseline.approvedAt).toLocaleString()}` : ''}` : 'No canary baseline has been promoted yet.')}</p></article>`,
    `<article class="demo-stat-card"><span class="demo-stat-label">Stable readiness</span><strong>${escapeHtml(releasePanel.stableReadiness?.ready ? 'Ready' : 'Blocked')}</strong><p>${escapeHtml(releasePanel.stableReadinessStatSummary)}</p></article>`,
    `<article class="demo-stat-card"><span class="demo-stat-label">Remediation guardrails</span><strong>${escapeHtml(releasePanel.remediationSummary ? `${releasePanel.remediationSummary.guardrailBlockedCount} blocked · ${releasePanel.remediationSummary.replayCount} replays` : 'No remediation executions')}</strong><p>${escapeHtml(releasePanel.remediationGuardrailSummary)}</p></article>`,
    '</div>',
    '<div class="demo-result-grid">',
    `<article class="demo-result-item"><h4>Blocker comparison</h4><p class="demo-score-headline">${escapeHtml(releasePanel.scenarioClassificationLabel ? `Active blocker · ${releasePanel.scenarioClassificationLabel}` : 'Compare both blocker classes')}</p><div class="demo-result-grid">${releasePanel.releaseBlockerComparisonCards.map((card) => `<article class="demo-result-item"><h4>${escapeHtml(card.label)}${card.active ? ' · active' : ''}</h4>${card.detailLines.map((line) => `<p class="demo-metadata">${escapeHtml(line)}</p>`).join('')}</article>`).join('')}</div></article>`,
    `<article id="release-runtime-history-card" class="demo-result-item"><h4>Runtime planner history</h4><p class="demo-score-headline">${escapeHtml(releasePanel.runtimePlannerHistorySummary)}</p>${releasePanel.runtimePlannerHistoryLines.map((line) => `<p class="demo-metadata">${escapeHtml(line)}</p>`).join('')}</article>`,
    `<article id="release-benchmark-snapshots-card" class="demo-result-item"><h4>Adaptive planner benchmark</h4><p class="demo-score-headline">${escapeHtml(releasePanel.benchmarkSnapshotSummary)}</p>${releasePanel.benchmarkSnapshotLines.map((line) => `<p class="demo-metadata">${escapeHtml(line)}</p>`).join('')}</article>`,
    `<article id="release-active-deltas-card" class="demo-result-item"><h4>Active blocker deltas</h4><p class="demo-score-headline">${escapeHtml(releasePanel.activeBlockerDeltaSummary)}</p>${releasePanel.activeBlockerDeltaLines.map((line) => `<p class="demo-metadata">${escapeHtml(line)}</p>`).join('')}</article>`,
    `<article id="release-lane-readiness-card" class="demo-result-item"><h4>Lane readiness</h4><div class="demo-key-value-grid">${releasePanel.laneReadinessEntries.map((entry) => `<div class="demo-key-value-row"><span>${escapeHtml(entry.targetRolloutLabel ?? 'lane')}</span><strong>${escapeHtml(entry.ready ? 'ready' : 'blocked')}</strong></div>${entry.reasons.slice(0, 2).map((reason) => `<p class="demo-metadata">${escapeHtml(reason)}</p>`).join('')}`).join('') || '<p class="demo-metadata">No lane readiness snapshots are available yet.</p>'}</div></article>`,
    `<article class="demo-result-item"><h4>Lane recommendations</h4><div class="demo-insight-stack">${releasePanel.releaseRecommendations.length > 0 ? releasePanel.releaseRecommendations.map((entry) => `<p class="demo-insight-card"><strong>${escapeHtml(entry.targetRolloutLabel ?? 'lane')} · ${escapeHtml(entry.classificationLabel ?? 'release recommendation')}:</strong> ${escapeHtml(entry.recommendedAction.replaceAll('_', ' '))}${entry.reasons[0] ? ` · ${escapeHtml(entry.reasons[0])}` : ''}</p>`).join('') : '<p class="demo-insight-card">No lane recommendations are available yet.</p>'}</div></article>`,
    `<article id="release-open-incidents-card" class="demo-result-item"><h4>Open incidents</h4><p class="demo-score-headline">${escapeHtml(releasePanel.incidentSummaryLabel)}</p>${releasePanel.incidentClassificationDetailLines.map((line) => `<p class="demo-metadata">${escapeHtml(line)}</p>`).join('')}<div class="demo-insight-stack">${releasePanel.recentIncidents.slice(0, 3).map((incident) => `<p class="demo-insight-card"><strong>${escapeHtml(incident.targetRolloutLabel ?? 'lane')} · ${escapeHtml(incident.kind)} · ${escapeHtml(incident.classificationLabel ?? 'general regression')}</strong><br />${escapeHtml(incident.message)}</p>`).join('') || '<p class="demo-insight-card">No incidents recorded.</p>'}</div></article>`,
    `<article id="release-remediation-history-card" class="demo-result-item"><h4>Remediation execution history</h4>${releasePanel.remediationDetailLines.map((line) => `<p class="demo-metadata">${escapeHtml(line)}</p>`).join('')}<div class="demo-key-value-grid">${releasePanel.recentIncidentRemediationExecutions.slice(0, 4).map((entry) => `<div class="demo-key-value-row"><span>${escapeHtml(entry.action?.kind ?? 'execution')}</span><strong>${escapeHtml(`${entry.code ?? 'unknown'}${entry.idempotentReplay ? ' · replay' : ''}${entry.blockedByGuardrail ? ' · blocked' : ''}`)}</strong></div>`).join('') || '<p class="demo-metadata">No remediation executions recorded yet.</p>'}</div></article>`,
    '</div>',
    `<details id="release-diagnostics" class="demo-collapsible demo-release-diagnostics"><summary>Advanced release diagnostics · ${escapeHtml(releasePanel.releaseDiagnosticsSummary)}</summary><p class="demo-release-updated">${escapeHtml(releasePanel.releaseDiagnosticsUpdatedLabel)}</p><p class="demo-release-card-state demo-release-card-state-${escapeHtml(releasePanel.releaseStateBadge.tone)}">State · ${escapeHtml(releasePanel.releaseStateBadge.label)}</p><div class="demo-result-grid">`,
    `<article id="release-promotion-candidates-card" class="demo-result-item"><h4>Promotion candidates</h4><div class="demo-key-value-grid">${releasePanel.releaseCandidates.length > 0 ? releasePanel.releaseCandidates.slice(0, 3).map((candidate) => `<div class="demo-key-value-row"><span>${escapeHtml(candidate.targetRolloutLabel ?? 'lane')} · ${escapeHtml(candidate.candidateRetrievalId ?? 'candidate')}</span><strong>${escapeHtml(candidate.reviewStatus)}</strong></div><p class="demo-metadata">${escapeHtml(candidate.reasons[0] ?? 'No release reasons recorded.')}</p>`).join('') : '<p class="demo-metadata">No promotion candidates recorded yet.</p>'}</div></article>`,
    `<article class="demo-result-item"><h4>Release alerts</h4><div class="demo-insight-stack">${releasePanel.releaseAlerts.length > 0 ? releasePanel.releaseAlerts.slice(0, 4).map((alert) => `<p class="demo-insight-card"><strong>${escapeHtml(alert.targetRolloutLabel ?? 'lane')} · ${escapeHtml(alert.kind)} · ${escapeHtml(alert.classificationLabel ?? 'general regression')}</strong><br />${escapeHtml(alert.message ?? 'No alert detail')}</p>`).join('') : '<p class="demo-insight-card">No release alerts are active.</p>'}</div></article>`,
    `<article id="release-policy-history-card" class="demo-result-item"><h4>Policy history</h4>${releasePanel.policyHistoryDetailLines.map((line) => `<p class="demo-metadata">${escapeHtml(line)}</p>`).join('')}<div class="demo-insight-stack">${releasePanel.policyHistoryEntries.length > 0 ? releasePanel.policyHistoryEntries.map((entry) => `<p class="demo-insight-card"><strong>${escapeHtml(entry.title)}</strong><br />${escapeHtml(entry.detail)}</p>`).join('') : `<p class="demo-insight-card">${escapeHtml(releasePanel.policyHistorySummary)}</p>`}</div></article>`,
    `<article id="release-audit-surfaces-card" class="demo-result-item"><h4>Audit surfaces</h4><div class="demo-insight-stack">${releasePanel.auditSurfaceEntries.length > 0 ? releasePanel.auditSurfaceEntries.map((entry) => `<p class="demo-insight-card"><strong>${escapeHtml(entry.title)}</strong><br />${escapeHtml(entry.detail)}</p>`).join("") : `<p class="demo-insight-card">${escapeHtml(releasePanel.auditSurfaceSummary)}</p>`}</div></article>`,
    `<article id="release-polling-surfaces-card" class="demo-result-item"><h4>Polling surfaces</h4><div class="demo-insight-stack">${releasePanel.pollingSurfaceEntries.map((entry) => `<p class="demo-insight-card"><strong>${escapeHtml(entry.title)}</strong><br />${escapeHtml(entry.detail)}</p>`).join("")}</div></article>`,
    `<article id="release-handoff-incidents-card" class="demo-result-item"><h4>Handoff incidents</h4><p class="demo-score-headline">${escapeHtml(releasePanel.stableHandoffIncidentSummaryLabel)}</p><div class="demo-insight-stack">${releasePanel.handoffIncidents.length > 0 ? releasePanel.handoffIncidents.slice(0, 2).map((incident) => `<p class="demo-insight-card"><strong>${escapeHtml(incident.status ?? "incident")} · ${escapeHtml(incident.kind ?? "handoff_stale")}</strong><br />${escapeHtml(incident.message ?? "No handoff incident detail")}</p>`).join("") : `<p class="demo-insight-card">No handoff incidents recorded.</p>`}${releasePanel.handoffIncidentHistory.slice(0, 3).map((entry) => `<p class="demo-insight-card"><strong>${escapeHtml(entry.action ?? "history")}</strong><br />${escapeHtml([entry.notes, entry.recordedAt ? new Date(entry.recordedAt).toLocaleString() : undefined].filter(Boolean).join(" · "))}</p>`).join("")}</div></article>`,
    `<article id="release-stable-handoff-card" class="demo-result-item"><h4>Stable handoff</h4><div class="demo-key-value-grid">${releasePanel.stableHandoff ? `<div class="demo-key-value-row"><span>${escapeHtml(releasePanel.stableHandoff.sourceRolloutLabel)} -&gt; ${escapeHtml(releasePanel.stableHandoff.targetRolloutLabel)}</span><strong>${escapeHtml(releasePanel.stableHandoff.readyForHandoff ? 'ready' : 'blocked')}</strong></div><p class="demo-metadata">${escapeHtml(releasePanel.stableHandoff.candidateRetrievalId ? `candidate ${releasePanel.stableHandoff.candidateRetrievalId}` : 'No candidate retrieval is attached to the handoff yet.')}${releasePanel.stableHandoffDecision?.kind ? ` · ${escapeHtml(`latest ${releasePanel.stableHandoffDecision.kind}`)}` : ''}</p>${releasePanel.stableHandoffDisplayReasons.map((reason) => `<p class="demo-metadata">${escapeHtml(reason)}</p>`).join('')}${releasePanel.stableHandoffAutoCompleteLabel ? `<p class="demo-metadata">${escapeHtml(releasePanel.stableHandoffAutoCompleteLabel)}</p>` : ''}<div class="demo-key-value-row"><span>Drift events</span><strong>${escapeHtml(String(releasePanel.stableHandoffDrift?.totalCount ?? 0))}</strong></div>` : '<p class="demo-metadata">No stable handoff posture is available yet.</p>'}</div></article>`,
    '</div>',
    '</div>',
  ].join('');
};

const renderEvaluationResults = (
  cases: RAGEvaluationCaseResult[],
  summary: RAGEvaluationSummary,
) => {
  if (cases.length === 0) {
    return '<p class="demo-metadata">No evaluation results available.</p>';
  }

  const passingRate = summary.totalCases > 0
    ? ((summary.passedCases / summary.totalCases) * 100).toFixed(1)
    : "0.0";

  return [
    `<p class="demo-metadata">Benchmark summary: ${summary.passedCases}/${summary.totalCases} pass · precision ${(summary.averagePrecision * 100).toFixed(1)}% · recall ${(summary.averageRecall * 100).toFixed(1)}% · f1 ${summary.averageF1.toFixed(3)} · avg latency ${summary.averageLatencyMs.toFixed(1)}ms · passing ${passingRate}%</p>`,
    '<div class="demo-result-grid">',
    cases
      .map(
        (entry) => `
          <article class="demo-result-item demo-evaluation-card demo-evaluation-${escapeHtml(entry.status)}">
            <h4>${escapeHtml(entry.label ?? entry.caseId)}</h4>
            <p class="demo-result-source">${escapeHtml(entry.query)}</p>
            <p class="demo-evaluation-status">${escapeHtml(entry.status.toUpperCase())}</p>
            <p class="demo-metadata">${escapeHtml(
              `${entry.status.toUpperCase()} via ${entry.mode} · matched ${entry.matchedCount}/${entry.expectedCount} · precision ${(entry.precision * 100).toFixed(1)}% · recall ${(entry.recall * 100).toFixed(1)}% · f1 ${entry.f1.toFixed(3)}`,
            )}</p>
            <p class="demo-metadata">expected: ${escapeHtml(entry.expectedIds.join(", "))}</p>
            <p class="demo-metadata">retrieved: ${escapeHtml(entry.retrievedIds.join(", "))}</p>
            <p class="demo-result-text">missing: ${escapeHtml(entry.missingIds.join(", ") || "none")}</p>
          </article>`,
      )
      .join(""),
    '</div>',
  ].join("");
};

const renderIdleStreamQueryField = () => [
  '<div id="stream-query-field" hx-swap-oob="outerHTML">',
  '<label for="stream-query">Question</label>',
  '<input id="stream-query" name="content" placeholder="e.g. What should I verify after ingesting a new source?" required type="text" />',
  '</div>',
].join('');

const renderActiveStreamQueryField = (content: string) => [
  '<div id="stream-query-field" hx-swap-oob="outerHTML">',
  '<label for="stream-query">Question</label>',
  `<input id="stream-query" name="content" disabled type="text" value="${escapeHtml(content)}" />`,
  '</div>',
].join('');

const renderIdleStreamControls = () => [
  '<div id="stream-form-controls" class="demo-stream-actions" hx-swap-oob="outerHTML">',
  '<button type="submit">Ask with retrieval stream</button>',
  '</div>',
].join('');

const renderActiveStreamControls = (cancelUrl: string) => [
  '<div id="stream-form-controls" class="demo-stream-actions" hx-swap-oob="outerHTML">',
  `<button type="button" class="ai-cancel-button" hx-post="${escapeHtml(cancelUrl)}" hx-target="#stream-form-controls" hx-swap="outerHTML">Cancel</button>`,
  '</div>',
].join('');

export const createHtmxAIStreamRenderConfig = (): AIHTMXRenderConfig => {
  let latestRetrievedSources: RAGSource[] = [];

  return ({
  messageStart: ({ cancelUrl, content, messageId, sseUrl }) => {
    latestRetrievedSources = [];

    return [
    `<div id="msg-${escapeHtml(messageId)}" class="message user">`,
    `<div>${escapeHtml(content)}</div>`,
    '</div>',
    `<div id="response-${escapeHtml(messageId)}" hx-ext="sse" sse-connect="${escapeHtml(sseUrl)}" hx-swap="innerHTML">`,
    `<div id="sse-retrieval-${escapeHtml(messageId)}" sse-swap="retrieval" hx-swap="innerHTML"></div>`,
    `<div id="sse-sources-${escapeHtml(messageId)}" sse-swap="sources" hx-swap="innerHTML"></div>`,
    `<div id="sse-content-${escapeHtml(messageId)}" sse-swap="content" hx-swap="innerHTML"></div>`,
    `<div id="sse-thinking-${escapeHtml(messageId)}" sse-swap="thinking" hx-swap="innerHTML"></div>`,
    `<div id="sse-tools-${escapeHtml(messageId)}" sse-swap="tools" hx-swap="innerHTML"></div>`,
    `<div id="sse-images-${escapeHtml(messageId)}" sse-swap="images" hx-swap="innerHTML"></div>`,
    `<div id="sse-status-${escapeHtml(messageId)}" sse-swap="status" hx-swap="innerHTML"></div>`,
    '</div>',
    renderWorkflowSummary({
      stage: 'submitting',
      sourceCount: 0,
      isRunning: true,
      hasRetrieved: false,
      citationCount: 0,
      coverage: 'ungrounded',
    }),
    renderActiveStreamQueryField(content),
    renderActiveStreamControls(cancelUrl),
  ].join('');
  },
  ragRetrieving: (input) => {
    const retrievalStartedAt = input?.retrievalStartedAt;

    return [
      renderWorkflowSummary({
        stage: 'retrieving',
        sourceCount: 0,
        isRunning: true,
        hasRetrieved: false,
        citationCount: 0,
        coverage: 'ungrounded',
      }),
      '<div class="demo-stream-block">',
      '<h4>Retrieval status</h4>',
      renderStageRow('retrieving'),
      '<dl class="demo-stream-stats">',
      `<div><dt>Retrieval started</dt><dd>${escapeHtml(formatTime(retrievalStartedAt))}</dd></div>`,
      '</dl>',
      '<p class="demo-metadata">Retrieving sources...</p>',
      '</div>',
    ].join('');
  },
  ragRetrieved: (sources, details) => {
    latestRetrievedSources = sources;

    return [
      renderWorkflowSummary({
        stage: 'retrieved',
        sourceCount: sources.length,
        isRunning: true,
        hasRetrieved: true,
        citationCount: buildRAGCitations(sources).length,
        coverage: 'ungrounded',
      }),
      '<div class="demo-stream-block">',
      '<h4>Retrieved sources</h4>',
      renderStageRow('retrieved'),
      '<dl class="demo-stream-stats">',
      `<div><dt>Retrieval started</dt><dd>${escapeHtml(formatTime(details?.retrievalStartedAt))}</dd></div>`,
      `<div><dt>Retrieval duration</dt><dd>${escapeHtml(formatDuration(details?.retrievalDurationMs))}</dd></div>`,
      `<div><dt>Source groups</dt><dd>${buildRAGSourceGroups(sources).length}</dd></div>`,
      '</dl>',
      renderSourceSummaries(sources),
      renderTracePanel({
        summary: "This is the first-class retrieval trace from AbsoluteJS for the streamed workflow path. It shows how retrieval executed before answer generation.",
        title: "Workflow Retrieval Trace",
        trace: details?.trace,
      }),
      renderCitations(sources),
      '</div>',
    ].join('');
  },
  chunk: (_text, fullContent) => {
    const groundedAnswer = buildRAGGroundedAnswer(fullContent, latestRetrievedSources);
    const groundingReferences = buildRAGGroundingReferences(latestRetrievedSources);

    return [
      renderWorkflowSummary({
        stage: 'streaming',
        sourceCount: latestRetrievedSources.length,
        isRunning: true,
        hasRetrieved: latestRetrievedSources.length > 0,
        citationCount: buildRAGCitations(latestRetrievedSources).length,
        coverage: groundedAnswer.coverage,
      }),
      '<div class="demo-stream-block">',
      '<h4>Answer</h4>',
      renderStageRow('streaming'),
      `<p class="demo-result-text">${escapeHtml(fullContent)}</p>`,
      '</div>',
      '<div class="demo-results">',
      '<h4>Answer Grounding</h4>',
      `<p class="demo-grounding-badge demo-grounding-${escapeHtml(groundedAnswer.coverage)}">${escapeHtml(formatGroundingCoverage(groundedAnswer.coverage))}</p>`,
      renderDetailList(formatGroundingSummary(groundedAnswer), 'No grounding summary available.'),
      groundedAnswer.parts.some((part: RAGGroundedAnswerPart) => part.type === 'citation')
        ? '<div class="demo-result-grid">' + groundedAnswer.parts.map((part: RAGGroundedAnswerPart) => part.type === 'citation' ? `<article class="demo-result-item demo-grounding-card"><p class="demo-citation-badge">${escapeHtml(formatGroundingPartReferences(part.referenceNumbers))}</p>${formatGroundedAnswerPartDetails(part).map((line) => `<p class="demo-metadata">${escapeHtml(line)}</p>`).join("")}<p class="demo-result-text">${escapeHtml(formatGroundedAnswerPartExcerpt(part))}</p></article>` : '').join('') + '</div>'
        : '',
      '</div>',
      groundedAnswer.sectionSummaries.length > 0
        ? '<div class="demo-results"><h4>Grounding by Section</h4><div class="demo-result-grid">' + groundedAnswer.sectionSummaries.map((summary: RAGGroundedAnswerSectionSummary) => `<article class="demo-result-item demo-grounding-card"><h3>${escapeHtml(summary.label)}</h3><p class="demo-result-source">${escapeHtml(summary.summary)}</p>${formatGroundedAnswerSectionSummaryDetails(summary).map((line) => `<p class="demo-metadata">${escapeHtml(line)}</p>`).join("")}<p class="demo-result-text">${escapeHtml(formatGroundedAnswerSectionSummaryExcerpt(summary))}</p></article>`).join('') + '</div></div>'
        : '',
      groundingReferences.length > 0
        ? '<div class="demo-results"><h4>Grounding Reference Map</h4><p class="demo-metadata">Each reference resolves answer citations back to concrete evidence with page, sheet, slide, archive, or thread context when available.</p><div class="demo-result-grid">' + buildGroundingReferenceGroups(groundingReferences).map((group) => `<article class="demo-result-item" id="${escapeHtml(group.targetId)}"><h3>${escapeHtml(group.label)}</h3><p class="demo-result-source">${escapeHtml(group.summary)}</p><div class="demo-result-grid">${group.references.map((reference) => `<article class="demo-result-item demo-grounding-card"><p class="demo-citation-badge">[${String(reference.number)}] ${escapeHtml(formatGroundingReferenceLabel(reference))}</p><p class="demo-result-score">${escapeHtml(formatGroundingReferenceSummary(reference))}</p>${formatGroundingReferenceDetails(reference).map((line) => `<p class="demo-metadata">${escapeHtml(line)}</p>`).join("")}<p class="demo-result-text">${escapeHtml(formatGroundingReferenceExcerpt(reference))}</p></article>`).join('')}</div></article>`).join('') + '</div></div>'
        : '',
    ].join('');
  },
  complete: (usage, durationMs, model) => {
    latestRetrievedSources = [];

    const details = [
      model,
      usage ? `${usage.inputTokens} in / ${usage.outputTokens} out` : undefined,
      typeof durationMs === 'number' ? formatDuration(durationMs) : undefined,
    ].filter(Boolean);

    return [
      renderIdleWorkflowSummary(),
      '<div class="demo-stream-block">',
      '<h4>Status</h4>',
      renderStageRow('complete'),
      `<p class="demo-metadata">${escapeHtml(details.length > 0 ? details.join(' · ') : 'Complete')}</p>`,
      '</div>',
      renderIdleStreamQueryField(),
      renderIdleStreamControls(),
    ].join('');
  },
  thinking: (text) => [
    '<details class="demo-stream-block">',
    '<summary>Thinking</summary>',
    `<p class="demo-result-text">${escapeHtml(text)}</p>`,
    '</details>',
  ].join(''),
  toolRunning: (name) =>
    `<div class="demo-stream-block"><h4>Tool</h4><p class="demo-metadata">Running ${escapeHtml(name)}...</p></div>`,
  toolComplete: (name, result) =>
    `<details class="demo-stream-block"><summary>Tool complete: ${escapeHtml(name)}</summary><pre class="demo-result-text">${escapeHtml(result)}</pre></details>`,
  canceled: () => {
    latestRetrievedSources = [];

    return [
    renderIdleWorkflowSummary(),
    '<div class="ai-canceled">Canceled.</div>',
    renderIdleStreamQueryField(),
    renderIdleStreamControls(),
  ].join('');
  },
  error: (message) => {
    latestRetrievedSources = [];

    return [
    renderIdleWorkflowSummary(),
    '<div class="demo-stream-block">',
    `<p class="demo-error">${escapeHtml(message)}</p>`,
    '</div>',
    renderIdleStreamQueryField(),
    renderIdleStreamControls(),
  ].join('');
  },
});
};

export const createHtmxWorkflowRenderConfig = (
  ragPath: string,
): RAGHTMXWorkflowRenderConfig =>
  createRAGHTMXWorkflowRenderConfig({
    status: ({ status, capabilities, documents }) => {
      if (!status) {
        return '<p class="demo-error">No backend status is available.</p>';
      }

      return [
        '<div class="demo-htmx-status">',
        '<dl class="demo-stat-grid">',
        `<div><dt>Backend</dt><dd>${escapeHtml(status.backend)}</dd></div>`,
        `<div><dt>Vector mode</dt><dd>${escapeHtml(status.vectorMode)}</dd></div>`,
        `<div><dt>Embedding dimensions</dt><dd>${status.dimensions ?? 'n/a'}</dd></div>`,
        `<div><dt>Vector acceleration</dt><dd>${status.native?.active ? 'active' : 'inactive'}</dd></div>`,
        `<div><dt>Native source</dt><dd>${escapeHtml(renderNativeSource(status))}</dd></div>`,
        `<div><dt>Documents</dt><dd>${documents?.total ?? 'n/a'}</dd></div>`,
        `<div><dt>Total chunks</dt><dd>${documents?.chunkCount ?? 'n/a'}</dd></div>`,
        `<div><dt>Seed docs</dt><dd>${documents?.byKind.seed ?? 0}</dd></div>`,
        `<div><dt>Custom docs</dt><dd>${documents?.byKind.custom ?? 0}</dd></div>`,
        `<div><dt>Reranker</dt><dd>${escapeHtml(DEMO_RERANKER_LABEL)}</dd></div>`,
        '</dl>',
        `<p class="demo-note">${escapeHtml(renderStatusSummary(status))}</p>`,
        `<p class="demo-metadata">${escapeHtml(renderStatusMessage(status))}</p>`,
        `<p class="demo-metadata">${escapeHtml(DEMO_RERANKER_SUMMARY)}</p>`,
        renderCapabilities(capabilities),
        '</div>',
      ].join('');
    },
    searchResults: ({ query, results, trace }) => {
      const traceSummary = renderTracePanel({
        summary: "This is the first-class retrieval trace from AbsoluteJS. It shows how the query was transformed, which retrieval stages ran, and how many candidates survived each step.",
        title: "Retrieval Trace",
        trace,
      });

      if (results.length === 0) {
        return [
          '<div class="demo-results">',
          `<p id="search-count">0 results for “${escapeHtml(query)}”</p>`,
          '<div class="demo-result-grid"><p>No matching chunks.</p></div>',
          '</div>',
          traceSummary,
        ].join('');
      }

      const response = buildSearchResponse(query, {}, results, 0, trace);
      const sectionGroups = buildSearchSectionGroups(response);

      return [
        '<div class="demo-results">',
        `<p id="search-count">${results.length} results for “${escapeHtml(query)}”</p>`,
        '<p class="demo-metadata">Reranking is active: AbsoluteJS reorders the first vector hits with the built-in heuristic provider before these results render.</p>',
        response.storyHighlights.length > 0 ? `<div class="demo-results"><h3>Retrieval Story</h3>${response.storyHighlights.map((line) => `<p class="demo-metadata">${escapeHtml(line)}</p>`).join("")}</div>` : "",
        response.attributionOverview.length > 0 ? `<div class="demo-results"><h3>Attribution Overview</h3>${response.attributionOverview.map((line) => `<p class="demo-metadata">${escapeHtml(line)}</p>`).join("")}</div>` : "",
        response.sectionDiagnostics.length > 0 ? `<div class="demo-results"><h3>Section Diagnostics</h3><div class="demo-result-grid">${response.sectionDiagnostics.map((diagnostic) => renderSectionDiagnosticCard(diagnostic)).join("")}</div></div>` : "",
        '<div class="demo-result-grid">',
        sectionGroups
          .map(
            (group) => `
              <article class="demo-result-item" id="${escapeHtml(group.targetId)}">
                <h3>${escapeHtml(group.label)}</h3>
                <p class="demo-result-source">${escapeHtml(group.summary)}</p>
                ${group.jumps.length > 0 ? `<div class="demo-badge-row">${group.jumps.map((jump) => `<a class="demo-state-chip" href="#${escapeHtml(jump.targetId)}">${escapeHtml(jump.label)}</a>`).join("")}</div>` : ""}
                <div class="demo-result-grid">
                  ${group.chunks.map((result) => `
                    <article class="demo-result-item" id="${escapeHtml(result.targetId)}">
                      <h4>${escapeHtml(result.title ?? result.chunkId)}</h4>
                      <p class="demo-result-source">${escapeHtml(result.source ?? 'unknown source')}</p>
                      <p class="demo-metadata">score ${formatScore(result.score)}</p>
                      ${[result.labels?.contextLabel, result.labels?.locatorLabel, result.labels?.provenanceLabel].filter(Boolean).map((line) => `<p class="demo-metadata">${escapeHtml(String(line))}</p>`).join("")}
                      ${formatDemoMetadataSummary(result.metadata).map((line) => `<p class="demo-metadata">${escapeHtml(line)}</p>`).join("")}
                      <p class="demo-result-text">${escapeHtml(result.text)}</p>
                    </article>`).join("")}
                </div>
              </article>`,
          )
          .join(''),
        '</div>',
        traceSummary,
        '</div>',
      ].join('');
    },
    documents: ({ documents }) => {
      if (documents.length === 0) {
        return '<ul class="demo-document-list"><li>No documents yet.</li></ul>';
      }

      return [
        '<ul class="demo-document-list">',
        documents
          .map((doc) => {
            const inspectUrl = `${ragPath}/documents/${encodeURIComponent(doc.id)}/chunks`;
            const deleteButton =
              doc.kind === 'custom'
                ? `
                  <button
                    type="button"
                    hx-delete="${escapeHtml(`${ragPath}/documents/${encodeURIComponent(doc.id)}`)}"
                    hx-target="#mutation-status"
                    hx-swap="innerHTML"
                    hx-confirm="Delete ${escapeHtml(doc.title)}?"
                  >delete</button>`
                : '';

            const mode = escapeHtml(ragPath.split('/').pop() ?? 'sqlite-native');
            const searchBySourceVals = escapeHtml(JSON.stringify({
              query: `Source search for ${doc.source}` ,
              source: doc.source,
              topK: 6,
            }));
            const searchByDocumentVals = escapeHtml(JSON.stringify({
              query: `Explain ${doc.title}` ,
              documentId: doc.id,
              topK: 6,
            }));

            return `
              <li class="demo-document-row">
                <div>
                  <strong>${escapeHtml(doc.title)}</strong>
                  <p>${escapeHtml(doc.id)}</p>
                  <p>source: ${escapeHtml(doc.source)} · kind: ${escapeHtml(doc.kind ?? 'unknown')}</p>
                  <p>${escapeHtml(doc.format ?? 'text')} · ${escapeHtml(doc.chunkStrategy ?? 'paragraphs')} · target size ${doc.chunkSize ?? 0}</p>
                  <p>chunks: ${doc.chunkCount ?? 0}</p>
                  ${formatDemoMetadataSummary(doc.metadata).map((line) => `<p class="demo-metadata">${escapeHtml(line)}</p>`).join("")}
                </div>
                <div class="demo-actions">
                  <button
                    type="button"
                    hx-get="${escapeHtml(inspectUrl)}"
                    hx-target="#chunk-preview-body"
                    hx-swap="innerHTML"
                  >Inspect chunks</button>
                  <button
                    type="button"
                    hx-post="/demo/message/${mode}/search"
                    hx-vals='${searchBySourceVals}'
                    hx-target="#search-results"
                    hx-swap="innerHTML"
                    hx-on::after-request="document.getElementById('search-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })"
                  >Search source</button>
                  <button
                    type="button"
                    hx-post="/demo/message/${mode}/search"
                    hx-vals='${searchByDocumentVals}'
                    hx-target="#search-results"
                    hx-swap="innerHTML"
                    hx-on::after-request="document.getElementById('search-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })"
                  >Search document</button>
                  ${deleteButton}
                </div>
              </li>`;
          })
          .join(''),
        '</ul>',
      ].join('');
    },
    chunkPreview: (preview) => [
      '<div class="demo-results">',
      `<p class="demo-metadata">${escapeHtml(preview.document.title)} · ${escapeHtml(preview.document.format ?? 'text')} · ${escapeHtml(preview.document.chunkStrategy ?? 'paragraphs')} · ${preview.chunks.length} chunk(s)</p>`,
      '<article class="demo-result-item">',
      '<h3>Normalized text</h3>',
      `<p class="demo-result-text">${escapeHtml(preview.normalizedText)}</p>`,
      '</article>',
      '<div class="demo-result-grid">',
      preview.chunks
        .map(
          (chunk) => `
            <article class="demo-result-item">
              <h3>${escapeHtml(chunk.chunkId)}</h3>
              <p class="demo-result-source">source: ${escapeHtml(chunk.source ?? preview.document.source)}</p>
              <p class="demo-metadata">chunk index: ${String((chunk.metadata?.chunkIndex as number | undefined) ?? 0)} / count: ${String((chunk.metadata?.chunkCount as number | undefined) ?? preview.chunks.length)}</p>
              <p class="demo-result-text">${escapeHtml(chunk.text)}</p>
            </article>`,
        )
        .join(''),
      '</div>',
      '</div>',
    ].join(''),
    evaluateResult: ({ cases, summary }) => [
      '<div class="demo-results">',
      '<h3>Benchmark Retrieval</h3>',
      '<p class="demo-metadata">This section runs the built-in benchmark suite through the server-side HTMX workflow so you can compare expected, retrieved, and missing evidence without client state.</p>',
      `<div class="demo-badge-row">${benchmarkOutcomeRail.map((entry) => `<span class="demo-state-chip" title="${escapeHtml(entry.summary)}">${escapeHtml(entry.label)}</span>`).join("")}</div>`,
      renderEvaluationResults(cases, summary),
      '</div>',
    ].join(''),
    mutationResult: (result) => {
      if (!result.ok) {
        return [
          `<div class="demo-results"><p class="demo-error">${escapeHtml(result.error ?? 'Request failed')}</p><p class="demo-metadata">No demo surfaces were refreshed because the mutation failed.</p></div>`,
          renderMutationRefreshes(),
        ].join('');
      }

      const summary = result.deleted
        ? `Deleted ${result.deleted}`
        : result.inserted
          ? `Indexed ${result.inserted}`
          : result.status
            ? result.status
            : 'Request complete';

      return [
        '<div class="demo-results">',
        `<p class="demo-banner">${escapeHtml(summary)}</p>`,
        '<ul class="demo-detail-list">',
        '<li>Diagnostics and indexed sources refresh automatically on this route.</li>',
        '<li>Knowledge base operations refresh automatically after mutations.</li>',
        '<li>Use the document row search actions to immediately verify source-scoped retrieval.</li>',
        '</ul>',
        '</div>',
        renderMutationRefreshes(),
      ].join('');
    },
    error: (message) => `<p class="demo-error">${escapeHtml(message)}</p>`,
  });

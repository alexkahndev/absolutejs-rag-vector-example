import { FormsModule } from "@angular/forms";
import { ChangeDetectorRef, Component, inject } from "@angular/core";
import { RAGClientService, RAGWorkflowService } from "@absolutejs/absolute/angular/ai";
import { buildRAGEvaluationLeaderboard, runRAGEvaluationSuite } from "@absolutejs/absolute/ai/client";
import type { RAGEvaluationLeaderboardEntry, RAGEvaluationResponse, RAGEvaluationSuiteRun } from "@absolutejs/absolute";
import { createRAGClient } from "@absolutejs/absolute/ai/client";
import {
  type AddFormState,
  type DemoActiveRetrievalState,
  type DemoAIModelCatalogResponse,
  type DemoRetrievalQualityResponse,
  type DemoBackendDescriptor,
  type DemoBackendMode,
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

const initialSearchForm: SearchFormState = {
  query: "",
  topK: 6,
  scoreThreshold: "",
  kind: "",
  source: "",
  documentId: "",
};

type AngularRAGVectorDemoProps = {
  availableBackends?: DemoBackendDescriptor[];
  mode: DemoBackendMode;
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
const formatCitationNumbers = (values: number[]) => values.map((value) => `[${value}]`).join(" ");
const savedEvaluationSuite = buildDemoEvaluationSuite();


@Component({
  imports: [FormsModule],
  selector: "angular-rag-vector-demo",
  standalone: true,
  template: `
    <div class="rag-demo-page">
      <header>
        <div class="header-left">
          <a class="logo" href="/">
            <img src="/assets/png/absolutejs-temp.png" height="24" alt="AbsoluteJS" />
            AbsoluteJS
          </a>
        </div>
        <nav>
          @for (backend of backendOptions; track backend.id) {<div class="demo-nav-row">
            <span [class]="backend.id === selectedMode ? 'demo-nav-row-label active' : 'demo-nav-row-label'">{{ backend.label }}</span>
            @for (framework of demoFrameworks; track framework.id) {<a [href]="backend.available ? getDemoPagePath(framework.id, backend.id) : null" [class.active]="framework.id === 'angular' && backend.id === selectedMode" [class.disabled]="!backend.available" [attr.aria-disabled]="!backend.available" [attr.title]="backend.available ? null : backend.reason">{{ framework.label }}</a>}
          </div>}
        </nav>
      </header>

      <main class="demo-layout">
        <section class="demo-card">
          <span class="demo-hero-kicker">Angular workflow surface</span>
          <h1>AbsoluteJS RAG Workflow Demo - Angular</h1>
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
          @if (message) {<p class="demo-banner">{{ message }}</p>}
          @if (loading) {<p class="demo-banner">Loading status and documents...</p>}
          @if (restoredSharedState) {<p class="demo-banner">{{ restoredSharedStateSummary }}</p>}
        </div>
        @if (status) {<section class="demo-grid">
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
            
            @if (status.native.fallbackReason) {<p class="demo-metadata">{{ status.native.fallbackReason }}</p>}
            <p class="demo-metadata">{{ status.reranker.summary }}</p>
            <p class="demo-metadata">
              Backend capabilities: <strong>{{ status.capabilities.join(" · ") }}</strong>
            </p>
            @if (ops) {<div class="demo-results">
              <h3>Knowledge Base Operations</h3>
              <ul class="demo-detail-list">
                @for (line of formatReadinessSummary(ops.readiness); track line) {<li>{{ line }}</li>}
              </ul>
              <ul class="demo-detail-list">
                @for (line of formatHealthSummary(ops.health); track line) {<li>{{ line }}</li>}
              </ul>
              <ul class="demo-detail-list">
                @for (line of formatFailureSummary(ops.health); track line) {<li>{{ line }}</li>}
              </ul>
              <div class="demo-result-grid">
                <article class="demo-result-item">
                  <h4>Sync Sources</h4>
                  <div class="demo-actions">
                    <button (click)="syncAllSources()" type="button">Sync all sources</button>
                    <button (click)="queueBackgroundSync()" type="button">Queue background sync</button>
                  </div>
                  <div class="demo-badge-row">
                    @for (chip of syncDeltaChips; track chip) {<span class="demo-state-chip">{{ chip.replace(/^sync /, "") }}</span>}
                  </div>
                  <div class="demo-stat-grid">
                    @for (line of syncOverviewLines; track line) {<article class="demo-stat-card"><span class="demo-stat-label">Sync overview</span><strong>{{ line.includes(':') ? line.slice(0, line.indexOf(':')) : 'Sync overview' }}</strong><p>{{ line.includes(':') ? line.slice(line.indexOf(':') + 1).trim() : line }}</p></article>}
                  </div>
                  <ul class="demo-detail-list">
                    @for (line of syncSourceLines; track line) {<li>{{ line }}</li>}
                  </ul>
                  <div class="demo-actions">
                    @for (source of syncSources; track source.id) {
                      <details [attr.open]="source.status === 'failed' ? '' : null" [class.demo-sync-action-failed]="source.status === 'failed'" class="demo-sync-action-details">
                        <summary>{{ source.collapsedSummary }}</summary>
                        <div class="demo-sync-action-group">
                          <div class="demo-actions">
                            <button (click)="syncSource(source.id)" type="button">Sync {{ source.label }}</button>
                            <button (click)="queueBackgroundSourceSync(source.id)" type="button">Queue {{ source.label }}</button>
                            @if (source.status === 'failed') {
                              <button (click)="syncSource(source.id)" type="button">Retry now</button>
                              <button (click)="queueBackgroundSourceSync(source.id)" type="button">Retry in background</button>
                            }
                          </div>
                          <p class="demo-metadata demo-sync-action-meta">{{ source.summary }}</p>
                          @if (source.badges.length > 0) {<div class="demo-badge-row">
                            @for (badge of source.badges; track badge) {<span class="demo-badge">{{ badge }}</span>}
                          </div>}
                        </div>
                      </details>
                    }
                  </div>
                </article>
                <article class="demo-result-item">
                  <h4>Admin Jobs</h4>
                  <ul class="demo-detail-list">
                    @for (line of adminJobLines; track line) {<li>{{ line }}</li>}
                  </ul>
                </article>
                <article class="demo-result-item">
                  <h4>Recent Admin Actions</h4>
                  <ul class="demo-detail-list">
                    @for (line of adminActionLines; track line) {<li>{{ line }}</li>}
                  </ul>
                </article>
              </div>
            </div>}
            <div class="demo-actions">
              <button (click)="reseed()" type="button">Re-seed defaults</button>
              <button (click)="resetCustom()" type="button">Reset custom docs</button>
              <button (click)="refreshData()" type="button">Refresh</button>
            </div>
          </article>

          <article class="demo-card">
            <h2>Retrieve And Verify</h2>
            <p class="demo-metadata">
              This section is powered by the AbsoluteJS Angular RAG primitives. Run a query,
              then confirm the returned chunk text and source label match the indexed source list below.
            </p>
            <div class="demo-preset-grid">
              <button type="button" (click)="runPresetSearch('How do metadata filters change retrieval quality?', { kind: 'seed' }, 'preset: filter behavior', 'filter-behavior')">
                Filter behavior
              </button>
              <button type="button" (click)="runPresetSearch('What should I verify after ingesting a new source?', {}, 'preset: verify ingestion', 'verify-ingestion')">
                Verify ingestion
              </button>
              <button type="button" (click)="runPresetSearch('List support policies for shipping and returns.', { source: 'guide/demo.md' }, 'preset: source filter', 'source-filter')">
                Source filter
              </button>
              <button type="button" (click)="runPresetSearch('Why should metadata be stable?', { source: 'guides/metadata.md' }, 'preset: metadata discipline', 'metadata-discipline')">
                Metadata discipline
              </button>
            </div>
            <form class="demo-search-form" (submit)="submitSearch($event)">
              <label for="query">Query</label>
              <input
                id="query"
                name="query"
                [(ngModel)]="searchForm.query"
                [ngModelOptions]="{ standalone: true }"
                placeholder="e.g. How do metadata filters work?"
                required
                type="text"
              />

              <label for="topK">Top K</label>
              <input
                id="topK"
                max="20"
                min="1"
                name="topK"
                [(ngModel)]="searchForm.topK"
                [ngModelOptions]="{ standalone: true }"
                type="number"
              />

              <label for="scoreThreshold">Minimum score (0-1)</label>
              <input
                id="scoreThreshold"
                name="scoreThreshold"
                [(ngModel)]="searchForm.scoreThreshold"
                [ngModelOptions]="{ standalone: true }"
                placeholder="optional"
                type="number"
                step="0.01"
                min="0"
                max="1"
              />

              <label for="kind">Kind filter</label>
              <select
                id="kind"
                name="kind"
                [(ngModel)]="searchForm.kind"
                [ngModelOptions]="{ standalone: true }"
              >
                <option value="">Any</option>
                <option value="seed">Seed</option>
                <option value="custom">Custom</option>
              </select>

              <label for="source">Source filter</label>
              <input
                [class.demo-filter-active]="searchForm.source.trim().length > 0"
                id="source"
                name="source"
                [(ngModel)]="searchForm.source"
                (ngModelChange)="scopeDriver = 'manual filters'"
                [ngModelOptions]="{ standalone: true }"
                placeholder="e.g. guide/demo.md"
                type="text"
              />

              <label for="documentId">Document ID filter</label>
              <input
                [class.demo-filter-active]="searchForm.documentId.trim().length > 0"
                id="documentId"
                name="documentId"
                [(ngModel)]="searchForm.documentId"
                (ngModelChange)="scopeDriver = 'manual filters'"
                [ngModelOptions]="{ standalone: true }"
                placeholder="e.g. rag-demo"
                type="text"
              />

              <button type="submit">Search index</button>
            </form>
            <div class="demo-results">
              <h3>Active Retrieval Scope</h3>
              <div class="demo-badge-row">
                <span class="demo-state-chip">{{ retrievalScopeSummary }}</span>
                <span class="demo-state-chip">Changed by: {{ scopeDriver.replace(/^row action: /, 'row action · ') }}</span>
                <span class="demo-state-chip">Results: {{ searchResults?.count ?? 0 }}</span>
              </div>
              <p class="demo-metadata">{{ retrievalScopeHint }}</p>
              <div class="demo-actions">
                <button [disabled]="searchForm.query.trim().length === 0 && searchForm.source.trim().length === 0 && searchForm.documentId.trim().length === 0 && searchForm.kind.length === 0" (click)="clearRetrievalScope()" type="button">Clear scope</button>
                <button [disabled]="searchForm.query.trim().length === 0" (click)="rerunLastQuery()" type="button">Rerun query</button>
                <button (click)="clearAllRetrievalState()" type="button">Clear search</button>
              </div>
              @if (recentQueries.length > 0) {<p class="demo-section-caption">Recent Searches</p><div class="demo-badge-row">
                @for (entry of recentQueries; track entry.label + entry.state.source + entry.state.documentId + entry.state.kind) {<button class="demo-state-chip" (click)="rerunRecentQuery(entry.state)" type="button">{{ entry.label }}</button>}
              </div>}
            </div>

            @if (searchError) {<div class="demo-error">{{ searchError }}</div>}
            @if (searchResults) {<div class="demo-results">
              <p>
                {{ searchResults.count }} results for “{{ searchResults.query }}” in
                {{ searchResults.elapsedMs }}ms
              </p>
              <p class="demo-metadata">{{ retrievalScopeSummary }}</p>
              <p class="demo-metadata">Scope changed by: {{ scopeDriver }}</p>
              <p class="demo-metadata">
                Reranking is active: AbsoluteJS reorders the first vector hits with the built-in heuristic provider before these results render.
              </p>
              <p class="demo-metadata">
                Verification rule: a good result shows chunk text that answers the
                query and a source label you can trace back to the indexed source list.
              </p>
              <div class="demo-result-grid">
                @for (chunk of searchResults.chunks; track chunk.chunkId) {<article class="demo-result-item">
                  <h3>{{ chunk.title }}</h3>
                  <p class="demo-result-score">score: {{ formatScore(chunk.score) }}</p>
                  <p class="demo-result-source">source: {{ chunk.source }}</p>
                  @for (line of formatDemoMetadataSummary(chunk.metadata); track line) {<p class="demo-metadata">{{ line }}</p>}
                  <p class="demo-result-text">{{ chunk.text }}</p>
                </article>}
              </div>
            </div>}

            <div class="demo-results">
              <h3>Benchmark Retrieval</h3>
              <p class="demo-metadata">
                This section uses the Angular RAG client service to run a built-in benchmark suite. Each case names the source we expect retrieval to surface so you can compare expected, retrieved, and missing evidence directly.
              </p>
              <div class="demo-preset-grid">
                @for (preset of demoEvaluationPresets; track preset.id) {<button
                  type="button"
                  [title]="preset.description"
                  (click)="runPresetSearch(preset.query, { source: preset.expectedSources[0] }, 'benchmark preset: ' + preset.label, preset.id)"
                >
                  {{ preset.label }}
                </button>}
              </div>
              <div class="demo-actions">
                <button type="button" [disabled]="evaluationRunning" (click)="runEvaluation()">
                  {{ evaluationRunning ? "Running benchmark suite..." : "Run benchmark suite" }}
                </button>
              </div>
              @if (evaluationMessage) {<p class="demo-metadata">{{ evaluationMessage }}</p>}
              @if (evaluationError) {<div class="demo-error">{{ evaluationError }}</div>}
              @if (evaluation) {
                <p class="demo-metadata">Benchmark summary: {{ formatEvaluationSummary(evaluation) }}</p>
                <div class="demo-result-grid">
                  @for (entry of evaluation.cases; track entry.caseId) {<article class="demo-result-item demo-evaluation-card" [class.demo-evaluation-pass]="entry.status === 'pass'" [class.demo-evaluation-partial]="entry.status === 'partial'" [class.demo-evaluation-fail]="entry.status === 'fail'">
                    <h4>{{ entry.label ?? entry.caseId }}</h4>
                    <p class="demo-result-source">{{ entry.query }}</p>
                    <p class="demo-evaluation-status">{{ entry.status.toUpperCase() }}</p>
                    <p class="demo-metadata">{{ formatEvaluationCaseSummary(entry) }}</p>
                    <p class="demo-metadata">expected: {{ formatEvaluationExpected(entry) }}</p>
                    <p class="demo-metadata">retrieved: {{ formatEvaluationRetrieved(entry) }}</p>
                    <p class="demo-result-text">missing: {{ formatEvaluationMissing(entry) }}</p>
                  </article>}
                </div>
              }
            </div>

            <div class="demo-results">
              <h3>Retrieval Quality Tooling</h3>
              <p class="demo-metadata">This section uses the saved evaluation suite plus first-class retrieval-strategy, reranker comparison, and persisted benchmark history primitives. The suite stays registered in the page state, the leaderboard ranks prior suite runs, and the history cards call out the latest benchmark drift for each strategy.</p>
              <ul class="demo-detail-list">
                <li>{{ savedEvaluationSuite.label ?? savedEvaluationSuite.id }} · {{ savedEvaluationSuite.input.cases.length }} case(s) · {{ savedEvaluationSuite.description }}</li>
              </ul>
              <div class="demo-actions">
                <button [disabled]="evaluationRunning" (click)="runSavedSuite()" type="button">{{ evaluationRunning ? "Running saved suite..." : "Run saved suite" }}</button>
              </div>
              <div class="demo-result-grid">
                <article class="demo-result-item">
                  <h4>Suite leaderboard</h4>
                  <ul class="demo-detail-list">
                    @for (line of evaluationLeaderboardLines; track line) {<li>{{ line }}</li>}
                  </ul>
                </article>
                <article class="demo-result-item">
                  <h4>Quality winners</h4>
                  <ul class="demo-detail-list">
                    @for (line of qualitySummaryLines; track line) {<li>{{ line }}</li>}
                  </ul>
                </article>
              </div>
              @if (qualityData) {<div class="demo-result-grid">
                @for (entry of qualityData.retrievalComparison.entries; track entry.retrievalId) {<article class="demo-result-item">
                  <h4>{{ entry.label }}</h4>
                  <p class="demo-metadata">{{ formatRetrievalComparisonEntry(entry) }}</p>
                </article>}
              </div>
              <div class="demo-result-grid">
                @for (entry of qualityData.rerankerComparison.entries; track entry.rerankerId) {<article class="demo-result-item">
                  <h4>{{ entry.label }}</h4>
                  <p class="demo-metadata">{{ formatRerankerComparisonEntry(entry) }}</p>
                </article>}
              </div>
              <div class="demo-result-grid">
                @for (entry of qualityData.groundingEvaluation.cases; track entry.caseId) {<article class="demo-result-item">
                  <h4>{{ entry.label ?? entry.caseId }}</h4>
                  <p class="demo-metadata">{{ formatGroundingEvaluationCase(entry) }}</p>
                  <ul class="demo-detail-list">
                    @for (line of formatGroundingEvaluationDetails(entry); track line) {<li>{{ line }}</li>}
                  </ul>
                </article>}
              </div>
              @if (qualityData.providerGroundingComparison) {<div class="demo-result-grid">
                @for (entry of qualityData.providerGroundingComparison.entries; track entry.providerKey) {<article class="demo-result-item">
                  <h4>{{ entry.label }}</h4>
                  <p class="demo-metadata">{{ formatGroundingProviderEntry(entry) }}</p>
                </article>}
              </div>}
              @if (qualityData.providerGroundingComparison) {<div class="demo-result-grid">
                @for (entry of qualityData.providerGroundingComparison.entries; track entry.providerKey) {<article class="demo-result-item">
                  <h4>{{ entry.label }} history</h4>
                  <ul class="demo-detail-list">
                    @for (line of getGroundingHistoryLines(qualityData.providerGroundingHistories[entry.providerKey]); track line) {<li>{{ line }}</li>}
                  </ul>
                </article>}
              </div>}
              @if (qualityData.providerGroundingComparison) {<div class="demo-result-grid">
                @for (entry of qualityData.providerGroundingComparison.entries; track entry.providerKey) {<article class="demo-result-item">
                  <h4>{{ entry.label }} artifact trail</h4>
                  <ul class="demo-detail-list">
                    @for (line of getGroundingArtifactTrailLines(qualityData.providerGroundingHistories[entry.providerKey]); track line) {<li>{{ line }}</li>}
                  </ul>
                </article>}
              </div>}
              @if (qualityData.providerGroundingComparison) {<div class="demo-result-grid">
                <article class="demo-result-item">
                  <h4>Hardest grounding cases</h4>
                  <ul class="demo-detail-list">
                    @for (line of getGroundingDifficultyLines(qualityData.providerGroundingComparison.difficultyLeaderboard); track line) {<li>{{ line }}</li>}
                  </ul>
                </article>
                <article class="demo-result-item">
                  <h4>Grounding difficulty history</h4>
                  <ul class="demo-detail-list">
                    @for (line of getGroundingDifficultyHistoryLines(qualityData.providerGroundingDifficultyHistory); track line) {<li>{{ line }}</li>}
                  </ul>
                </article>
              </div>}
              @if (qualityData.providerGroundingComparison) {<div class="demo-result-grid">
                @for (entry of qualityData.providerGroundingComparison.caseComparisons; track entry.caseId) {<article class="demo-result-item">
                  <h4>{{ entry.label }}</h4>
                  <ul class="demo-detail-list">
                    @for (line of getGroundingProviderCaseLines(entry); track line) {<li>{{ line }}</li>}
                  </ul>
                </article>}
              </div>}
              <div class="demo-result-grid">
                @for (entry of qualityData.retrievalComparison.entries; track entry.retrievalId) {<article class="demo-result-item">
                  <h4>{{ entry.label }} history</h4>
                  <ul class="demo-detail-list">
                    @for (line of getBenchmarkHistoryLines(qualityData.retrievalHistories[entry.retrievalId]); track line) {<li>{{ line }}</li>}
                  </ul>
                </article>}
              </div>
              <div class="demo-result-grid">
                @for (entry of qualityData.rerankerComparison.entries; track entry.rerankerId) {<article class="demo-result-item">
                  <h4>{{ entry.label }} history</h4>
                  <ul class="demo-detail-list">
                    @for (line of getBenchmarkHistoryLines(qualityData.rerankerHistories[entry.rerankerId]); track line) {<li>{{ line }}</li>}
                  </ul>
                </article>}
              </div>}
            </div>

            <div class="demo-stream-panel">
              <h3>Stream Retrieval Workflow</h3>
              <p class="demo-metadata">
                This page uses <code>RAGClientService</code> for the broader demo, and this stream section proves the canonical <code>RAGWorkflowService</code> contract directly.
              </p>
              <form class="demo-stream-form" (submit)="submitStreamQuery($event)">
                <label for="streamModelKey">Answer model</label>
                <select id="streamModelKey" name="streamModelKey" [(ngModel)]="selectedAIModelKey" [ngModelOptions]="{ standalone: true }">
                  @if (aiModelCatalog.models.length === 0) {<option value="">Configure an AI provider</option>}
                  @for (model of aiModelCatalog.models; track model.key) {<option [value]="model.key">{{ formatDemoAIModelLabel(model) }}</option>}
                </select>
                <p class="demo-metadata">Model switching stays on the official AbsoluteJS plugin path by selecting the provider and model sent with the retrieval stream request.</p>
                <label for="streamQuery">Question</label>
                <input id="streamQuery" name="streamQuery" [(ngModel)]="streamPrompt" [ngModelOptions]="{ standalone: true }" placeholder="e.g. What should I verify after ingesting a new source?" type="text" />
                <div class="demo-actions">
                  @if (!isStreamBusy()) {<button type="submit">Ask with retrieval stream</button>}
                  @if (isStreamBusy()) {<button type="button" (click)="transport.cancel()">Cancel</button>}
                </div>
              </form>
              <div class="demo-result-grid">
                <article class="demo-result-item">
                  <h4>Workflow Contract</h4>
                  <ul class="demo-detail-list">
                    <li>Canonical entry point: RAGWorkflowService</li>
                    <li>Connected page surface: transport</li>
                    <li>Snapshot stage: {{ transport.state().stage }}</li>
                    <li>Live stage field: {{ transport.workflow().stage }}</li>
                    <li>Snapshot sources: {{ transport.state().sources.length }}</li>
                    <li>Snapshot running: {{ transport.state().isRunning ? "yes" : "no" }}</li>
                  </ul>
                </article>
                <article class="demo-result-item">
                  <h4>Workflow Proof</h4>
                  <ul class="demo-detail-list">
                    <li>Retrieved: {{ transport.state().hasRetrieved ? "yes" : "no" }}</li>
                    <li>Has sources: {{ transport.state().hasSources ? "yes" : "no" }}</li>
                    <li>Citation count: {{ transport.workflow().citations.length }}</li>
                    <li>Grounding coverage: {{ transport.workflow().groundedAnswer.coverage }}</li>
                  </ul>
                </article>
              </div>
              <div class="demo-stage-row">
                @for (stage of streamStages; track stage) {<span class="{{ transport.workflow().stage === stage ? 'demo-stage-pill current' : 'demo-stage-pill' }} {{ isStreamStageComplete(stage, transport.workflow().stage) ? 'complete' : '' }}">{{ stage }}</span>}
              </div>
              @if (transport.workflow().retrieval) {<dl class="demo-stream-stats">
                <div><dt>Retrieval started</dt><dd>{{ transport.workflow().retrieval?.retrievalStartedAt ? formatDate(transport.workflow().retrieval?.retrievalStartedAt ?? 0) : 'n/a' }}</dd></div>
                <div><dt>Retrieval duration</dt><dd>{{ transport.workflow().retrieval?.retrievalDurationMs ?? 0 }}ms</dd></div>
                <div><dt>Retrieved sources</dt><dd>{{ transport.workflow().retrieval?.sources?.length ?? 0 }}</dd></div>
                <div><dt>Current stage</dt><dd>{{ transport.workflow().stage }}</dd></div>
              </dl>}
              @if (transport.workflow().error) {<div class="demo-error">{{ transport.workflow().error }}</div>}
              @if (transport.workflow().latestAssistantMessage?.thinking) {<div class="demo-stream-block">
                <h4>Thinking</h4>
                <p class="demo-result-text">{{ transport.workflow().latestAssistantMessage?.thinking }}</p>
              </div>}
              @if (transport.workflow().latestAssistantMessage?.content) {<div class="demo-stream-block">
                <h4>Answer</h4>
                <p class="demo-result-text">{{ transport.workflow().latestAssistantMessage?.content }}</p>
              </div>}
              @if (transport.workflow().latestAssistantMessage?.content) {<div class="demo-results">
                <h4>Answer Grounding</h4>
                <p [class]="'demo-grounding-badge demo-grounding-' + transport.workflow().groundedAnswer.coverage">{{ formatGroundingCoverage(transport.workflow().groundedAnswer.coverage) }}</p>
                <ul class="demo-detail-list">
                  @for (line of formatGroundingSummary(transport.workflow().groundedAnswer); track line) {<li>{{ line }}</li>}
                </ul>
                @if (transport.workflow().groundedAnswer.parts.some(isCitationPart)) {<div class="demo-result-grid">
                  @for (part of transport.workflow().groundedAnswer.parts; track $index) {
                    @if (part.type === 'citation') {<article class="demo-result-item demo-grounding-card">
                      <p class="demo-citation-badge">{{ formatGroundingPartReferences(part.referenceNumbers) }}</p>
                      @for (line of formatGroundedAnswerPartDetails(part); track line) {<p class="demo-metadata">{{ line }}</p>}
                      <p class="demo-result-text">{{ part.text }}</p>
                    </article>}
                  }
                </div>}
              </div>}
              @if (transport.workflow().groundingReferences.length > 0) {<div class="demo-results">
                <h4>Grounding Reference Map</h4>
                <p class="demo-metadata">
                  Each reference resolves answer citations back to concrete evidence with page, sheet, slide, archive, or thread context when available.
                </p>
                <div class="demo-result-grid">
                  @for (reference of transport.workflow().groundingReferences; track reference.chunkId) {<article class="demo-result-item demo-grounding-card">
                    <p class="demo-citation-badge">[{{ reference.number }}] {{ formatGroundingReferenceLabel(reference) }}</p>
                    <p class="demo-result-score">{{ formatGroundingReferenceSummary(reference) }}</p>
                    @for (line of formatGroundingReferenceDetails(reference); track line) {<p class="demo-metadata">{{ line }}</p>}
                    <p class="demo-result-text">{{ formatGroundingReferenceExcerpt(reference) }}</p>
                  </article>}
                </div>
              </div>}
              @if (transport.workflow().sourceSummaries.length > 0) {<div class="demo-results">
                <h4>Evidence Sources</h4>
                <div class="demo-result-grid">
                  @for (summary of transport.workflow().sourceSummaries; track summary.key) {<article class="demo-result-item">
                    <h3>{{ summary.label }}</h3>
                    @for (line of formatSourceSummaryDetails(summary); track line) {<p class="demo-metadata">{{ line }}</p>}
                    <p class="demo-result-text">{{ summary.excerpt }}</p>
                  </article>}
                </div>
              </div>}
              @if (transport.workflow().citations.length > 0) {<div class="demo-results">
                <h4>Citation Trail</h4>
                <p class="demo-metadata">
                  Each citation maps a concrete retrieved chunk to a stable reference number you can carry into the answer UI.
                </p>
                <div class="demo-result-grid">
                  @for (citation of transport.workflow().citations; track citation.chunkId; let index = $index) {<article class="demo-result-item demo-citation-card">
                    <p class="demo-citation-badge">[{{ index + 1 }}] {{ formatCitationLabel(citation) }}</p>
                    <p class="demo-result-score">{{ formatCitationSummary(citation) }}</p>
                    @for (line of formatCitationDetails(citation); track line) {<p class="demo-metadata">{{ line }}</p>}
                    <p class="demo-result-text">{{ formatCitationExcerpt(citation) }}</p>
                  </article>}
                </div>
              </div>}
            </div>
          </article>
        </section>}

        <section class="demo-grid">
          <article class="demo-card">
            <h2>Ingest Document</h2>
            <p class="demo-metadata">
              Add a document, choose its source format and chunking strategy, then verify how AbsoluteJS indexes it.
            </p>
            <div class="demo-results">
              <h3>Upload Extracted Fixtures</h3>
              <p class="demo-metadata">
                These buttons use the AbsoluteJS Angular client ingestUploads surface directly. Each fixture is fetched from the local demo corpus, sent through the published upload ingest route, and then verified with a retrieval query against the uploaded source path.
              </p>
              <p class="demo-metadata">
                Upload fixtures validate the extractor pipeline immediately. The managed document list below stays focused on authored example documents, while uploaded binaries are verified through retrieval.
              </p>
              <div class="demo-preset-grid">
                @for (preset of demoUploadPresets; track preset.id) {<button [disabled]="uploadRunning" [attr.title]="preset.description" (click)="ingestDemoUpload(preset)" type="button">{{ preset.label }}</button>}
              </div>
              <div class="demo-upload-row">
                <input [attr.accept]="supportedFileTypeOptions.slice(1).map((entry) => entry[0]).join(',')" type="file" (change)="onUploadFileChange($event)" />
                <button [disabled]="uploadRunning || selectedUploadFile === null" (click)="uploadSelectedDocumentFile()" type="button">Upload file</button>
              </div>
              @if (selectedUploadFile) {<p class="demo-metadata">Selected file: {{ selectedUploadFile.name }}</p>}
              @if (uploadError) {<div class="demo-error">{{ uploadError }}</div>}
            </div>
            <form class="demo-add-form" (submit)="submitAddDocument($event)">
              <label for="customId">Optional ID</label>
              <input id="customId" name="id" [(ngModel)]="addForm.id" [ngModelOptions]="{ standalone: true }" type="text" />

              <label for="customTitle">Title</label>
              <input id="customTitle" name="title" [(ngModel)]="addForm.title" [ngModelOptions]="{ standalone: true }" required type="text" />

              <label for="customSource">Source</label>
              <input id="customSource" name="source" [(ngModel)]="addForm.source" [ngModelOptions]="{ standalone: true }" required placeholder="e.g. onboarding-guide.md" type="text" />

              <label for="customFormat">Source format</label>
              <select id="customFormat" name="format" [(ngModel)]="addForm.format" [ngModelOptions]="{ standalone: true }">
                @for (format of demoContentFormats; track format) {<option [value]="format">{{ formatContentFormat(format) }}</option>}
              </select>

              <label for="customChunkStrategy">Chunking strategy</label>
              <select id="customChunkStrategy" name="chunkStrategy" [(ngModel)]="addForm.chunkStrategy" [ngModelOptions]="{ standalone: true }">
                @for (strategy of demoChunkingStrategies; track strategy) {<option [value]="strategy">{{ formatChunkStrategy(strategy) }}</option>}
              </select>

              <label for="customText">Text</label>
              <textarea id="customText" name="text" [(ngModel)]="addForm.text" [ngModelOptions]="{ standalone: true }" required rows="6"></textarea>

              <button type="submit">Ingest document and rebuild index</button>
            </form>
            @if (addError) {<div class="demo-error">{{ addError }}</div>}
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
              <input [ngModel]="documentSearchTerm" (ngModelChange)="onDocumentSearchTermChange($event)" [ngModelOptions]="{ standalone: true }" placeholder="Search indexed sources by title, source, or text" type="text" />
              <select [ngModel]="documentTypeFilter" (ngModelChange)="onDocumentTypeFilterChange($event)" [ngModelOptions]="{ standalone: true }">
                @for (entry of supportedFileTypeOptions; track entry[0]) {<option [value]="entry[0]">{{ entry[1] }}</option>}
              </select>
            </div>
            <div class="demo-pagination-row">
              <p class="demo-metadata">Showing {{ paginatedDocuments.length }} of {{ filteredDocuments.length }} matching documents</p>
              <div class="demo-pagination-controls">
                <button [disabled]="documentPage <= 1" (click)="setDocumentPage(documentPage - 1)" type="button">Prev</button>
                @for (pageNumber of documentPageNumbers; track pageNumber) {<button [class]="pageNumber === documentPage ? 'demo-page-button demo-page-button-active' : 'demo-page-button'" (click)="setDocumentPage(pageNumber)" type="button">{{ pageNumber }}</button>}
                <button [disabled]="documentPage >= totalDocumentPages" (click)="setDocumentPage(documentPage + 1)" type="button">Next</button>
              </div>
            </div>
            <div class="demo-document-list">
              @if (paginatedDocuments.length === 0) {<p class="demo-metadata">No indexed sources match the current filters.</p>}
              @if (paginatedDocuments.length > 0) {
                @for (doc of paginatedDocuments; track doc.id) {<details class="demo-document-item demo-document-collapsible">
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
                      <button type="button" (click)="inspectChunks(doc.id)">Inspect chunks</button>
                      <button type="button" (click)="runPresetSearch('Source search for ' + doc.source, { source: doc.source }, 'row action: source ' + doc.source)">Search source</button>
                      <button type="button" (click)="runPresetSearch('Explain ' + doc.title, { documentId: doc.id }, 'row action: document ' + doc.id)">Search document</button>
                      @if (doc.kind === "custom") {<button type="button" (click)="deleteDocument(doc.id)">Delete</button>}
                    </div>
                    <div class="demo-key-value-grid">
                      <div class="demo-key-value-row"><span>Source</span><strong>{{ doc.source }}</strong></div>
                      <div class="demo-key-value-row"><span>Created</span><strong>{{ formatDate(doc.createdAt) }}</strong></div>
                      <div class="demo-key-value-row"><span>Kind</span><strong>{{ doc.kind }}</strong></div>
                      <div class="demo-key-value-row"><span>Chunks</span><strong>{{ doc.chunkCount }}</strong></div>
                      @for (line of formatDemoMetadataSummary(doc.metadata); track line) {<div class="demo-key-value-row"><span>Metadata</span><strong>{{ line }}</strong></div>}
                    </div>
                    <p class="demo-document-preview">{{ doc.text }}</p>
                    <div class="demo-inline-preview">
                      @if (chunkPreviewLoading && !isChunkPreviewFor(doc.id)) {<p class="demo-metadata">Preparing chunk preview...</p>}
                      @if (!chunkPreviewLoading && isChunkPreviewFor(doc.id)) {
                        @if (chunkPreview; as preview) {
                        <p class="demo-section-caption">Chunk Preview</p>
                        <p class="demo-metadata">
                          {{ preview.document.title }} · {{ formatContentFormat(preview.document.format) }} · {{ formatChunkStrategy(preview.document.chunkStrategy) }} · {{ preview.chunks.length }} chunk(s)
                        </p>
                        <article class="demo-result-item">
                          <h3>Normalized text</h3>
                          <p class="demo-result-text">{{ preview.normalizedText }}</p>
                        </article>
                        <div class="demo-result-grid">
                          @for (chunk of preview.chunks; track chunk.chunkId) {<article class="demo-result-item">
                            <h3>{{ chunk.chunkId }}</h3>
                            <p class="demo-result-source">source: {{ chunk.source ?? preview.document.source }}</p>
                            <p class="demo-metadata">{{ chunkIndexText(chunk, preview.chunks.length) }}</p>
                            <p class="demo-result-text">{{ chunk.text }}</p>
                          </article>}
                        </div>
                        }
                      }
                    </div>
                  </div>
                </details>}
              }
            </div>
          </article>
        </section>
      </main>
    </div>
  `,
})
export class AngularRAGVectorDemoComponent {
  private readonly ragClient = inject(RAGClientService);
  private readonly ragWorkflowService = inject(RAGWorkflowService);
  private readonly cdr = inject(ChangeDetectorRef);

  workflowChecks = workflowChecks;
  formatDemoMetadataSummary = formatDemoMetadataSummary;
  demoEvaluationPresets = demoEvaluationPresets;
  demoUploadPresets = demoUploadPresets;
  streamStages = streamStages;
  demoFrameworks = demoFrameworks;
  getDemoPagePath = getDemoPagePath;
  backendOptions: DemoBackendDescriptor[] = getAvailableDemoBackends();
  demoContentFormats = demoContentFormats;
  demoChunkingStrategies = demoChunkingStrategies;
  selectedMode: DemoBackendMode = getInitialBackendMode();
  status: DemoStatusView | null = null;
  documents: DemoDocument[] = [];
  searchForm = { ...initialSearchForm };
  addForm = { ...initialAddForm };
  searchResults: SearchResponse | null = null;
  evaluation: RAGEvaluationResponse | null = null;
  savedEvaluationSuite = savedEvaluationSuite;
  suiteRuns: RAGEvaluationSuiteRun[] = [];
  evaluationLeaderboard: RAGEvaluationLeaderboardEntry[] = [];
  qualityData: DemoRetrievalQualityResponse | null = null;
  ops: Awaited<ReturnType<ReturnType<typeof createRAGClient>["ops"]>> | null = null;
  chunkPreview: DemoChunkPreview | null = null;
  chunkPreviewLoading = false;
  loading = false;
  searchError = "";
  addError = "";
  uploadError = "";
  evaluationError = "";
  evaluationMessage = "";
  evaluationRunning = false;
  uploadRunning = false;
  message = "";
  aiModelCatalog: DemoAIModelCatalogResponse = { defaultModelKey: null, models: [] };
  selectedAIModelKey = "";
  streamPrompt = "How do metadata filters change retrieval quality?";
  documentPage = 1;
  documentSearchTerm = "";
  documentTypeFilter = "all";
  selectedUploadFile: File | null = null;
  supportedFileTypeOptions = SUPPORTED_FILE_TYPE_OPTIONS;
  transport = this.ragWorkflowService.connect(getRAGPathForMode(this.selectedMode));

  connectStream() {
    this.transport = this.ragWorkflowService.connect(getRAGPathForMode(this.selectedMode));
  }

  isStreamBusy() {
    return this.transport.workflow().isRetrieving || this.transport.workflow().isAnswerStreaming;
  }

  isStreamStageComplete(stage: typeof streamStages[number], currentStage: string) {
    return currentStage === "complete"
      ? stage === "complete" || streamStages.indexOf(stage) < streamStages.indexOf(currentStage as typeof streamStages[number])
      : streamStages.indexOf(stage) < streamStages.indexOf(currentStage as typeof streamStages[number]);
  }

  formatEvaluationSummary = formatEvaluationSummary;
  formatEvaluationHistorySummary = formatEvaluationHistorySummary;
  formatEvaluationHistoryDiff = formatEvaluationHistoryDiff;
  formatEvaluationLeaderboardEntry = formatEvaluationLeaderboardEntry;
  formatGroundingEvaluationCase = formatGroundingEvaluationCase;
  formatGroundingEvaluationDetails = formatGroundingEvaluationDetails;
  formatGroundingEvaluationSummary = formatGroundingEvaluationSummary;
  formatGroundingProviderEntry = formatGroundingProviderEntry;
  formatGroundingProviderSummary = formatGroundingProviderSummary;
  formatEvaluationCaseSummary = formatEvaluationCaseSummary;
  formatEvaluationExpected = formatEvaluationExpected;
  formatEvaluationRetrieved = formatEvaluationRetrieved;
  formatEvaluationMissing = formatEvaluationMissing;
  formatCitationNumbers = formatCitationNumbers;
  formatCitationDetails = formatCitationDetails;
  formatCitationExcerpt = formatCitationExcerpt;
  formatCitationLabel = formatCitationLabel;
  formatCitationSummary = formatCitationSummary;
  formatGroundingCoverage = formatGroundingCoverage;
  formatGroundedAnswerPartDetails = formatGroundedAnswerPartDetails;
  formatGroundingPartReferences = formatGroundingPartReferences;
  formatGroundingReferenceDetails = formatGroundingReferenceDetails;
  formatGroundingReferenceLabel = formatGroundingReferenceLabel;
  formatGroundingReferenceSummary = formatGroundingReferenceSummary;
  formatGroundingReferenceExcerpt = formatGroundingReferenceExcerpt;
  formatGroundingSummary = formatGroundingSummary;
  formatSourceSummaryDetails = formatSourceSummaryDetails;
  formatRetrievalComparisonEntry = formatRetrievalComparisonEntry;
  formatRetrievalComparisonSummary = formatRetrievalComparisonSummary;
  formatRerankerComparisonEntry = formatRerankerComparisonEntry;
  formatRerankerComparisonSummary = formatRerankerComparisonSummary;
  formatReadinessSummary = formatReadinessSummary;
  formatHealthSummary = formatHealthSummary;
  formatFailureSummary = formatFailureSummary;
  formatSyncSourceSummary = formatSyncSourceSummary;
  formatSyncSourceDetails = formatSyncSourceDetails;
  formatDemoAIModelLabel = formatDemoAIModelLabel;
  isCitationPart = isCitationPart;
  adminJobLines: string[] = ["No admin jobs recorded yet."];
  evaluationLeaderboardLines: string[] = ["Run the saved suite to rank workflow benchmark runs."];
  qualitySummaryLines: string[] = ["Loading quality comparison..."];
  adminActionLines: string[] = ["No admin actions recorded yet."];
  syncOverviewLines: string[] = ["No sync sources configured yet."];
  syncSourceLines: string[] = ["No sync sources configured yet."];
  syncSources: Array<{ id: string; label: string; summary: string; badges: string[]; status: string; collapsedSummary: string }> = [];
  syncDeltaChips: string[] = [];
  recentQueries: Array<{ label: string; state: SearchFormState }> = [];
  scopeDriver = "manual filters";
  restoredSharedState = false;
  restoredSharedStateSummary = "";
  retrievalPresetId = "";
  benchmarkPresetId = "";
  uploadPresetId = "";

  get retrievalScopeSummary() {
    return formatRetrievalScopeSummary(this.searchForm);
  }

  get retrievalScopeHint() {
    return formatRetrievalScopeHint(this.searchForm);
  }

  get filteredDocuments() {
    const query = this.documentSearchTerm.trim().toLowerCase();
    return this.documents.filter((document) => {
      const matchesQuery =
        query.length === 0 ||
        document.title.toLowerCase().includes(query) ||
        document.source.toLowerCase().includes(query) ||
        document.text.toLowerCase().includes(query);
      const matchesType =
        this.documentTypeFilter === "all" || this.inferDocumentExtension(document) === this.documentTypeFilter;
      return matchesQuery && matchesType;
    });
  }

  get totalDocumentPages() {
    return Math.max(1, Math.ceil(this.filteredDocuments.length / DOCUMENTS_PER_PAGE));
  }

  get paginatedDocuments() {
    const start = (this.documentPage - 1) * DOCUMENTS_PER_PAGE;
    return this.filteredDocuments.slice(start, start + DOCUMENTS_PER_PAGE);
  }

  get documentPageNumbers() {
    return Array.from({ length: this.totalDocumentPages }, (_, index) => index + 1);
  }

  getBenchmarkHistoryLines(history?: DemoRetrievalQualityResponse["retrievalHistories"][string]) {
    return [...this.formatEvaluationHistorySummary(history), ...this.formatEvaluationHistoryDiff(history)];
  }

  getGroundingHistoryLines(history?: DemoRetrievalQualityResponse["providerGroundingHistories"][string]) {
    return [...formatGroundingHistorySummary(history), ...formatGroundingHistoryDiff(history), ...formatGroundingHistorySnapshots(history)];
  }

  getGroundingArtifactTrailLines(history?: DemoRetrievalQualityResponse["providerGroundingHistories"][string]) {
    return formatGroundingHistoryArtifactTrail(history);
  }

  getGroundingProviderCaseLines(entry: NonNullable<DemoRetrievalQualityResponse["providerGroundingComparison"]>["caseComparisons"][number]) {
    return [...formatGroundingProviderCaseSummary(entry), ...entry.entries.flatMap((candidate) => [formatGroundingProviderCaseEntry(candidate), ...formatGroundingProviderCaseDetails(candidate)])];
  }

  getGroundingDifficultyLines(entries: NonNullable<DemoRetrievalQualityResponse["providerGroundingComparison"]>["difficultyLeaderboard"]) {
    return entries.map((entry) => formatGroundingCaseDifficultyEntry(entry));
  }

  getGroundingDifficultyHistoryLines(history?: DemoRetrievalQualityResponse["providerGroundingDifficultyHistory"]) {
    return [...formatGroundingDifficultyHistorySummary(history), ...formatGroundingDifficultyHistoryDiff(history)];
  }

  async runSavedSuite() {
    this.evaluationError = "";
    this.evaluationMessage = "";
    this.evaluationRunning = true;

    try {
      const run = await runRAGEvaluationSuite({
        suite: this.savedEvaluationSuite,
        evaluate: (input) => this.ragClient.evaluate(getRAGPathForMode(this.selectedMode), input),
      });
      this.suiteRuns = [run, ...this.suiteRuns];
      this.evaluationLeaderboard = buildRAGEvaluationLeaderboard(this.suiteRuns);
      this.evaluationLeaderboardLines = this.evaluationLeaderboard.length > 0
        ? this.evaluationLeaderboard.map((entry) => formatEvaluationLeaderboardEntry(entry))
        : ["Run the saved suite to rank workflow benchmark runs."];
      this.evaluationMessage = `Saved suite run finished in ${run.elapsedMs}ms and ranked ${this.evaluationLeaderboard.length} workflow run(s).`;
    } catch (error) {
      this.evaluationError = error instanceof Error ? `Saved suite failed: ${error.message}` : "Saved suite failed";
    } finally {
      this.evaluationRunning = false;
      this.flushView();
    }
  }

  async runEvaluation() {
    this.evaluationError = "";
    this.evaluationMessage = "";
    this.evaluationRunning = true;

    try {
      const response = await this.ragClient.evaluate(
        getRAGPathForMode(this.selectedMode),
        buildDemoEvaluationInput(),
      );
      this.evaluation = response;
      this.evaluationMessage =
        `Benchmark suite finished in ${response.elapsedMs}ms across ${response.totalCases} benchmark queries.`;
    } catch (error) {
      this.evaluationError =
        error instanceof Error ? `Evaluation failed: ${error.message}` : "Evaluation failed";
    } finally {
      this.evaluationRunning = false;
      this.flushView();
    }
  }

  submitStreamQuery(event: Event) {
    event.preventDefault();
    const prompt = this.streamPrompt.trim();
    if (prompt.length === 0) {
      this.message = "Enter a retrieval question before starting the stream.";
      this.flushView();
      return;
    }

    if (this.selectedAIModelKey.length === 0) {
      this.message = "Configure an AI provider to enable retrieval streaming.";
      this.flushView();
      return;
    }

    this.message = "";
    this.transport.query(buildDemoAIStreamPrompt(this.selectedAIModelKey, prompt));
    this.flushView();
  }

  async executeSearch() {
    this.searchError = "";
    this.searchResults = null;

    const query = this.searchForm.query.trim();
    if (query.length === 0) {
      this.searchError = "query is required";
      return;
    }

    try {
      const payload = buildSearchPayload({
        ...this.searchForm,
        query,
      });
      const start = performance.now();
      const results = await this.ragClient.search(getRAGPathForMode(this.selectedMode), payload as never);
      const nextState = { ...this.searchForm, query };
      void saveActiveRetrievalState("angular", this.selectedMode, {
        searchForm: nextState,
        scopeDriver: this.scopeDriver,
        streamModelKey: this.selectedAIModelKey || undefined,
        streamPrompt: this.streamPrompt,
      });
      this.recentQueries = [
        { label: query, state: nextState },
        ...this.recentQueries.filter((entry) => JSON.stringify(entry.state) !== JSON.stringify(nextState)),
      ].slice(0, 4);
      void saveRecentQueries("angular", this.selectedMode, this.recentQueries);
      this.searchResults = buildSearchResponse(
        query,
        payload,
        results,
        Math.round(performance.now() - start),
      );
      this.flushView();
    } catch (error) {
      this.searchError =
        error instanceof Error ? `Search failed: ${error.message}` : "Search failed";
      this.flushView();
    }
  }

  async refreshData() {
    this.loading = true;
    this.searchError = "";
    try {

      const [statusData, docsData, opsData, aiModelsResponse, qualityResponse] = await Promise.all([
        this.ragClient.status(getRAGPathForMode(this.selectedMode)),
        this.ragClient.documents(getRAGPathForMode(this.selectedMode)),
        this.ragClient.ops(getRAGPathForMode(this.selectedMode)),
        fetch("/demo/ai-models").then((response) => response.json()) as Promise<DemoAIModelCatalogResponse>,
        fetch(`/demo/quality/${this.selectedMode}`).then((response) => response.json()) as Promise<DemoRetrievalQualityResponse>,
      ]);
      this.aiModelCatalog = aiModelsResponse;
      this.qualityData = qualityResponse;
      this.qualitySummaryLines = [...formatRetrievalComparisonSummary(qualityResponse.retrievalComparison), ...formatRerankerComparisonSummary(qualityResponse.rerankerComparison), formatGroundingEvaluationSummary(qualityResponse.groundingEvaluation), ...(qualityResponse.providerGroundingComparison ? formatGroundingProviderSummary(qualityResponse.providerGroundingComparison) : ["Configure an AI provider to compare real model-grounded answers."])];
      this.selectedAIModelKey = this.selectedAIModelKey || aiModelsResponse.defaultModelKey || aiModelsResponse.models[0]?.key || "";

      this.documents = docsData.documents as DemoDocument[];
      this.ops = opsData;
      this.adminJobLines = formatAdminJobList(opsData.adminJobs).length > 0 ? formatAdminJobList(opsData.adminJobs) : ["No admin jobs recorded yet."];
      this.adminActionLines = formatAdminActionList(opsData.adminActions).length > 0 ? formatAdminActionList(opsData.adminActions) : ["No admin actions recorded yet."];
      const sortedSyncSources = sortSyncSources(opsData.syncSources);
      this.syncSources = sortedSyncSources.map((source) => ({ id: source.id, label: source.label, summary: formatSyncSourceActionSummary(source), badges: formatSyncSourceActionBadges(source), status: source.status, collapsedSummary: formatSyncSourceCollapsedSummary(source) }));
      this.syncDeltaChips = formatSyncDeltaChips(sortedSyncSources);
      this.syncOverviewLines = formatSyncSourceOverview(sortedSyncSources);
      this.syncSourceLines =
        sortedSyncSources.length > 0
          ? sortedSyncSources.flatMap((source) => [
              formatSyncSourceSummary(source),
              ...formatSyncSourceDetails(source),
            ])
          : ["No sync sources configured yet."];
      this.chunkPreview =
        this.chunkPreview !== null &&
        docsData.documents.some((document) => document.id === this.chunkPreview?.document.id)
          ? this.chunkPreview
          : null;
      this.status = buildStatusView(
        statusData.status,
        statusData.capabilities,
        this.documents,
        this.selectedMode,
      );
      this.message = "";
      this.flushView();
    } catch (error) {
      this.message =
        error instanceof Error
          ? `Unable to load demo data: ${error.message}`
          : "Unable to load demo data";
    } finally {
      this.loading = false;
      this.flushView();
    }
  }

  onBackendModeChange(mode: DemoBackendMode) {
    this.selectedMode = mode;
    this.connectStream();
    navigateToBackendMode(mode);
  }

  async submitSearch(event: Event) {
    event.preventDefault();
    this.scopeDriver = "manual filters";
    await this.executeSearch();
  }

  clearRetrievalScope() {
    this.scopeDriver = "chip reset";
    this.searchForm = { ...this.searchForm, kind: "", source: "", documentId: "" };
    void saveActiveRetrievalState("angular", this.selectedMode, {
      searchForm: this.searchForm,
      scopeDriver: this.scopeDriver,
      streamModelKey: this.selectedAIModelKey || undefined,
      streamPrompt: this.streamPrompt,
    });
    if (this.searchForm.query.trim().length > 0) {
      void this.executeSearch();
    }
  }

  clearAllRetrievalState() {
    this.scopeDriver = "clear all state";
    this.searchForm = { ...this.searchForm, query: "", kind: "", source: "", documentId: "", scoreThreshold: "" };
    void saveActiveRetrievalState("angular", this.selectedMode, {
      searchForm: this.searchForm,
      scopeDriver: this.scopeDriver,
      streamModelKey: this.selectedAIModelKey || undefined,
      streamPrompt: this.streamPrompt,
    });
    this.searchResults = null;
    this.searchError = "";
  }

  rerunLastQuery() {
    if (this.searchForm.query.trim().length === 0) return;
    this.scopeDriver = "rerun last query";
    void this.executeSearch();
  }

  runPresetSearch(query: string, options: Partial<SearchFormState> = {}, driver = "preset", presetId = "") {
    this.scopeDriver = driver;
    if (driver.startsWith("benchmark preset:")) {
      this.benchmarkPresetId = presetId;
      this.retrievalPresetId = "";
      this.uploadPresetId = "";
    } else if (driver === "upload verification") {
      this.retrievalPresetId = "";
      this.benchmarkPresetId = "";
    } else {
      this.retrievalPresetId = presetId;
      this.benchmarkPresetId = "";
      this.uploadPresetId = "";
    }
    this.searchForm = {
      ...this.searchForm,
      ...options,
      query,
      kind:
        options.kind === "seed" || options.kind === "custom" ? options.kind : "",
      source: options.source ?? "",
      documentId: options.documentId ?? "",
      scoreThreshold: options.scoreThreshold ?? "",
      topK: options.topK ?? 6,
    };
    void saveActiveRetrievalState("angular", this.selectedMode, {
      searchForm: this.searchForm,
      scopeDriver: this.scopeDriver,
      lastUpdatedAt: Date.now(),
      retrievalPresetId: this.retrievalPresetId || undefined,
      benchmarkPresetId: this.benchmarkPresetId || undefined,
      uploadPresetId: this.uploadPresetId || undefined,
    });

    void this.executeSearch();
  }

  inferDocumentExtension(document: DemoDocument) {
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
  }

  onUploadFileChange(event: Event) {
    this.selectedUploadFile = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.flushView();
  }

  onDocumentSearchTermChange(value: string) {
    this.documentSearchTerm = value;
    this.documentPage = 1;
  }

  onDocumentTypeFilterChange(value: string) {
    this.documentTypeFilter = value;
    this.documentPage = 1;
  }

  setDocumentPage(page: number) {
    this.documentPage = Math.min(this.totalDocumentPages, Math.max(1, page));
  }

  rerunRecentQuery(state: SearchFormState) {
    this.scopeDriver = "recent query";
    this.searchForm = state;
    void saveActiveRetrievalState("angular", this.selectedMode, {
      searchForm: this.searchForm,
      scopeDriver: this.scopeDriver,
      lastUpdatedAt: Date.now(),
      retrievalPresetId: this.retrievalPresetId || undefined,
      benchmarkPresetId: this.benchmarkPresetId || undefined,
      uploadPresetId: this.uploadPresetId || undefined,
    });
    void this.executeSearch();
  }

  async ingestDemoUpload(preset: (typeof demoUploadPresets)[number]) {
    this.uploadError = "";
    this.uploadRunning = true;
    this.message = `Uploading ${preset.label}...`;
    this.flushView();
    try {
      const fixture = await fetch(getDemoUploadFixtureUrl(preset.id));
      if (!fixture.ok) {
        throw new Error(`Failed to load ${preset.fileName}: ${fixture.status}`);
      }
      const response = await this.ragClient.ingestUploads(
        getRAGPathForMode(this.selectedMode),
        buildDemoUploadIngestInput(preset, encodeArrayBufferToBase64(await fixture.arrayBuffer())),
      );
      if (!response.ok) {
        throw new Error(response.error ?? "Upload ingest failed");
      }
      this.message = `Uploaded ${preset.label}. Extracted ${response.count ?? 0} chunk(s) across ${response.documentCount ?? 1} document(s).`;
      this.uploadPresetId = preset.id;
      this.runPresetSearch(preset.query, { source: preset.expectedSources[0] ?? preset.source, topK: 6 }, "upload verification");
    } catch (error) {
      this.uploadError = error instanceof Error ? `Upload failed: ${error.message}` : "Upload failed";
      this.message = "";
      this.flushView();
    } finally {
      this.uploadRunning = false;
      this.flushView();
    }
  }

  async uploadSelectedDocumentFile() {
    if (!this.selectedUploadFile) {
      this.uploadError = "Choose a file before uploading.";
      this.flushView();
      return;
    }

    this.uploadError = "";
    this.uploadRunning = true;
    this.message = `Uploading ${this.selectedUploadFile.name}...`;
    this.flushView();
    try {
      const uploadedName = this.selectedUploadFile.name;
      const response = await this.ragClient.ingestUploads(getRAGPathForMode(this.selectedMode), {
        baseMetadata: {
          fileKind: "uploaded-user-file",
          kind: "custom",
        },
        uploads: [
          {
            name: uploadedName,
            source: `uploads/${uploadedName}`,
            title: uploadedName,
            contentType: this.selectedUploadFile.type || "application/octet-stream",
            encoding: "base64",
            content: encodeArrayBufferToBase64(await this.selectedUploadFile.arrayBuffer()),
            metadata: {
              kind: "custom",
              uploadedFrom: "angular-general-upload",
            },
          },
        ],
      });
      if (!response.ok) {
        throw new Error(response.error ?? "Upload ingest failed");
      }
      this.message = `Uploaded ${uploadedName}. Extracted ${response.count ?? 0} chunk(s) across ${response.documentCount ?? 1} document(s).`;
      this.selectedUploadFile = null;
      this.flushView();
      await this.refreshData();
      this.runPresetSearch(`Explain ${uploadedName}`, { source: `uploads/${uploadedName}`, topK: 6 }, "upload verification");
    } catch (error) {
      this.uploadError = error instanceof Error ? `Upload failed: ${error.message}` : "Upload failed";
      this.message = "";
      this.flushView();
    } finally {
      this.uploadRunning = false;
      this.flushView();
    }
  }

  async submitAddDocument(event: Event) {
    event.preventDefault();
    this.addError = "";
    this.searchError = "";

    try {
      const response = await this.ragClient.createDocument(getRAGPathForMode(this.selectedMode), {
        id: this.addForm.id.trim().length > 0 ? this.addForm.id.trim() : undefined,
        title: this.addForm.title.trim(),
        source: this.addForm.source.trim(),
        format: this.addForm.format,
        text: this.addForm.text.trim(),
        chunking: {
          strategy: this.addForm.chunkStrategy,
        },
      });

      this.message = `Inserted ${response.inserted ?? this.addForm.title.trim()}`;
      this.addForm = { ...initialAddForm };
      this.flushView();
      await this.refreshData();
    } catch (error) {
      this.addError =
        error instanceof Error
          ? `Failed to insert: ${error.message}`
          : "Failed to insert document";
      this.flushView();
    }
  }

  async inspectChunks(documentId: string) {
    this.chunkPreviewLoading = true;
    this.flushView();
    try {
      const response = await this.ragClient.documentChunks(getRAGPathForMode(this.selectedMode), documentId);
      if (!response.ok) {
        throw new Error(response.error);
      }
      this.chunkPreview = response as DemoChunkPreview;
    } catch (error) {
      this.message =
        error instanceof Error
          ? `Failed to inspect ${documentId}: ${error.message}`
          : `Failed to inspect ${documentId}`;
    } finally {
      this.chunkPreviewLoading = false;
      this.flushView();
    }
  }

  chunkIndexText(chunk: { metadata?: Record<string, unknown> }, fallbackCount: number) {
    const indexValue = typeof chunk.metadata?.chunkIndex === "number" ? chunk.metadata.chunkIndex : 0;
    const countValue = typeof chunk.metadata?.chunkCount === "number" ? chunk.metadata.chunkCount : fallbackCount;
    return `chunk index: ${String(indexValue)} / count: ${String(countValue)}`;
  }

  isChunkPreviewFor(documentId: string) {
    return this.chunkPreview?.document.id === documentId;
  }

  async deleteDocument(documentId: string) {
    try {
      const response = await this.ragClient.deleteDocument(getRAGPathForMode(this.selectedMode), documentId);
      if (!response.ok) {
        throw new Error(response.error ?? "Failed to delete document");
      }
      this.message = `Deleted ${documentId}`;
      this.chunkPreview = this.chunkPreview?.document.id === documentId ? null : this.chunkPreview;
      this.flushView();
      await this.refreshData();
    } catch (error) {
      this.message =
        error instanceof Error
          ? `Failed to delete ${documentId}: ${error.message}`
          : "Failed to delete document";
      this.flushView();
    }
  }

  async reseed() {
    this.searchError = "";
    this.addError = "";
    try {
      this.message = "Reseeding defaults...";
      this.flushView();
      const result = await this.ragClient.reseed(getRAGPathForMode(this.selectedMode));
      this.message = `Reseed complete. Documents=${result.documents ?? 0}`;
      this.searchResults = null;
      this.flushView();
      await this.refreshData();
    } catch (error) {
      this.message =
        error instanceof Error ? `Reseed failed: ${error.message}` : "Reseed failed";
      this.flushView();
    }
  }

  async resetCustom() {
    this.searchError = "";
    this.addError = "";
    try {
      this.message = "Resetting custom documents...";
      this.flushView();
      const result = await this.ragClient.reset(getRAGPathForMode(this.selectedMode));
      this.message = `Reset complete. Documents=${result.documents ?? 0}`;
      this.searchResults = null;
      this.flushView();
      await this.refreshData();
    } catch (error) {
      this.message =
        error instanceof Error ? `Reset failed: ${error.message}` : "Reset failed";
      this.flushView();
    }
  }

  async syncAllSources() {
    try {
      this.message = "Syncing all sources...";
      this.flushView();
      const result = await this.ragClient.syncAllSources(getRAGPathForMode(this.selectedMode));
      this.message = `Synced ${"sources" in result ? result.sources.length : 0} source(s).`;
      this.flushView();
      await this.refreshData();
    } catch (error) {
      this.message =
        error instanceof Error ? `Source sync failed: ${error.message}` : "Source sync failed";
      this.flushView();
    }
  }

  async queueBackgroundSync() {
    try {
      this.message = "Queueing background sync...";
      this.flushView();
      await this.ragClient.syncAllSources(getRAGPathForMode(this.selectedMode), { background: true });
      this.message = "Background sync queued.";
      this.flushView();
      await this.refreshData();
    } catch (error) {
      this.message =
        error instanceof Error ? `Failed to queue background sync: ${error.message}` : "Failed to queue background sync";
      this.flushView();
    }
  }

  async syncSource(id: string) {
    try {
      this.message = `Syncing ${id}...`;
      this.flushView();
      const result = await this.ragClient.syncSource(getRAGPathForMode(this.selectedMode), id);
      this.message =
        "source" in result ? `Synced ${result.source.label}.` : `Synced ${id}.`;
      this.flushView();
      await this.refreshData();
    } catch (error) {
      this.message =
        error instanceof Error ? `Failed to sync ${id}: ${error.message}` : `Failed to sync ${id}`;
      this.flushView();
    }
  }

  async queueBackgroundSourceSync(id: string) {
    try {
      this.message = `Queueing ${id} in the background...`;
      this.flushView();
      const result = await this.ragClient.syncSource(getRAGPathForMode(this.selectedMode), id, { background: true });
      this.message =
        "source" in result ? `Queued ${result.source.label}.` : `Queued ${id}.`;
      this.flushView();
      await this.refreshData();
    } catch (error) {
      this.message =
        error instanceof Error ? `Failed to queue ${id}: ${error.message}` : `Failed to queue ${id}`;
      this.flushView();
    }
  }

  formatDate(value: number) {
    return new Date(value).toLocaleString();
  }

  formatScore(value: number) {
    return value.toFixed(4);
  }

  formatContentFormat(value: AddFormState["format"] | DemoDocument["format"]) {
    return formatContentFormat(value);
  }

  formatChunkStrategy(value: AddFormState["chunkStrategy"] | DemoDocument["chunkStrategy"]) {
    return formatChunkStrategy(value);
  }

  private flushView() {
    this.cdr.detectChanges();
  }

  ngOnInit() {
    if (typeof window !== "undefined") {
      void loadRecentQueries("angular", this.selectedMode).then((entries) => {
        this.recentQueries = entries;
        this.flushView();
      });
      void loadActiveRetrievalState("angular", this.selectedMode).then((state) => {
        if (state) {
          this.searchForm = state.searchForm;
          this.scopeDriver = state.scopeDriver;
          this.retrievalPresetId = state.retrievalPresetId ?? "";
          this.benchmarkPresetId = state.benchmarkPresetId ?? "";
          this.uploadPresetId = state.uploadPresetId ?? "";
          this.selectedAIModelKey = state.streamModelKey ?? this.selectedAIModelKey;
          this.streamPrompt = state.streamPrompt ?? this.streamPrompt;
          this.restoredSharedState = true;
          const label =
            this.demoUploadPresets.find((preset) => preset.id === state.uploadPresetId)?.label ??
            this.demoEvaluationPresets.find((preset) => preset.id === state.benchmarkPresetId)?.label ??
            state.retrievalPresetId ??
            "manual state";
          this.restoredSharedStateSummary = `Restored from shared demo state · ${label} · ${new Date(state.lastUpdatedAt ?? Date.now()).toLocaleString()}.`;
        } else {
          this.restoredSharedState = false;
          this.restoredSharedStateSummary = "";
        }
        this.flushView();
      });
      void this.refreshData();
    }
  }
}

export const factory = (props: AngularRAGVectorDemoProps) => {
  const component = new AngularRAGVectorDemoComponent();
  component.backendOptions = getAvailableDemoBackends(props.availableBackends);
  component.selectedMode = props.mode;
  component.connectStream();
  return component;
};
export default AngularRAGVectorDemoComponent;


function isCitationPart(part: { type: string }): part is { type: "citation"; referenceNumbers: number[]; text: string } {
  return part.type === "citation";
}

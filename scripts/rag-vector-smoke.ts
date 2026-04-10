type DemoBackendDescriptor = {
  id: string;
  label: string;
  available: boolean;
};

type RAGStatusResponse = {
  ok?: boolean;
  documents?: unknown;
};

type RAGDocumentsResponse = {
  ok?: boolean;
  documents?: unknown;
};

type RAGSearchResponse = {
  ok?: boolean;
  results?: unknown;
};

type RAGOperationsResponse = {
  ok?: boolean;
  admin?: unknown;
};

type CheckResult<T> = { ok: true; value: T } | { ok: false };

const TARGET_FRAMES = ["react", "svelte", "vue", "angular", "html", "htmx"] as const;
const FIXTURE_CHECKS = ["upload-native-pdf", "upload-scanned-pdf", "absolutejs-rag-demo-suite"] as const;
const DEFAULT_BASE_URL = "http://localhost:3000";
const RAG_PATH_BY_MODE: Record<string, string> = {
  "sqlite-native": "/rag/sqlite-native",
  "sqlite-fallback": "/rag/sqlite-fallback",
  postgres: "/rag/postgres",
};
const DEFAULT_RAG_PATH = "/rag/sqlite-native";
const DEFAULT_TIMEOUT_MS = 7_500;

const parseBaseUrl = () => {
  const fromEnv = process.env.RAG_VECTOR_SMOKE_BASE_URL ?? process.env.DEMO_BASE_URL;
  const flag = process.argv.find((entry) => entry.startsWith("--base="))?.slice(7);
  const raw = flag ?? fromEnv ?? DEFAULT_BASE_URL;
  const trimmed = raw.trim();

  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
};

const assert = (condition: boolean, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const withTimeout = async <T>(promise: Promise<T>, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`request timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
};

const requestJson = async <T>(baseUrl: string, path: string, init?: RequestInit) => {
  const response = await withTimeout(fetch(`${baseUrl}${path}`, init));
  if (!response.ok) {
    throw new Error(`${path} returned status ${response.status}`);
  }

  const payload = (await response.json()) as unknown;
  if (!payload || typeof payload !== "object") {
    throw new Error(`${path} did not return object JSON`);
  }

  return payload as T;
};

const requestText = async (baseUrl: string, path: string, init?: RequestInit) => {
  const response = await withTimeout(fetch(`${baseUrl}${path}`, init));
  if (!response.ok) {
    throw new Error(`${path} returned status ${response.status}`);
  }

  return response.text();
};

const isBackendDescriptorArray = (value: unknown): value is DemoBackendDescriptor[] =>
  Array.isArray(value) &&
  value.every(
    (entry) =>
      typeof entry === "object" &&
      entry !== null &&
      typeof entry.id === "string" &&
      typeof entry.label === "string" &&
      typeof entry.available === "boolean",
  );

const runCheck = async <T>(
  name: string,
  runner: () => Promise<T>,
  failures: string[],
): Promise<CheckResult<T>> => {
  try {
    const value = await runner();
    console.log(`✅ ${name}`);
    return { ok: true, value };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`❌ ${name}: ${message}`);
    failures.push(`${name}: ${message}`);
    return { ok: false };
  }
};

const checkRagRoutes = async (baseUrl: string, mode: string, ragPath: string, failures: string[]) => {
  await runCheck(`rag status ${mode}`, async () => {
    const payload = await requestJson<RAGStatusResponse>(baseUrl, `${ragPath}/status`);
    assert(payload.ok !== false, `status endpoint returned ok=false for ${mode}`);
    assert(typeof payload === "object", `status endpoint missing object payload for ${mode}`);
  }, failures);

  await runCheck(`rag documents ${mode}`, async () => {
    const payload = await requestJson<RAGDocumentsResponse>(baseUrl, `${ragPath}/documents`);
    assert(payload.ok === true, `documents endpoint returned ok!=true for ${mode}`);
    assert(Array.isArray(payload.documents), `documents endpoint missing documents array for ${mode}`);
  }, failures);

  await runCheck(`rag documents?kind=seed ${mode}`, async () => {
    const payload = await requestJson<RAGDocumentsResponse>(baseUrl, `${ragPath}/documents?kind=seed`);
    assert(payload.ok === true, `documents?kind=seed returned ok!=true for ${mode}`);
  }, failures);

  await runCheck(`rag search ${mode}`, async () => {
    const payload = await requestJson<RAGSearchResponse>(baseUrl, `${ragPath}/search`, {
      body: JSON.stringify({ query: "metadata filters", topK: 2 }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    assert(payload.ok === true, `search returned ok!=true for ${mode}`);
    assert(Array.isArray(payload.results), `search results missing array for ${mode}`);
  }, failures);

  await runCheck(`rag ops ${mode}`, async () => {
    const payload = await requestJson<RAGOperationsResponse>(baseUrl, `${ragPath}/ops`);
    assert(payload.ok === true, `ops returned ok!=true for ${mode}`);
    assert(payload.admin !== undefined, `ops response missing admin for ${mode}`);
  }, failures);
};

const checkDemoRoutes = async (baseUrl: string, mode: string, failures: string[]) => {
  await runCheck(`demo quality ${mode}`, async () => {
    const payload = await requestJson<Record<string, unknown>>(baseUrl, `/demo/quality/${mode}`);
    assert(payload.suite !== undefined, `quality endpoint missing suite for ${mode}`);
  }, failures);

  await runCheck(`demo ops panel ${mode}`, async () => {
    const html = await requestText(baseUrl, `/demo/ops/${mode}`);
    assert(
      html.includes("<div id=\"ops-panel\""),
      `demo ops panel did not return ops panel HTML for ${mode}`,
    );
  }, failures);

  for (const framework of TARGET_FRAMES) {
    await runCheck(`framework page ${framework}/${mode}`, async () => {
      const html = await requestText(baseUrl, `/${framework}/${mode}`);
      assert(html.includes("<!doctype html>") || html.includes("<html"), `page missing html for ${framework}/${mode}`);
    }, failures);
  }

  await runCheck(`fixture file route`, async () => {
    let foundFixture = false;
    for (const fixtureId of FIXTURE_CHECKS) {
      const body = await requestText(baseUrl, `/demo/upload-fixtures/${fixtureId}`);
      if (body.length > 120) {
        foundFixture = true;
        break;
      }
    }
    assert(foundFixture, `none of the fixture ids returned a usable file body`);
  }, failures);
};

const main = async () => {
  const baseUrl = parseBaseUrl();
  const failures: string[] = [];

  const backendsResult = await runCheck<DemoBackendDescriptor[]>(
    "demo backend directory",
    async () => {
      const descriptors = await requestJson<DemoBackendDescriptor[]>(baseUrl, "/demo/backends");
      assert(isBackendDescriptorArray(descriptors), "/demo/backends is not a valid descriptor array");
      const active = descriptors.filter((entry: DemoBackendDescriptor) => entry.available);
      assert(active.length > 0, "no active backend modes were found");
      return active;
    },
    failures,
  );

  if (!backendsResult.ok) {
    process.exit(1);
  }

  const backends = backendsResult.value;

  await runCheck("demo ai model catalog", async () => {
    const payload = await requestJson<{ models: unknown[] }>(baseUrl, "/demo/ai-models");
    assert(Array.isArray(payload.models), "/demo/ai-models.models is not an array");
  }, failures);

  await runCheck("sync fixtures markdown", async () => {
    const markdown = await requestText(baseUrl, "/demo/sync-fixtures/workflow-source.md");
    assert(markdown.length > 80, "/demo/sync-fixtures/workflow-source.md returned short body");
    assert(markdown.toLowerCase().includes("workflow"), "sync fixture doc missing expected marker");
  }, failures);

  for (const backend of backends) {
    const ragPath = RAG_PATH_BY_MODE[backend.id] ?? DEFAULT_RAG_PATH;
    await checkRagRoutes(baseUrl, backend.id, ragPath, failures);
    await checkDemoRoutes(baseUrl, backend.id, failures);
  }

  if (failures.length > 0) {
    console.error("Smoke checks failed:");
    for (const entry of failures) {
      console.error(`  - ${entry}`);
    }
    process.exit(1);
  }

  console.log("Smoke checks passed.");
};

void main();

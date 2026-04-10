import { afterEach, describe, expect, it, mock } from "bun:test";

import type { DemoActiveRetrievalState, SearchFormState } from "../../src/frontend/demo-backends";
import {
  loadActiveRetrievalState,
  loadRecentQueries,
  readJsonResponse,
} from "../../src/frontend/demo-backends";

const originalFetch = globalThis.fetch;

const setFetch = (implementation: (...args: Parameters<typeof fetch>) => ReturnType<typeof fetch>) => {
  globalThis.fetch = mock(implementation) as unknown as typeof fetch;
};

const emptySearchForm: SearchFormState = {
  documentId: "",
  kind: "",
  query: "",
  scoreThreshold: "",
  source: "",
  topK: 5,
};

const sampleState: DemoActiveRetrievalState = {
  scopeDriver: "manual filters",
  searchForm: emptySearchForm,
};

afterEach(() => {
  globalThis.fetch = originalFetch;
  mock.restore();
});

describe("readJsonResponse", () => {
  it("returns null for an empty response body", async () => {
    const response = new Response("   ", { status: 200 });

    expect(await readJsonResponse(response)).toBeNull();
  });

  it("returns null for malformed JSON", async () => {
    const response = new Response('{"broken":', { status: 200 });

    expect(await readJsonResponse(response)).toBeNull();
  });

  it("parses valid JSON", async () => {
    const payload = { ok: true };
    const response = new Response(JSON.stringify(payload), { status: 200 });

    expect(await readJsonResponse(response)).toEqual(payload);
  });
});

describe("loadRecentQueries", () => {
  it("returns an empty list for an empty body", async () => {
    setFetch(async () => new Response("", { status: 200 }));

    await expect(loadRecentQueries("react", "sqlite-native")).resolves.toEqual([]);
  });

  it("returns an empty list for malformed JSON", async () => {
    setFetch(async () => new Response('{"broken":', { status: 200 }));

    await expect(loadRecentQueries("react", "sqlite-native")).resolves.toEqual([]);
  });

  it("filters invalid entries and caps valid entries", async () => {
    const payload = [
      { label: "one", state: { ...emptySearchForm, query: "one" } },
      { label: "two", state: { ...emptySearchForm, query: "two" } },
      { label: "invalid" },
      { label: "three", state: { ...emptySearchForm, query: "three" } },
      { label: "four", state: { ...emptySearchForm, query: "four" } },
      { label: "five", state: { ...emptySearchForm, query: "five" } },
    ];
    setFetch(async () => new Response(JSON.stringify(payload), { status: 200 }));

    await expect(loadRecentQueries("react", "sqlite-native")).resolves.toEqual([
      { label: "one", state: { ...emptySearchForm, query: "one" } },
      { label: "two", state: { ...emptySearchForm, query: "two" } },
      { label: "three", state: { ...emptySearchForm, query: "three" } },
      { label: "four", state: { ...emptySearchForm, query: "four" } },
    ]);
  });

  it("returns an empty list when fetch rejects", async () => {
    setFetch(async () => {
      throw new Error("network down");
    });

    await expect(loadRecentQueries("react", "sqlite-native")).resolves.toEqual([]);
  });
});

describe("loadActiveRetrievalState", () => {
  it("returns null for an empty body", async () => {
    setFetch(async () => new Response("", { status: 200 }));

    await expect(loadActiveRetrievalState("react", "sqlite-native")).resolves.toBeNull();
  });

  it("returns null for malformed JSON", async () => {
    setFetch(async () => new Response('{"broken":', { status: 200 }));

    await expect(loadActiveRetrievalState("react", "sqlite-native")).resolves.toBeNull();
  });

  it("returns the parsed retrieval state for valid JSON", async () => {
    setFetch(async () => new Response(JSON.stringify(sampleState), { status: 200 }));

    await expect(loadActiveRetrievalState("react", "sqlite-native")).resolves.toEqual(sampleState);
  });

  it("returns null when fetch rejects", async () => {
    setFetch(async () => {
      throw new Error("network down");
    });

    await expect(loadActiveRetrievalState("react", "sqlite-native")).resolves.toBeNull();
  });
});

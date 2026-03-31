import {
  networking,
  prepare,
  type AIProviderConfig,
  type AIToolMap,
} from "@absolutejs/absolute";
import {
  streamAI,
  createConversationManager,
  parseAIMessage,
} from "@absolutejs/absolute/ai";
import { anthropic } from "@absolutejs/absolute/ai/anthropic";
import { openai } from "@absolutejs/absolute/ai/openai";
import { ollama } from "@absolutejs/absolute/ai/ollama";
import { Elysia } from "elysia";
import { pagesPlugin } from "./plugins/pagesPlugin";

const { absolutejs, manifest } = await prepare();

const conversations = createConversationManager();

const MAX_PROVIDER_PREFIX_LEN = 12;

const PROVIDERS: Record<string, AIProviderConfig> = {
  anthropic: anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" }),
  ollama: ollama(),
  openai: openai({ apiKey: process.env.OPENAI_API_KEY ?? "" }),
};

const WEATHER_DATA: Record<string, string> = {
  london: "London: 12C, cloudy with light rain",
  nyc: "New York: 24C, sunny and clear",
  paris: "Paris: 18C, partly cloudy",
  tokyo: "Tokyo: 28C, humid with scattered showers",
};

const extractCity = (input: unknown) => {
  if (typeof input !== "object" || input === null || !("city" in input)) {
    return "unknown";
  }

  const record = input;

  if (typeof record !== "object" || record === null) {
    return "unknown";
  }

  const city = "city" in record ? record.city : undefined;

  return typeof city === "string" ? city : "unknown";
};

const lookupWeather = (input: unknown) => {
  const city = extractCity(input);

  return WEATHER_DATA[city.toLowerCase()] ?? `No weather data for ${city}`;
};

const tools: AIToolMap = {
  get_weather: {
    description: "Get the current weather for a city",
    handler: lookupWeather,
    input: {
      properties: { city: { description: "City name", type: "string" } },
      required: ["city"],
      type: "object",
    },
  },
};

const MODEL_MAP: Record<string, string> = {
  anthropic: "claude-sonnet-4-5-20250514",
  ollama: "llama3.2",
  openai: "gpt-4o-mini",
};

const resolveProvider = (providerName: string) =>
  PROVIDERS[providerName] ?? PROVIDERS.anthropic;

const parseProviderPrefix = (content: string) => {
  const colonIdx = content.indexOf(":");
  const hasProvider = colonIdx > 0 && colonIdx < MAX_PROVIDER_PREFIX_LEN;

  return {
    content: hasProvider ? content.slice(colonIdx + 1) : content,
    providerName: hasProvider ? content.slice(0, colonIdx) : "anthropic",
  };
};

const notifyBranch = (
  ws: { send: (data: string) => void },
  newConvId: string | null,
) => {
  if (!newConvId) {
    return;
  }

  ws.send(JSON.stringify({ conversationId: newConvId, type: "branched" }));
};

const handleMessage = async (
  ws: { readyState: number; send: (data: string) => void },
  raw: unknown,
) => {
  const msg = parseAIMessage(raw);

  if (!msg) {
    return;
  }

  if (msg.type === "cancel" && msg.conversationId) {
    conversations.abort(msg.conversationId);

    return;
  }

  if (msg.type === "branch") {
    const newConvId = conversations.branch(msg.messageId, msg.conversationId);
    notifyBranch(ws, newConvId);

    return;
  }

  if (msg.type !== "message") {
    return;
  }

  const conversationId = msg.conversationId ?? crypto.randomUUID();
  const messageId = crypto.randomUUID();
  conversations.getOrCreate(conversationId);
  const history = conversations.getHistory(conversationId);
  const controller = conversations.getAbortController(conversationId);

  const { content, providerName } = parseProviderPrefix(msg.content);

  conversations.appendMessage(conversationId, {
    content,
    conversationId,
    id: messageId,
    role: "user",
    timestamp: Date.now(),
  });

  await streamAI(ws, conversationId, messageId, {
    maxTurns: 5,
    messages: [...history, { content, role: "user" }],
    model: MODEL_MAP[providerName] ?? MODEL_MAP.anthropic,
    provider: resolveProvider(providerName),
    signal: controller.signal,
    systemPrompt:
      "You are a helpful assistant. You have access to a weather tool. Keep responses concise.",
    tools,
    onComplete: (fullResponse) => {
      conversations.appendMessage(conversationId, {
        content: fullResponse,
        conversationId,
        id: crypto.randomUUID(),
        role: "assistant",
        timestamp: Date.now(),
      });
    },
  });
};

const server = new Elysia()
  .use(absolutejs)
  .use(pagesPlugin(manifest))
  .ws("/chat", {
    message: handleMessage,
  })
  .use(networking)
  .on("error", (error) => {
    const { request } = error;
    console.error(
      `Server error on ${request.method} ${request.url}: ${error.message}`,
    );
  });

export type Server = typeof server;

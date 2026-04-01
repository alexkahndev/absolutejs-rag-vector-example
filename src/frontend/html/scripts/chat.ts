const WS_OPEN = 1;
const RECONNECT_DELAY = 1000;

const MODELS: Record<string, string[]> = {
  anthropic: ["claude-sonnet-4-6", "claude-opus-4-6", "claude-haiku-4-5"],
  ollama: ["qwen3", "llama3.2", "mistral"],
  openai: ["gpt-4o-mini", "gpt-4o"],
};

let provider = "anthropic";
let [model] = MODELS.anthropic;
const conversationId = crypto.randomUUID();
let currentMessageEl: HTMLElement | null = null;

const messagesEl = document.getElementById("messages");
const form = document.getElementById("chat-form");
const modelContainer = document.getElementById("model-selector");

if (
  !(messagesEl instanceof HTMLElement) ||
  !(form instanceof HTMLFormElement) ||
  !(modelContainer instanceof HTMLElement)
) {
  throw new Error("Missing required DOM elements");
}

const getInput = () => {
  const inputEl = form.elements.namedItem("input");

  if (!(inputEl instanceof HTMLInputElement)) {
    throw new Error("Missing input element");
  }

  return inputEl;
};

const chatInput = getInput();

const { protocol, host } = window.location;
const wsProtocol = protocol === "https:" ? "wss:" : "ws:";
const wsUrl = `${wsProtocol}//${host}/chat`;
let socket = new WebSocket(wsUrl);

const renderModelButtons = () => {
  modelContainer.innerHTML = "";
  const models = MODELS[provider] ?? [];

  const handleModelClick = (mod: string, btn: HTMLButtonElement) => {
    model = mod;
    chatInput.placeholder = `Ask ${mod}...`;

    for (const other of modelContainer.querySelectorAll("button")) {
      other.classList.remove("active");
    }

    btn.classList.add("active");
  };

  for (const mod of models) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = mod;
    btn.dataset.model = mod;
    btn.classList.toggle("active", mod === model);
    btn.addEventListener("click", () => handleModelClick(mod, btn));
    modelContainer.appendChild(btn);
  }
};

const providerButtons = document.querySelectorAll<HTMLButtonElement>(
  ".provider-selector button",
);

const setActiveProvider = (btn: HTMLButtonElement) => {
  provider = btn.dataset.provider ?? "anthropic";
  model = (MODELS[provider] ?? [])[0] ?? provider;

  for (const other of providerButtons) {
    other.classList.remove("active");
  }

  btn.classList.add("active");
  chatInput.placeholder = `Ask ${model}...`;
  renderModelButtons();
};

for (const btn of providerButtons) {
  btn.addEventListener("click", () => setActiveProvider(btn));
}

renderModelButtons();

const clearEmptyState = () => {
  const empty = messagesEl.querySelector(".empty-state");

  if (empty) {
    empty.remove();
  }
};

const addUserMessage = (content: string) => {
  clearEmptyState();
  const div = document.createElement("div");
  div.className = "message";
  div.dataset.role = "user";
  div.textContent = content;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
};

const getOrCreateAssistantMessage = () => {
  if (currentMessageEl) {
    return currentMessageEl;
  }

  const div = document.createElement("div");
  div.className = "message";
  div.dataset.role = "assistant";
  messagesEl.appendChild(div);
  currentMessageEl = div;

  return div;
};

const setStreaming = (streaming: boolean) => {
  chatInput.disabled = streaming;
  const btn = form.querySelector("button");

  if (!btn) {
    return;
  }

  btn.textContent = streaming ? "Stop" : "Send";
  btn.type = streaming ? "button" : "submit";

  if (streaming) {
    btn.classList.add("cancel");
    btn.onclick = () => {
      socket.send(JSON.stringify({ conversationId, type: "cancel" }));
    };
  } else {
    btn.classList.remove("cancel");
    btn.onclick = null;
  }
};

const handleChunk = (msg: Record<string, unknown>) => {
  const element = getOrCreateAssistantMessage();
  element.textContent = (element.textContent ?? "") + String(msg.content ?? "");
  messagesEl.scrollTop = messagesEl.scrollHeight;
};

const handleToolStatus = (msg: Record<string, unknown>) => {
  const element = getOrCreateAssistantMessage();
  const toolDiv = document.createElement("div");
  const isRunning = msg.status === "running";
  toolDiv.className = `tool-status ${isRunning ? "running" : ""}`;
  toolDiv.textContent = isRunning
    ? `Running ${msg.name}...`
    : `${msg.name}: ${msg.result}`;
  element.appendChild(toolDiv);
};

const handleError = (msg: Record<string, unknown>) => {
  currentMessageEl = null;
  setStreaming(false);
  const div = document.createElement("div");
  div.className = "tool-status running";
  div.textContent = `Error: ${String(msg.message ?? "Unknown error")}`;
  messagesEl.appendChild(div);
};

socket.onmessage = (event: MessageEvent) => {
  const msg = JSON.parse(String(event.data));

  if (msg.type === "chunk") {
    handleChunk(msg);
  }

  if (msg.type === "tool_status") {
    handleToolStatus(msg);
  }

  if (msg.type === "complete") {
    currentMessageEl = null;
    setStreaming(false);
  }

  if (msg.type === "error") {
    handleError(msg);
  }
};

socket.onclose = () => {
  setTimeout(() => {
    socket = new WebSocket(wsUrl);
  }, RECONNECT_DELAY);
};

form.addEventListener("submit", (evt: Event) => {
  evt.preventDefault();
  const value = chatInput.value.trim();

  if (!value || socket.readyState !== WS_OPEN) {
    return;
  }

  addUserMessage(value);
  socket.send(
    JSON.stringify({
      content: `${provider}:${model}:${value}`,
      conversationId,
      type: "message",
    }),
  );
  chatInput.value = "";
  setStreaming(true);
});

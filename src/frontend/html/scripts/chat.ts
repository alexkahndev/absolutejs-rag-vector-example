const WS_OPEN = 1;
const RECONNECT_DELAY = 1000;
let provider = "anthropic";
const conversationId = crypto.randomUUID();
let currentMessageEl: HTMLElement | null = null;

const messagesEl = document.getElementById("messages");
const form = document.getElementById("chat-form");

if (
  !(messagesEl instanceof HTMLElement) ||
  !(form instanceof HTMLFormElement)
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

const providerButtons = document.querySelectorAll<HTMLButtonElement>(
  ".provider-selector button",
);

const setActiveProvider = (btn: HTMLButtonElement) => {
  provider = btn.dataset.provider ?? "anthropic";

  for (const other of providerButtons) {
    other.classList.remove("active");
  }

  btn.classList.add("active");
  chatInput.placeholder = `Ask ${provider} anything...`;
};

for (const btn of providerButtons) {
  btn.addEventListener("click", () => setActiveProvider(btn));
}

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
      content: `${provider}:${value}`,
      conversationId,
      type: "message",
    }),
  );
  chatInput.value = "";
  setStreaming(true);
});

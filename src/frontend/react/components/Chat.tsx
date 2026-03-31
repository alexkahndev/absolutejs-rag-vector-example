import { useState, useRef, useEffect, type FormEvent } from "react";
import { useAIStream } from "@absolutejs/absolute/react/ai";

const PROVIDERS = ["anthropic", "openai", "ollama"];

export const Chat = () => {
  const [provider, setProvider] = useState("anthropic");
  const { messages, send, cancel, isStreaming, error } = useAIStream("/chat");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
    const form = evt.currentTarget;
    const inputEl = form.elements.namedItem("input");

    if (!(inputEl instanceof HTMLInputElement)) {
      return;
    }

    const value = inputEl.value.trim();

    if (!value) {
      return;
    }

    send(`${provider}:${value}`);
    inputEl.value = "";
  };

  return (
    <div className="chat-container">
      <div className="provider-selector">
        {PROVIDERS.map((prov) => (
          <button
            className={prov === provider ? "active" : ""}
            key={prov}
            onClick={() => setProvider(prov)}
            type="button"
          >
            {prov}
          </button>
        ))}
      </div>

      <div className="messages">
        {messages.length === 0 && (
          <div className="empty-state">
            Send a message to start chatting. Try &quot;What&apos;s the weather
            in Tokyo?&quot;
          </div>
        )}
        {messages.map((msg) => (
          <div className="message" data-role={msg.role} key={msg.id}>
            {msg.content}
            {msg.isStreaming && <span className="cursor" />}
            {msg.toolCalls?.map((tool) => (
              <div
                className={`tool-status ${tool.result ? "" : "running"}`}
                key={`${msg.id}-${tool.name}`}
              >
                {tool.result
                  ? `${tool.name}: ${tool.result}`
                  : `Running ${tool.name}...`}
              </div>
            ))}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {error && <div className="tool-status running">Error: {error}</div>}

      <form className="chat-form" onSubmit={handleSubmit}>
        <input
          autoComplete="off"
          disabled={isStreaming}
          name="input"
          placeholder={`Ask ${provider} anything...`}
          ref={inputRef}
        />
        {isStreaming ? (
          <button className="cancel" onClick={cancel} type="button">
            Stop
          </button>
        ) : (
          <button type="submit">Send</button>
        )}
      </form>
    </div>
  );
};

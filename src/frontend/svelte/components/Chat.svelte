<script lang="ts">
  import { createAIStream } from "@absolutejs/absolute/svelte/ai";
  import {
    MODELS_BY_PROVIDER as MODELS,
    PROVIDER_IDS as PROVIDERS,
  } from "../../models";
  import { stripPrefix } from "../../constants";
  import type { AIMessage } from "@absolutejs/absolute";

  let provider = $state("anthropic");
  let model = $state(MODELS.anthropic[0]);
  let inputValue = $state("");

  const stream = createAIStream("/chat");

  // Bridge the stream's plain getters into Svelte reactive state
  let messages: AIMessage[] = $state([]);
  let isStreaming = $state(false);
  let error: string | null = $state(null);

  // Poll every 50ms to sync stream state into reactive vars
  const POLL_INTERVAL = 50;
  let interval: ReturnType<typeof setInterval> | undefined;

  $effect(() => {
    interval = setInterval(() => {
      messages = stream.messages;
      isStreaming = stream.isStreaming;
      error = stream.error;
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  });

  const handleProviderChange = (prov: string) => {
    provider = prov;
    model = MODELS[prov][0];
  };

  const handleSubmit = (evt: Event) => {
    evt.preventDefault();
    const value = inputValue.trim();
    if (!value) return;
    stream.send(`${provider}:${model}:${value}`);
    inputValue = "";
  };
</script>

<div class="chat-container">
  <div class="selector-row">
    <div class="provider-selector">
      {#each PROVIDERS as prov}
        <button
          class:active={prov === provider}
          onclick={() => handleProviderChange(prov)}
          type="button"
        >
          {prov}
        </button>
      {/each}
    </div>
    <div class="model-selector">
      {#each MODELS[provider] as mod}
        <button
          class:active={mod === model}
          onclick={() => (model = mod)}
          type="button"
        >
          {mod}
        </button>
      {/each}
    </div>
  </div>

  <div class="messages">
    {#if messages.length === 0}
      <div class="empty-state">
        Send a message to start chatting. Try "What do you have under $50?"
      </div>
    {/if}
    {#each messages as msg (msg.id)}
      <div class="message" data-role={msg.role}>
        {msg.role === "user" ? stripPrefix(msg.content) : msg.content}
        {#if msg.isStreaming}<span class="cursor"></span>{/if}
        {#if msg.toolCalls}
          {#each msg.toolCalls as tool}
            <div class="tool-status" class:running={!tool.result}>
              {tool.result
                ? `${tool.name}: ${tool.result}`
                : `Running ${tool.name}...`}
            </div>
          {/each}
        {/if}
      </div>
    {/each}
  </div>

  {#if error}
    <div class="tool-status running">Error: {error}</div>
  {/if}

  <form class="chat-form" onsubmit={handleSubmit}>
    <input
      autocomplete="off"
      bind:value={inputValue}
      disabled={isStreaming}
      name="input"
      placeholder={`Ask ${model}...`}
    />
    {#if isStreaming}
      <button class="cancel" onclick={() => stream.cancel()} type="button"
        >Stop</button
      >
    {:else}
      <button type="submit">Send</button>
    {/if}
  </form>
</div>

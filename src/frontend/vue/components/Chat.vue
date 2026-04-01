<script setup lang="ts">
import { ref } from "vue";
import { useAIStream } from "@absolutejs/absolute/vue/ai";
import {
  MODELS_BY_PROVIDER as MODELS,
  PROVIDER_IDS as PROVIDERS,
} from "../../models";
import { stripPrefix } from "../../constants";

const provider = ref("anthropic");
const model = ref(MODELS.anthropic[0]);
const inputValue = ref("");

const { messages, send, cancel, isStreaming, error } = useAIStream("/chat");

const handleProviderChange = (prov: string) => {
  provider.value = prov;
  model.value = MODELS[prov][0];
};

const handleSubmit = (evt: Event) => {
  evt.preventDefault();
  const value = inputValue.value.trim();
  if (!value) return;
  send(`${provider.value}:${model.value}:${value}`);
  inputValue.value = "";
};
</script>

<template>
  <div class="chat-container">
    <div class="selector-row">
      <div class="provider-selector">
        <button
          v-for="prov in PROVIDERS"
          :key="prov"
          :class="{ active: prov === provider }"
          type="button"
          @click="handleProviderChange(prov)"
        >
          {{ prov }}
        </button>
      </div>
      <div class="model-selector">
        <button
          v-for="mod in MODELS[provider]"
          :key="mod"
          :class="{ active: mod === model }"
          type="button"
          @click="model = mod"
        >
          {{ mod }}
        </button>
      </div>
    </div>

    <div class="messages">
      <div v-if="messages.length === 0" class="empty-state">
        Send a message to start chatting. Try "What do you have under $50?"
      </div>
      <div
        v-for="msg in messages"
        :key="msg.id"
        class="message"
        :data-role="msg.role"
      >
        {{ msg.role === "user" ? stripPrefix(msg.content) : msg.content }}
        <span v-if="msg.isStreaming" class="cursor" />
        <template v-if="msg.toolCalls">
          <div
            v-for="tool in msg.toolCalls"
            :key="`${msg.id}-${tool.name}`"
            class="tool-status"
            :class="{ running: !tool.result }"
          >
            {{
              tool.result
                ? `${tool.name}: ${tool.result}`
                : `Running ${tool.name}...`
            }}
          </div>
        </template>
      </div>
    </div>

    <div v-if="error" class="tool-status running">Error: {{ error }}</div>

    <form class="chat-form" @submit="handleSubmit">
      <input
        v-model="inputValue"
        autocomplete="off"
        :disabled="isStreaming"
        name="input"
        :placeholder="`Ask ${model}...`"
      />
      <button v-if="isStreaming" class="cancel" type="button" @click="cancel">
        Stop
      </button>
      <button v-else type="submit">Send</button>
    </form>
  </div>
</template>

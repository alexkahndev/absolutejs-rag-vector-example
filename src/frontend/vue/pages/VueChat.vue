<script setup lang="ts">
import Chat from "../components/Chat.vue";
</script>

<template>
  <header>
    <a class="logo" href="/">
      <img alt="AbsoluteJS" height="24" src="/assets/png/absolutejs-temp.png" />
      AbsoluteJS
    </a>
    <nav>
      <a href="/">React</a>
      <a href="/svelte">Svelte</a>
      <a class="active" href="/vue">Vue</a>
      <a href="/angular">Angular</a>
      <a href="/html">HTML</a>
      <a href="/htmx">HTMX</a>
    </nav>
  </header>
  <Chat />
  <p class="footer">
    <img src="/assets/png/absolutejs-temp.png" alt="" />
    Powered by
    <a href="https://absolutejs.com" target="_blank" rel="noopener noreferrer"
      >AbsoluteJS</a
    >
  </p>
</template>

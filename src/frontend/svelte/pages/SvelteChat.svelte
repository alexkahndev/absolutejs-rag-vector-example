<script lang="ts">
  import Head from "@absolutejs/absolute/svelte/components/Head.js";
  import Chat from "../components/Chat.svelte";

  type SvelteChatProps = {
    cssPath?: string;
  };

  let { cssPath }: SvelteChatProps = $props();
</script>

<Head
  title="AbsoluteJS AI Chat - Svelte"
  description="AI streaming demo with Svelte, powered by AbsoluteJS."
  {cssPath}
/>

<header>
  <a class="logo" href="/">
    <img alt="AbsoluteJS" height="24" src="/assets/png/absolutejs-temp.png" />
    AbsoluteJS
  </a>
  <nav>
    <a href="/">React</a>
    <a class="active" href="/svelte">Svelte</a>
    <a href="/vue">Vue</a>
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

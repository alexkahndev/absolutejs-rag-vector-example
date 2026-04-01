import { Component } from "@angular/core";
import { ChatComponent } from "../components/chat.component";

@Component({
  imports: [ChatComponent],
  selector: "angular-page",
  standalone: true,
  template: `
    <header>
      <a href="/" class="logo">
        <img
          src="/assets/png/absolutejs-temp.png"
          height="24"
          alt="AbsoluteJS"
        />
        AbsoluteJS
      </a>
      <nav>
        <a href="/">React</a>
        <a href="/svelte">Svelte</a>
        <a href="/vue">Vue</a>
        <a href="/angular" class="active">Angular</a>
        <a href="/html">HTML</a>
        <a href="/htmx">HTMX</a>
      </nav>
    </header>
    <app-chat />
    <p class="footer">
      <img src="/assets/png/absolutejs-temp.png" alt="" />
      Powered by
      <a href="https://absolutejs.com" target="_blank" rel="noopener noreferrer"
        >AbsoluteJS</a
      >
    </p>
  `,
})
export class AngularChatComponent {}

export const factory = () => AngularChatComponent;

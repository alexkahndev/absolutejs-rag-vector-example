import { Component, signal, inject } from "@angular/core";
import { NgClass } from "@angular/common";
import { AIStreamService } from "@absolutejs/absolute/angular/ai";
import {
  MODELS_BY_PROVIDER as MODELS,
  PROVIDER_IDS as PROVIDERS,
} from "../../models";
import { stripPrefix } from "../../constants";

@Component({
  imports: [NgClass],
  selector: "app-chat",
  standalone: true,
  template: `
    <div class="chat-container">
      <div class="selector-row">
        <div class="provider-selector">
          @for (prov of providers; track prov) {
            <button
              [ngClass]="{ active: prov === provider() }"
              (click)="selectProvider(prov)"
              type="button"
            >
              {{ prov }}
            </button>
          }
        </div>
        <div class="model-selector">
          @for (mod of currentModels(); track mod) {
            <button
              [ngClass]="{ active: mod === model() }"
              (click)="model.set(mod)"
              type="button"
            >
              {{ mod }}
            </button>
          }
        </div>
      </div>

      <div class="messages">
        @if (chat.messages().length === 0) {
          <div class="empty-state">
            Send a message to start chatting. Try "What do you have under $50?"
          </div>
        }
        @for (msg of chat.messages(); track msg.id) {
          <div class="message" [attr.data-role]="msg.role">
            {{ msg.role === "user" ? cleanContent(msg.content) : msg.content }}
            @if (msg.isStreaming) {
              <span class="cursor"></span>
            }
            @if (msg.toolCalls) {
              @for (tool of msg.toolCalls; track tool.name) {
                <div class="tool-status" [ngClass]="{ running: !tool.result }">
                  {{
                    tool.result
                      ? tool.name + ": " + tool.result
                      : "Running " + tool.name + "..."
                  }}
                </div>
              }
            }
          </div>
        }
      </div>

      @if (chat.error()) {
        <div class="tool-status running">Error: {{ chat.error() }}</div>
      }

      <form class="chat-form" (submit)="handleSubmit($event)">
        <input
          autocomplete="off"
          [disabled]="chat.isStreaming()"
          name="input"
          [placeholder]="'Ask ' + model() + '...'"
        />
        @if (chat.isStreaming()) {
          <button class="cancel" (click)="chat.cancel()" type="button">
            Stop
          </button>
        } @else {
          <button type="submit">Send</button>
        }
      </form>
    </div>
  `,
})
export class ChatComponent {
  providers = PROVIDERS;
  models = MODELS;
  provider = signal("anthropic");
  model = signal(MODELS["anthropic"][0]);

  currentModels = () => this.models[this.provider()] ?? [];

  private aiService = inject(AIStreamService);
  chat = this.aiService.connect("/chat");

  cleanContent = stripPrefix;

  selectProvider(prov: string) {
    this.provider.set(prov);
    this.model.set((this.models[prov] ?? [])[0] ?? prov);
  }

  handleSubmit(evt: Event) {
    evt.preventDefault();
    const form = evt.target;

    if (!(form instanceof HTMLFormElement)) {
      return;
    }

    const inputEl = form.elements.namedItem("input");

    if (!(inputEl instanceof HTMLInputElement)) {
      return;
    }

    const value = inputEl.value.trim();

    if (!value) {
      return;
    }

    this.chat.send(`${this.provider()}:${this.model()}:${value}`);
    inputEl.value = "";
  }
}

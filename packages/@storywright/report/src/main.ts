import { mount } from "svelte";
import App from "./App.svelte";
import { initTheme } from "./lib/theme.svelte.js";
import type { ReportSummary } from "./lib/types.js";

declare global {
  interface Window {
    __STORYWRIGHT_SUMMARY__?: ReportSummary;
  }
}

async function init() {
  initTheme();

  let summary: ReportSummary;

  if (window.__STORYWRIGHT_SUMMARY__) {
    summary = window.__STORYWRIGHT_SUMMARY__;
  } else {
    try {
      const response = await fetch("./summary.json");
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      summary = (await response.json()) as ReportSummary;
    } catch (err) {
      const target = document.getElementById("app") ?? document.body;
      target.innerHTML = `<div style="padding:2rem;text-align:center;color:#cf222e;font-family:system-ui">
				<h2>Failed to load report data</h2>
				<p style="color:#656d76;margin-top:0.5rem">${err instanceof Error ? err.message : "Unknown error"}</p>
			</div>`;
      return;
    }
  }

  mount(App, {
    target: document.getElementById("app") ?? document.body,
    props: { summary },
  });
}

void init();

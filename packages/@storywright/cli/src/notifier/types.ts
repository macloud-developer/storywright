import type { StorywrightConfig } from "../config/types.js";
import type { TestSummary } from "../core/types.js";

export interface Notifier {
  name: string;
  notify(context: NotificationContext): Promise<void>;
}

export interface NotificationContext {
  summary: TestSummary;
  exitCode: number;
  reportDir: string;
  reportUrl?: string;
  config: StorywrightConfig;
}

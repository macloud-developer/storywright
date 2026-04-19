import { consola } from "consola";
import type { NotificationContext, Notifier } from "./types.js";

export async function runNotifiers(
  notifiers: Notifier[],
  context: NotificationContext,
): Promise<void> {
  for (const notifier of notifiers) {
    try {
      await notifier.notify(context);
      consola.success(`Notification sent: ${notifier.name}`);
    } catch (error) {
      consola.warn(
        `Notification failed: ${notifier.name}`,
        error instanceof Error ? error.message : error,
      );
    }
  }
}

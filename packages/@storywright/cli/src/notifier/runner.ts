import { logger } from "../utils/logger.js";
import type { NotificationContext, Notifier } from "./types.js";

export async function runNotifiers(
  notifiers: Notifier[],
  context: NotificationContext,
): Promise<void> {
  for (const notifier of notifiers) {
    try {
      const result = await notifier.notify(context);
      if (result.posted) {
        logger.success(`Notification sent: ${notifier.name}`);
      } else if (result.skipped) {
        logger.info(`Notification skipped: ${notifier.name} (${result.skipped})`);
      }
    } catch (error) {
      logger.warn(
        `Notification failed: ${notifier.name}`,
        error instanceof Error ? error.message : error,
      );
    }
  }
}

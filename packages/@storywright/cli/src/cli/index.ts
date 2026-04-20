import { defineCommand, runMain } from "citty";
import { downloadCommand } from "./commands/download.js";
import { initCommand } from "./commands/init.js";
import { notifyCommand } from "./commands/notify.js";
import { reportCommand } from "./commands/report.js";
import { testCommand } from "./commands/test.js";
import { updateCommand } from "./commands/update.js";
import { uploadCommand } from "./commands/upload.js";

const main = defineCommand({
  meta: {
    name: "storywright",
    version: __PKG_VERSION__,
    description: "Zero-config visual regression testing powered by Storybook + Playwright",
  },
  subCommands: {
    test: testCommand,
    update: updateCommand,
    upload: uploadCommand,
    download: downloadCommand,
    report: reportCommand,
    init: initCommand,
    notify: notifyCommand,
  },
});

void runMain(main);

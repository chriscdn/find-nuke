import { describe, expect, test } from "vitest";
import { findNuke } from "../src";
import { Duration } from "@chriscdn/duration";

findNuke("./_test", {
    olderThan: Duration.with({ days: 4 }),
    extensions: [".pdf"],
    dryRun: true,
    deleteEmptyDirectories: true,
}).then((values) => {
    console.log(values);
});

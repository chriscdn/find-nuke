import { Duration } from "@chriscdn/duration";
type Options = {
    extensions?: string[];
    olderThan?: Duration;
    dryRun?: boolean;
    deleteEmptyDirectories?: boolean;
    verbose?: boolean;
};
/**
 * @param path
 * @param options
 * @returns
 */
declare const findNuke: (path: string, options?: Options) => Promise<string[]>;
export { findNuke };

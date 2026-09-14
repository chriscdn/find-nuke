//#region src/index.d.ts
type Options = {
  extensions?: string[];
  olderThan?: number;
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
//#endregion
export { findNuke };
//# sourceMappingURL=index.d.mts.map
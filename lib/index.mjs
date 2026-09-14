import { Duration } from "@chriscdn/duration";
import { promises } from "fs";
import { extname, resolve } from "path";
import { rimraf } from "rimraf";
//#region src/index.ts
const findNukeFile = async (filePath, stats, now, options) => {
	const extensions = options.extensions;
	const olderThan = options.olderThan ?? 0;
	const mtime = stats.mtime.getTime();
	const extension = extname(filePath);
	const _olderThan = Duration.with({ milliseconds: olderThan });
	const cond1 = olderThan === void 0 || mtime < _olderThan.subtractFrom(now).getTime();
	const cond2 = extensions === void 0 || extensions.includes(extension.toLowerCase());
	return {
		filePath,
		mtime,
		extension,
		markedForDelete: cond1 && cond2
	};
};
const findNukeFileOrDirectory = async (filePath, now, options) => {
	const stats = await promises.stat(filePath);
	if (stats.isFile()) return [await findNukeFile(filePath, stats, now, options)];
	else if (stats.isDirectory()) return await findNukeDirectory(filePath, now, options);
	else throw new Error(`Unable to resolve: ${filePath}`);
};
const findNukeDirectory = async (path, now, options = {}) => {
	const filesInDirectory = await promises.readdir(path);
	return (await Promise.all(filesInDirectory.map((fileName) => findNukeFileOrDirectory(resolve(path, fileName), now, options)))).flat();
};
const isDirectoryAndEmpty = async (path) => {
	if ((await promises.stat(path)).isDirectory()) return (await promises.readdir(path)).length === 0;
	else return false;
};
/**
* Recursively delete empty directories.
*
* @param path
* @param reallyDelete {boolean} Used in the recursion call to prevent deletion of the root folder.
*/
const doDeleteEmptyDirectories = async (path, reallyDelete = false) => {
	const filesInDirectory = await promises.readdir(path);
	await Promise.all(filesInDirectory.map(async (dirPath) => {
		const resolvedDirPath = resolve(path, dirPath);
		if ((await promises.stat(resolvedDirPath)).isDirectory()) await doDeleteEmptyDirectories(resolvedDirPath, true);
	}));
	if (reallyDelete && await isDirectoryAndEmpty(path)) await rimraf(path);
};
/**
* @param path
* @param options
* @returns
*/
const findNuke = async (path, options = {}) => {
	const now = /* @__PURE__ */ new Date();
	const dryRun = options.dryRun ?? false;
	const verbose = options.verbose ?? false;
	const items = await findNukeDirectory(path, now, options);
	const itemsToDelete = items.filter((item) => item.markedForDelete);
	const deleteEmptyDirectories = options.deleteEmptyDirectories ?? false;
	if (verbose) {
		console.log("********** FIND NUKE");
		console.log("Root directory      : ", resolve(path));
		console.log("Extensions          : ", options.extensions);
		console.log("Files found         : ", items.length);
		console.log("Marked for deletion : ", itemsToDelete.length);
		console.log("Dry run             : ", dryRun);
		console.log("Delete Empty Dirs   : ", deleteEmptyDirectories);
		console.log("********************");
	}
	if (dryRun) {} else {
		await Promise.all(itemsToDelete.map((item) => rimraf.rimraf(item.filePath)));
		if (deleteEmptyDirectories) await doDeleteEmptyDirectories(path);
	}
	return itemsToDelete.map((item) => item.filePath);
};
//#endregion
export { findNuke };

//# sourceMappingURL=index.mjs.map
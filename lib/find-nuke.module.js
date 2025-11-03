import { Duration } from '@chriscdn/duration';
import { promises } from 'fs';
import { resolve, extname } from 'path';
import { rimraf } from 'rimraf';

const findNukeFile = async (filePath, stats, now, options) => {
  var _options$olderThan;
  const extensions = options.extensions;
  const olderThan = (_options$olderThan = options.olderThan) != null ? _options$olderThan : 0;
  const mtime = stats.mtime.getTime();
  const extension = extname(filePath);
  const _olderThan = olderThan instanceof Duration ? olderThan : Duration.with({
    milliseconds: olderThan
  });
  // If the file is older than the olderThan Duration
  const cond1 = olderThan === undefined || mtime < _olderThan.subtractFrom(now).getTime();
  // If the file has a specified extension
  const cond2 = extensions === undefined || extensions.includes(extension.toLowerCase());
  const markedForDelete = cond1 && cond2;
  return {
    filePath,
    mtime,
    extension,
    markedForDelete
  };
};
const findNukeFileOrDirectory = async (filePath, now, options) => {
  const stats = await promises.stat(filePath);
  if (stats.isFile()) {
    return [await findNukeFile(filePath, stats, now, options)];
  } else if (stats.isDirectory()) {
    return await findNukeDirectory(filePath, now, options);
  } else {
    throw new Error(`Unable to resolve: ${filePath}`);
  }
};
const findNukeDirectory = async (path, now, options = {}) => {
  const filesInDirectory = await promises.readdir(path);
  const results = await Promise.all(filesInDirectory.map(fileName => findNukeFileOrDirectory(resolve(path, fileName), now, options)));
  return results.flat();
};
const isDirectoryAndEmpty = async path => {
  const stats = await promises.stat(path);
  if (stats.isDirectory()) {
    return (await promises.readdir(path)).length === 0;
  } else {
    return false;
  }
};
/**
 * Recursively delete empty directories.
 *
 * @param path
 * @param reallyDelete {boolean} Used in the recursion call to prevent deletion of the root folder.
 */
const doDeleteEmptyDirectories = async (path, reallyDelete = false) => {
  // 1. Recursively remove empty child directories
  const filesInDirectory = await promises.readdir(path);
  await Promise.all(filesInDirectory.map(async dirPath => {
    const resolvedDirPath = resolve(path, dirPath);
    const stats = await promises.stat(resolvedDirPath);
    if (stats.isDirectory()) {
      await doDeleteEmptyDirectories(resolvedDirPath, true);
    }
  }));
  // 2. Delete this directory if it's empty. The reallyDelete argument is to
  //    prevent the root directory from begin deleted.
  if (reallyDelete && (await isDirectoryAndEmpty(path))) {
    await rimraf(path);
  }
};
/**
 * @param path
 * @param options
 * @returns
 */
const findNuke = async (path, options = {}) => {
  var _options$dryRun, _options$verbose, _options$deleteEmptyD;
  const now = new Date();
  const dryRun = (_options$dryRun = options.dryRun) != null ? _options$dryRun : false;
  const verbose = (_options$verbose = options.verbose) != null ? _options$verbose : false;
  const items = await findNukeDirectory(path, now, options);
  const itemsToDelete = items.filter(item => item.markedForDelete);
  const deleteEmptyDirectories = (_options$deleteEmptyD = options.deleteEmptyDirectories) != null ? _options$deleteEmptyD : false;
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
  if (dryRun) ; else {
    await Promise.all(itemsToDelete.map(item => rimraf.rimraf(item.filePath)));
    if (deleteEmptyDirectories) {
      await doDeleteEmptyDirectories(path);
    }
  }
  return itemsToDelete.map(item => item.filePath);
};

export { findNuke };
//# sourceMappingURL=find-nuke.module.js.map

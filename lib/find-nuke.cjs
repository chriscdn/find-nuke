var duration = require('@chriscdn/duration');
var fs = require('fs');
var path = require('path');
var rimraf = require('rimraf');

const findNukeFile = async (filePath, stats, now, options) => {
  var _options$olderThan;
  const extensions = options.extensions;
  const olderThan = (_options$olderThan = options.olderThan) != null ? _options$olderThan : 0;
  const mtime = stats.mtime.getTime();
  const extension = path.extname(filePath);
  const _olderThan = olderThan instanceof duration.Duration ? olderThan : duration.Duration.with({
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
  const stats = await fs.promises.stat(filePath);
  if (stats.isFile()) {
    return [await findNukeFile(filePath, stats, now, options)];
  } else if (stats.isDirectory()) {
    return await findNukeDirectory(filePath, now, options);
  } else {
    throw new Error(`Unable to resolve: ${filePath}`);
  }
};
const findNukeDirectory = async (path$1, now, options = {}) => {
  const filesInDirectory = await fs.promises.readdir(path$1);
  const results = await Promise.all(filesInDirectory.map(fileName => findNukeFileOrDirectory(path.resolve(path$1, fileName), now, options)));
  return results.flat();
};
const isDirectoryAndEmpty = async path => {
  const stats = await fs.promises.stat(path);
  if (stats.isDirectory()) {
    return (await fs.promises.readdir(path)).length === 0;
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
const doDeleteEmptyDirectories = async (path$1, reallyDelete = false) => {
  // 1. Recursively remove empty child directories
  const filesInDirectory = await fs.promises.readdir(path$1);
  await Promise.all(filesInDirectory.map(async dirPath => {
    const resolvedDirPath = path.resolve(path$1, dirPath);
    const stats = await fs.promises.stat(resolvedDirPath);
    if (stats.isDirectory()) {
      await doDeleteEmptyDirectories(resolvedDirPath, true);
    }
  }));
  // 2. Delete this directory if it's empty. The reallyDelete argument is to
  //    prevent the root directory from begin deleted.
  if (reallyDelete && (await isDirectoryAndEmpty(path$1))) {
    await rimraf.rimraf(path$1);
  }
};
/**
 * @param path
 * @param options
 * @returns
 */
const findNuke = async (path$1, options = {}) => {
  var _options$dryRun, _options$verbose, _options$deleteEmptyD;
  const now = new Date();
  const dryRun = (_options$dryRun = options.dryRun) != null ? _options$dryRun : false;
  const verbose = (_options$verbose = options.verbose) != null ? _options$verbose : false;
  const items = await findNukeDirectory(path$1, now, options);
  const itemsToDelete = items.filter(item => item.markedForDelete);
  const deleteEmptyDirectories = (_options$deleteEmptyD = options.deleteEmptyDirectories) != null ? _options$deleteEmptyD : false;
  if (verbose) {
    console.log("********** FIND NUKE");
    console.log("Root directory      : ", path.resolve(path$1));
    console.log("Extensions          : ", options.extensions);
    console.log("Files found         : ", items.length);
    console.log("Marked for deletion : ", itemsToDelete.length);
    console.log("Dry run             : ", dryRun);
    console.log("Delete Empty Dirs   : ", deleteEmptyDirectories);
    console.log("********************");
  }
  if (dryRun) ; else {
    await Promise.all(itemsToDelete.map(item => rimraf.rimraf.rimraf(item.filePath)));
    if (deleteEmptyDirectories) {
      await doDeleteEmptyDirectories(path$1);
    }
  }
  return itemsToDelete.map(item => item.filePath);
};

exports.findNuke = findNuke;
//# sourceMappingURL=find-nuke.cjs.map

import { Duration } from "@chriscdn/duration";
import { type Stats } from "fs";
import { promises as fsp } from "fs";
import { extname, resolve } from "path";
import { rimraf } from "rimraf";

type Options = {
    extensions?: string[];
    // milliseconds
    olderThan?: number;
    dryRun?: boolean;
    deleteEmptyDirectories?: boolean;
    verbose?: boolean;
};

type NukedFile = Awaited<ReturnType<typeof findNukeFile>>;

const findNukeFile = async (
    filePath: string,
    stats: Stats,
    now: Date,
    options: Options,
) => {
    const extensions = options.extensions;
    const olderThan = options.olderThan ?? 0;

    const mtime = stats.mtime.getTime();
    const extension = extname(filePath);

    const _olderThan = Duration.with({ milliseconds: olderThan });

    // If the file is older than the olderThan Duration
    const cond1 = olderThan === undefined ||
        mtime < _olderThan.subtractFrom(now).getTime();

    // If the file has a specified extension
    const cond2 = extensions === undefined ||
        extensions.includes(extension.toLowerCase());

    const markedForDelete = cond1 && cond2;

    return { filePath, mtime, extension, markedForDelete };
};

const findNukeFileOrDirectory = async (
    filePath: string,
    now: Date,
    options: Options,
): Promise<NukedFile[]> => {
    const stats = await fsp.stat(filePath);

    if (stats.isFile()) {
        return [await findNukeFile(filePath, stats, now, options)];
    } else if (stats.isDirectory()) {
        return await findNukeDirectory(filePath, now, options);
    } else {
        throw new Error(`Unable to resolve: ${filePath}`);
    }
};

const findNukeDirectory = async (
    path: string,
    now: Date,
    options: Options = {},
): Promise<NukedFile[]> => {
    const filesInDirectory = await fsp.readdir(path);

    const results = await Promise.all(
        filesInDirectory.map((fileName: string) =>
            findNukeFileOrDirectory(
                resolve(path, fileName),
                now,
                options,
            )
        ),
    );

    return results.flat();
};

const isDirectoryAndEmpty = async (path: string): Promise<boolean> => {
    const stats = await fsp.stat(path);

    if (stats.isDirectory()) {
        return (await fsp.readdir(path)).length === 0;
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
const doDeleteEmptyDirectories = async (
    path: string,
    reallyDelete = false,
): Promise<void> => {
    // 1. Recursively remove empty child directories
    const filesInDirectory = await fsp.readdir(path);

    await Promise.all(filesInDirectory.map(async (dirPath: string) => {
        const resolvedDirPath = resolve(path, dirPath);
        const stats = await fsp.stat(resolvedDirPath);

        if (stats.isDirectory()) {
            await doDeleteEmptyDirectories(resolvedDirPath, true);
        }
    }));

    // 2. Delete this directory if it's empty. The reallyDelete argument is to
    //    prevent the root directory from begin deleted.
    if (reallyDelete && await isDirectoryAndEmpty(path)) {
        await rimraf(path);
    }
};

/**
 * @param path
 * @param options
 * @returns
 */
const findNuke = async (path: string, options: Options = {}) => {
    const now = new Date();
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
    if (dryRun) {
        // do nothing
    } else {
        await Promise.all(
            itemsToDelete.map((item) => rimraf.rimraf(item.filePath)),
        );

        if (deleteEmptyDirectories) {
            await doDeleteEmptyDirectories(path);
        }
    }

    return itemsToDelete.map((item) => item.filePath);
};

export { findNuke };

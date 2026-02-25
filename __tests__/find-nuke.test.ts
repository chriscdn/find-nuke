import { describe, expect, test } from "vitest";
import { findNuke } from "../src";
import { Duration } from "@chriscdn/duration";
import { promises as fsp } from "fs";
import { resolve } from "path";
import temp from "temp";
import { pathExistsSync } from "path-exists";
// temp.track();

const now = new Date();
const yearAgo = Duration.with({ weeks: 52 }).ago();
// const rootDirectory = "./_test";

const generateRandom = () =>
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(23).substring(2, 5);

const createTestFileWithMtime = async (
    directory: string,
    mtime: Date,
    extension: string,
) => {
    const filePath = resolve(directory, `${generateRandom()}.${extension}`);

    await fsp.writeFile(filePath, filePath, "utf-8");

    await fsp.utimes(filePath, mtime, mtime);
};

describe("All test", async () => {
    const rootDirectory = await temp.mkdir("find-nuke-test");
    console.log(rootDirectory);

    const directoryContentsCount = async () =>
        (await fsp.readdir(rootDirectory)).length;

    test("Deleting Old Documents", async () => {
        await findNuke(rootDirectory, { deleteEmptyDirectories: true });

        expect(pathExistsSync(rootDirectory)).toBe(true);

        expect(await directoryContentsCount()).toBe(0);

        const subDirectory = resolve(rootDirectory, generateRandom());

        await fsp.mkdir(subDirectory);

        await Promise.all([
            createTestFileWithMtime(rootDirectory, yearAgo, "txt"),
            createTestFileWithMtime(rootDirectory, yearAgo, "txt"),
            createTestFileWithMtime(rootDirectory, yearAgo, "pdf"),
            createTestFileWithMtime(rootDirectory, now, "txt"),
            createTestFileWithMtime(rootDirectory, now, "txt"),
            createTestFileWithMtime(rootDirectory, now, "txt"),
            createTestFileWithMtime(subDirectory, yearAgo, "txt"),
            createTestFileWithMtime(subDirectory, yearAgo, "txt"),
            createTestFileWithMtime(subDirectory, yearAgo, "txt"),
            fsp.mkdir(resolve(rootDirectory, generateRandom())),
        ]);

        expect(await directoryContentsCount()).toBe(8);

        const deleteResults1 = await findNuke(rootDirectory, {
            olderThan: Duration.toMilliseconds({ days: 1 }),
            extensions: [".pdf"],
        });

        expect(deleteResults1.length).toBe(1);

        expect(await directoryContentsCount()).toBe(7);

        await findNuke(rootDirectory, {
            olderThan: Duration.toMilliseconds({ days: 1 }),
            deleteEmptyDirectories: true,
            extensions: [".pdf"],
        });

        expect(await directoryContentsCount()).toBe(6);

        await findNuke(rootDirectory, {
            olderThan: Duration.toMilliseconds({ days: 1 }),
            deleteEmptyDirectories: true,
            extensions: [".txt"],
        });

        expect(await directoryContentsCount()).toBe(3);

        await findNuke(rootDirectory, {});

        expect(await directoryContentsCount()).toBe(0);
    });
});

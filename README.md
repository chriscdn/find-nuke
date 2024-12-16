# @chriscdn/find-nuke

A tool to recursively find and delete files with specified extensions that are older than a given duration.

## Installation

To install using npm:

```bash
npm install @chriscdn/promise-semaphore
```

To install using yarn:

```bash
yarn add @chriscdn/promise-semaphore
```

## Usage

```ts
const results = await findNuke("./file/path", {
  olderThan: Duration.with({ days: 4 }),
  extensions: [".pdf"],
  dryRun: true,
  deleteEmptyDirectories: true,
});
```

**Important:** All options are optional. If no options are provided, the function will delete **all files**, so use with caution.

### Options:

- `olderThan` _(optional)_: Deletes files older than the specified duration. This feature relies on the [@chriscdn/duration](https://github.com/chriscdn/duration) package.
- `extensions` _(optional)_: Specifies an array of file extensions (including the leading dot) to delete.
- `dryRun` _(optional)_: If set to `true`, lists files that would be deleted without actually deleting them. Defaults to `false`.
- `deleteEmptyDirectories` _(optional)_: If set to `true`, removes empty directories after file deletions. Defaults to `false`.

## License

[MIT](LICENSE)

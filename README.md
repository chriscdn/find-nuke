# @chriscdn/find-nuke

A tool to recursively find and delete files with specified extensions that are older than a given duration.

## Installation

To install using npm:

```bash
npm install @chriscdn/find-nuke
```

To install using yarn:

```bash
yarn add @chriscdn/find-nuke
```

## Usage

```ts
import { findNuke } from "@chriscdn/find-nuke";

const results = await findNuke("./file/path", {
  olderThan: Duration.with({ days: 4 }),
  extensions: [".pdf"],
  dryRun: true,
  deleteEmptyDirectories: true,
  verbose: false,
});
```

**Important:** All options are optional. If no options are provided, the function will delete **all files**, so use with caution.

### Options:

- `olderThan` _(optional)_: Deletes files older than the specified duration. This feature relies on the [@chriscdn/duration](https://github.com/chriscdn/duration) package.
- `extensions` _(optional)_: Specifies an array of file extensions (including the leading dot) to delete.
- `dryRun` _(optional)_: If set to `true`, lists files that would be deleted without actually deleting them. Defaults to `false`.
- `deleteEmptyDirectories` _(optional)_: If set to `true`, removes empty directories after file deletions. Does not include the root directory. Defaults to `false`.
- `verbse` _(optional)_: When set to `true`, additional details about the action are logged to the console. The default value is `false`.

## Running Tests

The tests simulate various use cases with different parameters.

```bash
yarn test
```

## License

[MIT](LICENSE)

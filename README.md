<p align="center">
  <img src="assets/logo.png" width="160" alt="Jev Marshal logo">
</p>

# Jev Marshal

Jev Marshal checks pull requests against your repository rules.

Write each rule as a plain question. Jev Marshal reads the Git change and reports if the change complies.

## Try it

You need Node.js 20 or later. The npm package is not published yet.

```sh
git clone https://github.com/LightningK0ala/jev-marshal.git
cd jev-marshal
npm ci
npm run build
node dist/cli.js init
```

The `init` command creates `jev-marshal.yml`.

## Add your API key

For CI, set `TYPESAFE_API_KEY` in your secret store.

For local use, run:

```sh
node dist/cli.js auth set
```

Jev Marshal stores the key in your user configuration folder. It does not put the key in your repository.

## Define rules

Edit `jev-marshal.yml`:

```yaml
version: 1
model: jev-latest
base: origin/main
threshold: 0.7

rules:
  - id: adr-required
    question: Does this change include an ADR when it makes an important architectural decision?
    level: error
    message: Add an ADR for the architectural decision.

  - id: storybook-required
    question: Does this change update Storybook when it adds, removes, or materially changes a UI component, page, or screen?
    level: error
    message: Add or update the related Storybook stories.
```

Use `error` to block the check. Use `warning` to report a result without a block.

## Run checks

Check the current branch against the configured base:

```sh
node dist/cli.js
```

Check staged changes:

```sh
node dist/cli.js --staged
```

Check another base:

```sh
node dist/cli.js --base origin/develop
```

View the exact request without an API call:

```sh
node dist/cli.js --dry-run
```

Use JSON output:

```sh
node dist/cli.js --format json
```

## Use GitHub Actions

```yaml
name: Jev Marshal

on:
  pull_request:

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: 22

      - run: npm ci
      - run: npm run build
      - run: node dist/cli.js
        env:
          TYPESAFE_API_KEY: ${{ secrets.TYPESAFE_API_KEY }}
```

Jev Marshal uses the pull request title, description, changed file list, and patch. It does not send the full repository.

## Results

Interactive terminals use color and clear status markers to make findings easy to scan:

```text
Jev Marshal
2 changed files · origin/main...HEAD

Results
✓ PASS    tests-required  96%
✗ FAIL    [error] docs-required  88%
  ↳ Update the documentation.

✗ Check failed
  1 passed · 1 violation
  1 blocking error
```

Each rule has one result:

- `compliant`
- `non_compliant`
- `not_applicable`
- `unknown`

An `unknown` result blocks an `error` rule. This prevents an incomplete patch from passing without review.

Color is disabled automatically when output is redirected or `--format json` is used. Set `NO_COLOR=1` to disable color explicitly, or `FORCE_COLOR=1` to enable it when the terminal is not detected automatically.

Exit code `0` means that no error rule failed. Exit code `1` means that an error rule failed. Exit code `2` means that the command could not complete.

## License

MIT

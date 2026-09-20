<p align="center">
  <img src="assets/logo.png" width="160" alt="Jev Marshal logo">
</p>

# Jev Marshal

Jev Marshal checks pull requests against your repository rules.

Write each rule as a plain question. Jev Marshal reads the Git change and reports if the change complies.

## Try it

You need Node.js 20 or later. Run Jev Marshal directly from npm—no installation required:

```sh
npx jev-marshal init
npx jev-marshal auth set
npx jev-marshal
```

Run these commands from the Git repository you want to check. The `init` command creates `jev-marshal.yml`; the first `npx` run may ask for confirmation before downloading the package.

## Add your API key

For CI, set `TYPESAFE_API_KEY` in your secret store.

For local use, run:

```sh
npx jev-marshal auth set
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
    threshold: 0.85
```

Use `error` to block the check. Use `warning` to report a result without a block.

The global `threshold` applies to all rules by default. Set `threshold` on a rule to override it for that rule. A threshold must be from `0.5` to `1`.

## Run checks

Check the current branch against the configured base:

```sh
npx jev-marshal
```

Check staged changes:

```sh
npx jev-marshal --staged
```

Check another base:

```sh
npx jev-marshal --base origin/develop
```

View the exact request without an API call:

```sh
npx jev-marshal --dry-run
```

Use JSON output:

```sh
npx jev-marshal --format json
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

      - run: npx --yes jev-marshal@0.1.0
        env:
          TYPESAFE_API_KEY: ${{ secrets.TYPESAFE_API_KEY }}
```

Pinning the version in CI keeps checks reproducible. Update `@0.1.0` when you are ready to adopt a new release.

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

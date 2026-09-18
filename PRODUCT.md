# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Open-source maintainers and software teams that review pull requests in GitHub.

## Product Purpose

Jev Marshal checks a pull request against repository rules. Maintainers write each rule as a plain question. The CLI reads the change and returns a typed decision for each rule.

## Positioning

Jev Marshal checks the meaning of a change and its repository obligations. It does not only check source syntax or formatting.

## Operating Context

Users run the CLI locally or in GitHub Actions. It receives the pull request title, description, changed file list, and patch. It does not send the full repository.

## Capabilities and Constraints

- Node.js 20 or later.
- Plain YAML configuration.
- Four decisions: `compliant`, `non_compliant`, `not_applicable`, and `unknown`.
- Error rules block on `non_compliant` and `unknown`.
- Warning rules report without blocking.
- The package is ready but is not yet published to npm.
- The marketing page must deploy as a static GitHub Pages site.

## Brand Commitments

- Product name: Jev Marshal.
- Voice: friendly, direct, and concise. Use STE100 principles.
- Existing mark: a geometric marshal badge with a pull-request check, in charcoal and warm amber.
- No person, mascot, weapon, or police imagery.

## Evidence on Hand

- Working TypeScript CLI and test suite.
- Existing README, example policy file, and GitHub Actions example.
- Existing logo and source prompt in `assets/`.
- No customer logos, testimonials, adoption figures, or benchmarks. Do not fabricate them.

## Product Principles

- Make repository policy simple to write.
- Make every decision clear and typed.
- Fail safely when evidence is incomplete.
- Send only the change context that the check needs.

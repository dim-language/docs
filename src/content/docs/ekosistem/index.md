---
title: Tools for working with DIM
description: Choose a tool to write, validate or share a map.
---

## TypeScript SDK

To check a model in a terminal or CI, run the script from the [tutorial](/mulai/). For a multi-file model, pass the entry file and the contents of each import to [`compileProject`](/referensi/cli/). CI can use the script’s exit code as its check result.

## Web map

If reviewers need to explore the model in a browser, [embed a map on an Astro page](/ekosistem/peta-web/). Readers can zoom in and select relations.

## DIM editor

Practice reading the [checkout map](/konsep/alur/). To run the editor application from source, use a checkout of the main DIM repository with its submodules and project toolchain.

Set `EXACT` to a checkout of [Exact](https://github.com/expo/exact) at commit `87e54bef26a99e068ccb04cc82c9d2965fa39651`.

```sh
moon run editor:build
bun run --cwd apps/editor start --loopback
```

Open the local address printed in the terminal. Select the API to Postgres arrow to trace the order write.

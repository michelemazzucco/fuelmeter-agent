# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single Mastra agent ("Fuel") that answers questions about a physical home diesel tank and records dip-stick readings. It is the conversational front-end for a separate Next.js app at `/Users/michele/Projects/fuelmeter`; this repo owns only the agent, its tools, and the wiring.

## Commands

```bash
npm run dev     # mastra dev — Studio + agent playground on localhost
npm run build   # mastra build → .mastra/output
npm start       # mastra start (serves the built output)
npx tsc --noEmit  # typecheck; tsconfig has noEmit, there is no emit step
```

There is no test suite and no linter configured.

## The vendored copy of the sibling project's lib

`src/fuelmeter-lib` is a **vendored copy** of `/Users/michele/Projects/fuelmeter/lib`, committed into this repo. It was a symlink; it is not one any more, so a fresh clone typechecks and builds on its own. The domain logic — the cm→litre calibration table (`tank-lookup.ts`), the seasonal consumption model (`predictions.ts`), and the `Reading`/`TankConfig` types — originates in the web app.

Consequences worth knowing before editing:

- The copy can drift from the web app. A change that belongs to both projects should be made in `/Users/michele/Projects/fuelmeter/lib` first, then copied back here.
- Prediction maths belongs in `predictions.ts`, not in a tool. Tools reshape its output for the model; they do not compute burn rates.

## One database, two kinds of table

`TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` is the only database the project uses. Both of these read it:

- **App data** (`readings`, `tank_config`) — reached through `src/mastra/db.ts`. Writes from `log_reading` land in the web app's real data.
- **Agent storage** — the `LibSQLStore` in `src/mastra/index.ts`, holding Memory threads and observability traces. Mastra creates its own tables; they sit beside the app tables in the same database.

Locally the URL points at the deployed Turso database, not at the web app's `local.db`.

All domain DB access goes through the two helpers in `db.ts` (`getConfig`, `getReadings`) plus the single insert in `log_reading`. `getReadings` returns newest-first; `computePrediction` re-sorts internally.

Both call sites build their client at module scope with `process.env.X!`. A missing variable therefore throws `LibsqlError: URL_INVALID` at import, before the server starts, and the message does not name the variable.

## Agent and tools

`src/mastra/agents/fuel-agent.ts` defines the agent; `src/mastra/tools/fuel-tools.ts` defines four tools, registered on the agent under snake_case keys (`get_tank_status`, `list_readings`, `log_reading`, `forecast_runout`) that match each tool's `id`. Keep those aligned — the instructions name the tools by those ids.

The instructions carry real behavioural constraints that the tools depend on: answer in litres and days, always route run-out questions through `forecast_runout` rather than estimating from raw readings, and say so plainly when `hasEnoughData` is false (fewer than two readings since the last refill). If you change what a tool returns, check whether the instructions still describe it accurately.

Model is `openai/gpt-4o-mini` via `OPENAI_API_KEY`. Tank constants (110 cm = 1564 L) are duplicated in the instructions prose and in `tank-lookup.ts`; if the tank ever changes, both need updating.

## Mastra version and docs

Pinned to `@mastra/core` 1.57.0 and the `mastra` CLI 1.23.0. Mastra's API has moved a lot across versions — verify against the pinned version rather than from memory. Two sources are wired up: the `mastra` skill in `.agents/skills/mastra/` (installed from `mastra-ai/skills`, pinned in `skills-lock.json`, symlinked into `.claude/skills/`) and the `@mastra/mcp-docs-server` MCP server declared in `.mcp.json`.

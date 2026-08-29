# fuelmeter-agent

There is a diesel tank in my basement and no sensor on it. I read the level with a dip stick every few weeks and write the number down. This repo is the chatbot that answers questions about that number: how much is left, when it runs out, and it also records a new reading when I tell it one.

It is a single [Mastra](https://mastra.ai) agent called Fuel. The web app that owns the data lives in a separate repo (`fuelmeter`, a Next.js app). This one owns only the agent, its four tools, and the wiring.

## Running it

You need Node 22.13 or newer, and a `.env` file. Copy the example and fill it in:

```bash
cp .env.example .env
npm install
npm run dev
```

`npm run dev` starts Mastra Studio on localhost, where you can talk to the agent and watch the tool calls. `npm run build` writes to `.mastra/output`, `npm start` serves that build.

There is no test suite. `npx tsc --noEmit` is the only check.

## The four tools

| Tool | What it does |
| --- | --- |
| `get_tank_status` | Latest reading, level in litres, how full the tank is |
| `list_readings` | Recent readings, newest first |
| `log_reading` | Writes a new dip-stick reading to the database |
| `forecast_runout` | Projects the run-out date from the seasonal consumption model |

The interesting one is `forecast_runout`. Diesel burn is not linear here, because most of it goes to heating and February is not August. The model that handles that lives in `src/fuelmeter-lib/predictions.ts`, copied over from the web app. The tool only reshapes its output. If you want to change the maths, change it there, not in a tool.

When there are fewer than two readings since the last refill, the forecast returns `hasEnoughData: false` and the agent is instructed to say so instead of inventing a date. That happens more often than I expected.

## Two things that will bite you

**One database, two kinds of table.** `TURSO_DATABASE_URL` points at the real Turso database, the same one the web app uses, including when you run locally. `log_reading` writes real data. Mastra also puts its own tables there for memory threads and traces, next to `readings` and `tank_config`.

**A missing environment variable fails at import.** Both database clients are built at module scope, so if `TURSO_DATABASE_URL` is not set you get `LibsqlError: URL_INVALID` before the server starts, and the message does not tell you which variable is missing. It is this one.

## The tank

110 cm on the dip stick is 1564 litres. That constant sits in two places, `tank-lookup.ts` and the agent instructions, so if I ever get a different tank I have to remember both. I probably will not remember both.

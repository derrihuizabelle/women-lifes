# Women's Lives

[![CI](https://github.com/derrihuizabelle/women-lifes/actions/workflows/ci.yml/badge.svg)](https://github.com/derrihuizabelle/women-lifes/actions/workflows/ci.yml)

A protest counter for violence against women in Brazil. The page has two parts:

- **Live counter:** goes up every time a Brazilian news outlet reports a woman's death as a possible femicide, with the latest stories in a carousel below it. It is fed by a streaming pipeline (Clojure, Kafka, Postgres) that reads the news, classifies each article, and groups articles about the same death into one case.
- **Historical counter:** an estimate of cases since 2018, built from official yearly reports (Atlas da Violência, Anuário Brasileiro de Segurança Pública, Disque 180, state security departments).

> **What the live number means.** It counts deaths *reported in the press* and detected automatically since the pipeline started running. It is illustrative: not an official statistic, and no case is confirmed as a femicide. The page says this next to the number, and every carousel item links to the original article.

![Live counter going from 7 to 8 as a new case arrives over Server-Sent Events](docs/live-counter.gif)

*The live counter receiving a new case. The Curitiba story in this clip is a test article injected into `news.raw` for the recording and deleted afterwards.*

Leia em português: [README.pt-BR.md](README.pt-BR.md)

## Architecture

```
 Google News RSS ──► ingestor ──► news.raw ──► classifier ──► news.classified ──► dedup ──► cases.reported ──► api ──► SSE ──► web
                                  (Kafka)                       (Kafka)             │         (Kafka)
                                                                                    └──► Postgres ◄──────────────┘
```

Each stage is its own Kafka consumer group. A slow or failing stage does not block the others, and any stage can be replayed from its input topic.

| Stage | Input → output | What it does |
|---|---|---|
| ingestor | RSS → `news.raw` | Polls the feed every 5 minutes. The article id is the SHA-256 of its URL, and ids already seen are skipped, so re-polling never republishes an article. |
| classifier | `news.raw` → `news.classified` | Rule-based, for pt-BR headlines with accents removed. Keeps articles that report a specific death; drops attempts, trials, sentencing, statistics, laws and campaigns. Extracts state, city and victim age. |
| dedup | `news.classified` → `cases.reported` + Postgres | Groups follow-ups and coverage by different outlets into one case. Emits an event only when a new case is created. |
| api | Postgres, `cases.reported` → HTTP | `GET /stats`, `GET /cases?limit=10`, `GET /events` (Server-Sent Events), `GET /health`. |
| web | api | Next.js page: counter, carousel and disclaimer. Loads the current state, then updates live from the SSE stream. |

More detail in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Design decisions and trade-offs

**Undercount rather than overcount.** The same death shows up as "woman shot in DF", "ex-husband arrested", "victim buried", across many outlets. Dedup treats an article as part of an existing case when both are in the same state, within 3 days of each other, and their known city and victim age do not contradict. When a detail is missing, it merges. Two unrelated deaths in the same state in the same few days can therefore be counted once. For a protest counter, missing a case is a better failure than inventing one.

**Rules before a model.** The classifier is a list of regular expressions tested against real labelled headlines (`pipeline/test/wl/classifier_test.clj`). It is fast, free, explainable, and its mistakes are easy to turn into test cases. It sits behind a single `classify` function, so an LLM classifier can replace it later without touching the other stages.

**Idempotent at every step.** Article ids are content hashes, consumers commit offsets only after handling a batch (at-least-once), and the database rejects a second insert of the same article. Replays and duplicate deliveries do not move the counter. Dedup takes a Postgres advisory lock per state, so two instances cannot create the same case at once.

**One stream per API instance.** Each API process reads `cases.reported` with its own consumer group, starting from the latest offset, so every instance pushes every new case to its own SSE clients. History comes from Postgres, not from the topic.

**Copyright and privacy.** Only the headline, outlet, date, place and link are stored and shown. No article body, no photos, no victim names beyond what the headline contains.

### Known limitations

- Cities are recognised from a fixed list; a case in a city that is not on it gets only the state, and a case with no recognisable state is skipped.
- The carousel shows the headline of the first article processed for each case, which is not always the most informative one.
- If publishing to `cases.reported` fails after the case is saved, the case is counted but that live update is lost. Pages pick it up on the next load.
- There is a single source (Google News RSS), so coverage depends on what it indexes.

In a first run against the live feed (October 2026), 101 articles produced 14 classified as reporting a death and 7 distinct cases: 5 articles were merged into existing cases and 2 had no recognisable state.

## Observability

The pipeline exposes Prometheus metrics on port 9100 (`/metrics`):

| Metric | Type | Labels |
|---|---|---|
| `wl_articles_ingested_total` | counter | |
| `wl_ingestor_poll_errors_total` | counter | |
| `wl_articles_classified_total` | counter | `result` (`case`, `not_case`) |
| `wl_dedup_articles_total` | counter | `outcome` (`new-case`, `merged`, `duplicate`, `no-state`, `not-a-case`) |
| `wl_stage_seconds_sum`, `wl_stage_seconds_count` | counter | `stage` |
| `wl_consumer_lag` | gauge | `group` |
| `wl_sse_clients` | gauge | |

`docker compose` also starts Prometheus (http://localhost:9090) and Grafana with a provisioned dashboard at http://localhost:3001/d/womens-lives-pipeline (anonymous read-only access).

## Running locally

Requirements: Docker (or Colima), Java 21+, the [Clojure CLI](https://clojure.org/guides/install_clojure), Node.js 20+.

```bash
# Kafka, Postgres, Prometheus and Grafana
docker compose up -d

# Pipeline: creates the topics and tables, then runs all four stages in one process
cd pipeline
clojure -M:run

# Web, in another terminal
npm install
npm run dev
```

Open http://localhost:3000. The first poll runs on startup, so cases from the current feed appear within a few seconds.

To run only some stages in a process, name them: `clojure -M:run ingestor classifier`.

Configuration is read from environment variables:

| Variable | Default |
|---|---|
| `KAFKA_BOOTSTRAP` | `localhost:9092` |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | `localhost`, `5432`, `womens_lives`, `wl`, `wl` |
| `FEED_URL` | Google News RSS search for "feminicídio" (pt-BR) |
| `POLL_MS` | `300000` (5 minutes) |
| `API_PORT` | `8080` |
| `METRICS_PORT` | `9100` |
| `NEXT_PUBLIC_PIPELINE_URL` (web) | `http://localhost:8080` |

## Tests and CI

```bash
# Web: lint, types, unit tests
npm run lint
npx tsc --noEmit
npm test

# Pipeline: lint (clj-kondo) and tests
cd pipeline
clojure -M:lint
clojure -M:test
```

GitHub Actions runs all of the above, plus `next build`, on every pull request and on pushes to `main`.

## Project layout

```
app/                 Next.js App Router: page, live counter (LiveCases.tsx), historical data API route
hooks/               useLiveCases (stats + SSE), useFeminicideData (historical counter)
lib/                 historical data and calculations
__tests__/           Jest tests for the web app
pipeline/
  src/wl/            ingestor, classifier, dedup, api, kafka, db, metrics, config, main
  test/wl/           classifier fixtures from real headlines, dedup and metrics tests
observability/       Prometheus config, Grafana provisioning and dashboard
docs/ARCHITECTURE.md design notes
```

## Where to get help (Brazil)

- **180**: Central de Atendimento à Mulher (24h, free)
- **190**: Polícia Militar (emergencies)
- **181**: Disque Denúncia (anonymous)

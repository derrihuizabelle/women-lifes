# Women's Lives — real-time pipeline (design)

## Goal

Turn the static counter into a live one: every time a news outlet reports a femicide in Brazil, the counter goes up and the story appears in a carousel below it.

**What the number means:** cases *reported in the press* and detected automatically by this pipeline since it started running. It is **illustrative**, not an official statistic and not a confirmation that each case is a femicide. The UI must say this next to the number, and every carousel item links to the original article.

## Overview

```
 Google News RSS ──► ingestor ──► news.raw ──► classifier ──► news.classified ──► dedup ──► cases.reported ──► api ──► SSE ──► web
 (and other feeds)                (Kafka)                       (Kafka)                       (Kafka)        │
                                                                                                              └──► Postgres
```

Each stage is an independent Kafka consumer group, so a slow or failing stage never blocks the others, and any stage can be replayed from its input topic.

| Stage | Input | Output | Responsibility |
|---|---|---|---|
| ingestor | RSS feeds (polled) | `news.raw` | Fetch feeds, normalize items, publish one message per article. Key = hash of the canonical URL, so re-polling the same article is idempotent. |
| classifier | `news.raw` | `news.classified` | Decide whether the article reports a specific femicide case (vs. awareness campaigns, statistics, trials, opinion). Extract date, city, state and outlet. Starts rule-based; can later use an LLM behind the same interface. |
| dedup | `news.classified` | `cases.reported` + Postgres | The same case is covered by many outlets and follow-ups (e.g. "woman shot in DF", "ex-husband is suspect", "victim buried"). Group articles into one case; emit only when a new case is created. |
| api | `cases.reported`, Postgres | HTTP + Server-Sent Events | `GET /stats`, `GET /cases?limit=10`, `GET /events` (SSE stream of new cases). |
| web | api | — | Existing Next.js app: counter + carousel (headline, outlet, city/state, date, link). |

## Key decisions

- **Clojure** for the backend services (Kafka clients via Java interop), **Next.js** stays for the web.
- **Kafka (KRaft, single node) + Postgres** in `docker compose` for local development.
- **Idempotency everywhere:** message keys are content hashes; consumers upsert, so replays and duplicate polls never inflate the counter.
- **Deduplication heuristic (v1):** an article belongs to an existing case when both are in the same state, published within 3 days of each other, and their known details (city, victim age) do not contradict. Missing details count as compatible, so the counter errs towards undercounting. Later articles fill in details the first one lacked. A Postgres advisory lock per state keeps concurrent dedup instances from creating the same case twice.
- **Copyright and privacy:** store and show only headline, outlet, date, location and link. No article body, no victim photos.
- **Sources:** start with Google News RSS search (`feminicídio`, pt-BR). Respect polling intervals; add other feeds later.
- **Observability:** Prometheus metrics per stage (articles ingested, classified as case / not case, duplicates merged, cases emitted, consumer lag) and a Grafana dashboard.

## Plan

All steps are implemented; see the [README](../README.md) for how to run it and the known limitations.

1. **Setup** — `docker compose` (Kafka, Postgres), Clojure project skeleton (`deps.edn`), topics created on startup.
2. **Ingestor** — poll RSS, publish to `news.raw`; tests with a recorded feed fixture.
3. **Classifier** — rule-based v1 + labelled fixtures from real headlines; publish to `news.classified`.
4. **Dedup + storage** — case grouping, Postgres schema, publish to `cases.reported`.
5. **API + SSE** — stats, latest cases, live stream.
6. **Web** — counter and carousel driven by SSE, with the "illustrative" disclaimer.
7. **Observability** — metrics + Grafana dashboard.
8. **CI and docs** — GitHub Actions (tests + lint), English README with the design and trade-offs, demo GIF.

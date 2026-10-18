(ns wl.db
  (:require [next.jdbc :as jdbc]
            [next.jdbc.result-set :as rs]))

(def ^:private schema
  ["create table if not exists seen_articles (
      id text primary key,
      url text not null,
      first_seen timestamptz not null default now())"
   "create table if not exists cases (
      id bigserial primary key,
      state text not null,
      city text,
      victim_age int,
      headline text not null,
      url text not null,
      outlet text,
      published_at timestamptz not null,
      created_at timestamptz not null default now())"
   "create table if not exists case_articles (
      article_id text primary key,
      case_id bigint not null references cases(id),
      headline text not null,
      url text not null,
      outlet text,
      published_at timestamptz not null)"
   "create index if not exists cases_published_at on cases (published_at desc)"])

(def opts {:builder-fn rs/as-unqualified-lower-maps})

(defn datasource [db-spec]
  (jdbc/get-datasource db-spec))

(defn migrate! [ds]
  (doseq [stmt schema]
    (jdbc/execute! ds [stmt])))

(defn seen? [ds id]
  (some? (jdbc/execute-one! ds ["select 1 from seen_articles where id = ?" id])))

(defn mark-seen! [ds id url]
  (jdbc/execute-one! ds ["insert into seen_articles (id, url) values (?, ?) on conflict do nothing" id url]))

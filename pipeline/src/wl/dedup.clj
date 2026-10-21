(ns wl.dedup
  "Groups classified articles into cases.

  The same death is covered by many outlets and follow-ups (\"woman shot\",
  \"ex-husband is suspect\", \"victim buried\"). The heuristic is deliberately
  conservative: when unsure, an article is merged into an existing case instead
  of creating a new one, so the counter errs on the side of undercounting."
  (:require [next.jdbc :as jdbc]
            [wl.config :refer [topics]]
            [wl.db :as db]
            [wl.kafka :as kafka]
            [wl.metrics :as metrics])
  (:import (java.time Duration Instant)))

(def window (Duration/ofDays 3))

(defn- conflict? [a b k]
  (and (some? (k a)) (some? (k b)) (not= (k a) (k b))))

(defn same-case?
  "An article belongs to an existing case when both happened in the same state,
  within `window`, and their known details (city, victim age) do not contradict."
  [kase article]
  (and (= (:state kase) (:state article))
       (<= (Math/abs (.toMillis (Duration/between (Instant/parse (str (:published-at kase)))
                                                  (Instant/parse (:published-at article)))))
           (.toMillis window))
       (not (conflict? kase article :city))
       (not (conflict? kase article :victim-age))))

(defn- recent-cases [tx state published-at]
  (let [t (Instant/parse published-at)]
    (->> (jdbc/execute! tx ["select id, state, city, victim_age, published_at from cases
                             where state = ? and published_at between ? and ?
                             order by published_at desc"
                            state
                            (java.sql.Timestamp/from (.minus t window))
                            (java.sql.Timestamp/from (.plus t window))]
                        db/opts)
         (map (fn [c] {:id (:id c)
                       :state (:state c)
                       :city (:city c)
                       :victim-age (:victim_age c)
                       :published-at (.toInstant ^java.sql.Timestamp (:published_at c))})))))

(defn- attach! [tx case-id {:keys [id title url outlet published-at]}]
  (jdbc/execute-one! tx ["insert into case_articles (article_id, case_id, headline, url, outlet, published_at)
                          values (?, ?, ?, ?, ?, ?::timestamptz) on conflict do nothing"
                         id case-id title url outlet published-at]))

(defn- fill-details!
  "Later articles often bring details (city, age) the first one did not have."
  [tx case-id {:keys [city victim-age]}]
  (jdbc/execute-one! tx ["update cases set city = coalesce(city, ?), victim_age = coalesce(victim_age, ?) where id = ?"
                         city victim-age case-id]))

(defn- create-case! [tx {:keys [state city victim-age title url outlet published-at]}]
  (jdbc/execute-one! tx ["insert into cases (state, city, victim_age, headline, url, outlet, published_at)
                          values (?, ?, ?, ?, ?, ?, ?::timestamptz)
                          returning id, state, city, victim_age, headline, url, outlet, published_at, created_at"
                         state city victim-age title url outlet published-at]
                     db/opts))

(defn handle!
  "Returns {:outcome kw} and, when the article created a case, :case."
  [ds article]
  (cond
    (not (:case? article)) {:outcome :not-a-case}
    (not (:state article)) {:outcome :no-state}
    :else
    (jdbc/with-transaction [tx ds]
      ;; serialize per state so two consumers cannot create the same case concurrently
      (jdbc/execute-one! tx ["select pg_advisory_xact_lock(hashtext(?))" (:state article)])
      (if (jdbc/execute-one! tx ["select 1 from case_articles where article_id = ?" (:id article)])
        {:outcome :duplicate}
        (if-let [existing (first (filter #(same-case? % article) (recent-cases tx (:state article) (:published-at article))))]
          (do (attach! tx (:id existing) article)
              (fill-details! tx (:id existing) article)
              {:outcome :merged})
          (let [kase (create-case! tx article)]
            (attach! tx (:id kase) article)
            {:outcome :new-case :case kase}))))))

(defn ->event [kase]
  {:id (:id kase)
   :state (:state kase)
   :city (:city kase)
   :headline (:headline kase)
   :url (:url kase)
   :outlet (:outlet kase)
   :published-at (str (.toInstant ^java.sql.Timestamp (:published_at kase)))})

(defn start!
  "Consumes news.classified; publishes newly created cases to cases.reported."
  [{:keys [bootstrap producer ds]}]
  (kafka/run-consumer! bootstrap "dedup" (:news-classified topics)
                       (fn [_ article]
                         (let [{:keys [outcome] kase :case} (metrics/timed "dedup" (handle! ds article))]
                           (metrics/inc! "wl_dedup_articles_total" {:outcome (name outcome)})
                           (when kase
                             (kafka/send! producer (:cases-reported topics) (str (:id kase)) (->event kase)))))))

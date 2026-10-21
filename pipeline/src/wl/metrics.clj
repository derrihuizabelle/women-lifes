(ns wl.metrics
  "Minimal in-process metrics registry exposed in the Prometheus text format."
  (:require [clojure.string :as str]
            [org.httpkit.server :as http]))

(def ^:private help
  {"wl_articles_ingested_total" ["counter" "Articles published to news.raw by the ingestor."]
   "wl_ingestor_poll_errors_total" ["counter" "Feed polls that failed."]
   "wl_articles_classified_total" ["counter" "Articles classified, by result."]
   "wl_dedup_articles_total" ["counter" "Articles handled by dedup, by outcome."]
   "wl_stage_seconds_sum" ["counter" "Total time spent handling messages, by stage."]
   "wl_stage_seconds_count" ["counter" "Messages handled, by stage."]
   "wl_consumer_lag" ["gauge" "Max records lag reported by the Kafka consumer, by group."]
   "wl_sse_clients" ["gauge" "Connected Server-Sent Events clients."]})

;; {[metric-name labels-map] value}
(defonce ^:private registry (atom {}))

(defn inc! [metric labels & [n]]
  (swap! registry update [metric labels] (fnil + 0) (or n 1)))

(defn gauge! [metric labels v]
  (swap! registry assoc [metric labels] v))

(defmacro timed
  "Runs body and records its duration under `stage`."
  [stage & body]
  `(let [start# (System/nanoTime)]
     (try ~@body
          (finally
            (inc! "wl_stage_seconds_sum" {:stage ~stage} (/ (- (System/nanoTime) start#) 1e9))
            (inc! "wl_stage_seconds_count" {:stage ~stage})))))

(defn- format-labels [labels]
  (if (empty? labels)
    ""
    (str "{" (str/join "," (for [[k v] (sort labels)] (str (name k) "=\"" v "\""))) "}")))

(defn render []
  (let [by-metric (group-by ffirst @registry)]
    (str/join
     (for [[metric entries] (sort-by key by-metric)
           :let [[type doc] (help metric ["untyped" ""])]]
       (str "# HELP " metric " " doc "\n"
            "# TYPE " metric " " type "\n"
            (str/join (for [[[_ labels] v] (sort-by (comp str second key) entries)]
                        (str metric (format-labels labels) " " (double v) "\n"))))))))

(defn start-server!
  "Serves GET /metrics on its own port, so every process exposes metrics
  whichever stages it runs."
  [port]
  (http/run-server (fn [_] {:status 200
                            :headers {"Content-Type" "text/plain; version=0.0.4"}
                            :body (render)})
                   {:port port}))

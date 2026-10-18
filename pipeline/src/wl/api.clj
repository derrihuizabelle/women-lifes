(ns wl.api
  "HTTP API: stats, latest cases and a Server-Sent Events stream of new cases."
  (:require [jsonista.core :as json]
            [next.jdbc :as jdbc]
            [org.httpkit.server :as http]
            [wl.config :refer [topics]]
            [wl.db :as db]
            [wl.dedup :as dedup]
            [wl.kafka :as kafka]))

(def disclaimer
  "Illustrative count of cases reported in the press and detected automatically. Not an official statistic; cases are not confirmed.")

(defn- json-response [status body]
  {:status status
   :headers {"Content-Type" "application/json; charset=utf-8"
             "Access-Control-Allow-Origin" "*"}
   :body (json/write-value-as-string body)})

(defn stats [ds]
  (let [{:keys [count since]} (jdbc/execute-one! ds ["select count(*) as count, min(created_at) as since from cases"] db/opts)]
    {:count count
     :since (some-> since .toInstant str)
     :disclaimer disclaimer}))

(defn latest-cases [ds limit]
  (mapv dedup/->event
        (jdbc/execute! ds ["select id, state, city, headline, url, outlet, published_at from cases
                            order by published_at desc limit ?" limit]
                       db/opts)))

(defn- parse-limit [query-string]
  (let [n (some->> query-string (re-find #"(?:^|&)limit=(\d+)") second parse-long)]
    (min 50 (or n 10))))

(defn- sse-handler [clients req]
  (http/as-channel req
                   {:on-open (fn [ch]
                               (http/send! ch {:status 200
                                               :headers {"Content-Type" "text/event-stream"
                                                         "Cache-Control" "no-cache"
                                                         "Access-Control-Allow-Origin" "*"}
                                               :body ": connected\n\n"}
                                           false)
                               (swap! clients conj ch))
                    :on-close (fn [ch _] (swap! clients disj ch))}))

(defn- broadcast! [clients event]
  (let [msg (str "event: case\ndata: " (json/write-value-as-string event) "\n\n")]
    (doseq [ch @clients]
      (http/send! ch msg false))))

(defn handler [ds clients]
  (fn [{:keys [request-method uri query-string] :as req}]
    (case [request-method uri]
      [:get "/stats"] (json-response 200 (stats ds))
      [:get "/cases"] (json-response 200 (latest-cases ds (parse-limit query-string)))
      [:get "/events"] (sse-handler clients req)
      [:get "/health"] (json-response 200 {:status "ok"})
      (json-response 404 {:error "not found"}))))

(defn start!
  "Starts the HTTP server and a consumer that pushes new cases to SSE clients.
  Every API instance uses its own consumer group, so each one sees every new case."
  [{:keys [bootstrap ds port]}]
  (let [clients (atom #{})
        stop-server (http/run-server (handler ds clients) {:port port})
        stop-consumer (kafka/run-consumer! bootstrap (str "api-" (random-uuid)) (:cases-reported topics)
                                           (fn [_ event] (broadcast! clients event))
                                           :offset-reset "latest")]
    (println "api: listening on port" port)
    (fn []
      (stop-consumer)
      (stop-server))))

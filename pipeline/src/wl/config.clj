(ns wl.config)

(defn- env [k default]
  (or (System/getenv k) default))

(def config
  {:kafka/bootstrap (env "KAFKA_BOOTSTRAP" "localhost:9092")
   :db {:dbtype "postgresql"
        :host (env "DB_HOST" "localhost")
        :port (parse-long (env "DB_PORT" "5432"))
        :dbname (env "DB_NAME" "womens_lives")
        :user (env "DB_USER" "wl")
        :password (env "DB_PASSWORD" "wl")}
   :ingestor/feeds [(env "FEED_URL" "https://news.google.com/rss/search?q=feminic%C3%ADdio&hl=pt-BR&gl=BR&ceid=BR:pt-419")]
   :ingestor/poll-ms (parse-long (env "POLL_MS" "300000"))
   :api/port (parse-long (env "API_PORT" "8080"))
   :metrics/port (parse-long (env "METRICS_PORT" "9100"))})

(def topics
  {:news-raw "news.raw"
   :news-classified "news.classified"
   :cases-reported "cases.reported"})

(ns wl.main
  "Starts the pipeline. With no arguments every stage runs in this process;
  pass stage names (ingestor classifier dedup api) to run only some of them."
  (:require [wl.api :as api]
            [wl.classifier :as classifier]
            [wl.config :refer [config topics]]
            [wl.db :as db]
            [wl.dedup :as dedup]
            [wl.ingestor :as ingestor]
            [wl.kafka :as kafka]))

(defn -main [& args]
  (let [stages (if (seq args) (set args) #{"ingestor" "classifier" "dedup" "api"})
        bootstrap (:kafka/bootstrap config)
        ds (db/datasource (:db config))
        producer (kafka/producer bootstrap)
        deps {:bootstrap bootstrap :ds ds :producer producer}]
    (db/migrate! ds)
    (kafka/ensure-topics! bootstrap (vals topics))
    (let [stops (cond-> []
                  (stages "api") (conj (api/start! (assoc deps :port (:api/port config))))
                  (stages "dedup") (conj (dedup/start! deps))
                  (stages "classifier") (conj (classifier/start! deps))
                  (stages "ingestor") (conj (ingestor/start! (assoc deps
                                                                    :feeds (:ingestor/feeds config)
                                                                    :poll-ms (:ingestor/poll-ms config)))))]
      (println "started:" (sort stages))
      (.addShutdownHook (Runtime/getRuntime)
                        (Thread. (fn []
                                   (doseq [stop (reverse stops)] (stop))
                                   (.close producer))))
      @(promise))))

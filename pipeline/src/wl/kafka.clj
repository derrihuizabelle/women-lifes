(ns wl.kafka
  (:require [jsonista.core :as json]
            [wl.metrics :as metrics])
  (:import (java.time Duration)
           (org.apache.kafka.common Metric MetricName)
           (java.util Properties)
           (org.apache.kafka.clients.admin AdminClient NewTopic)
           (org.apache.kafka.clients.consumer KafkaConsumer ConsumerRecord)
           (org.apache.kafka.clients.producer KafkaProducer ProducerRecord)
           (org.apache.kafka.common.errors TopicExistsException)
           (org.apache.kafka.common.serialization StringDeserializer StringSerializer)))

(defn- props [m]
  (doto (Properties.)
    (.putAll (update-keys m name))))

(defn ensure-topics! [bootstrap topic-names]
  (with-open [admin (AdminClient/create (props {:bootstrap.servers bootstrap}))]
    (doseq [t topic-names]
      (try
        (-> (.createTopics admin [(NewTopic. ^String t (int 3) (short 1))])
            (.all)
            (.get))
        (catch Exception e
          (when-not (instance? TopicExistsException (.getCause e))
            (throw e)))))))

(defn producer [bootstrap]
  (KafkaProducer. (props {:bootstrap.servers bootstrap
                          :acks "all"
                          :enable.idempotence "true"})
                  (StringSerializer.) (StringSerializer.)))

(defn send! [^KafkaProducer p topic k v]
  (.get (.send p (ProducerRecord. ^String topic ^String k ^String (json/write-value-as-string v)))))

(defn consumer [bootstrap group-id offset-reset]
  (KafkaConsumer. (props {:bootstrap.servers bootstrap
                          :group.id group-id
                          :auto.offset.reset offset-reset
                          :enable.auto.commit "false"})
                  (StringDeserializer.) (StringDeserializer.)))

(defn- report-lag! [^KafkaConsumer c group-id]
  (when-let [lag (some (fn [[^MetricName n ^Metric m]]
                         (when (and (= "records-lag-max" (.name n))
                                    (= "consumer-fetch-manager-metrics" (.group n))
                                    (not (contains? (.tags n) "topic")))
                           (.metricValue m)))
                       (.metrics c))]
    (when-not (Double/isNaN lag)
      (metrics/gauge! "wl_consumer_lag" {:group group-id} lag))))

(defn run-consumer!
  "Polls `topic` and calls (handle key value) for each record, committing offsets
  only after the whole batch was handled (at-least-once; handlers must be idempotent).
  Returns a function that stops the loop."
  [bootstrap group-id topic handle & {:keys [offset-reset] :or {offset-reset "earliest"}}]
  (let [running (atom true)
        c (consumer bootstrap group-id offset-reset)
        t (Thread.
           (fn []
             (try
               (.subscribe c [topic])
               (while @running
                 (let [records (.poll c (Duration/ofMillis 500))]
                   (doseq [^ConsumerRecord r records]
                     (handle (.key r) (json/read-value (.value r) json/keyword-keys-object-mapper)))
                   (when-not (.isEmpty records)
                     (.commitSync c))
                   (report-lag! c group-id)))
               (finally (.close c))))
           (str "consumer-" group-id))]
    (.start t)
    (fn [] (reset! running false) (.join t))))

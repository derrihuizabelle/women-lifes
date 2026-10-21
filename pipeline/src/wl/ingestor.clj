(ns wl.ingestor
  "Polls RSS feeds and publishes each new article to news.raw."
  (:require [clojure.data.xml :as xml]
            [clojure.string :as str]
            [wl.config :refer [topics]]
            [wl.db :as db]
            [wl.kafka :as kafka]
            [wl.metrics :as metrics])
  (:import (java.net URI)
           (java.net.http HttpClient HttpRequest HttpResponse$BodyHandlers)
           (java.security MessageDigest)
           (java.time Instant ZonedDateTime)
           (java.time.format DateTimeFormatter)))

(defn sha256 [^String s]
  (->> (.digest (MessageDigest/getInstance "SHA-256") (.getBytes s "UTF-8"))
       (map #(format "%02x" %))
       (apply str)))

(defn- child-text [el tag]
  (some->> (:content el)
           (filter #(= tag (:tag %)))
           first
           :content
           (apply str)
           str/trim))

(defn- parse-date [s]
  (try
    (str (Instant/from (ZonedDateTime/parse s DateTimeFormatter/RFC_1123_DATE_TIME)))
    (catch Exception _ nil)))

(defn- strip-outlet
  "Google News titles end with \" - Outlet\"."
  [title outlet]
  (if (and outlet (str/ends-with? title (str " - " outlet)))
    (subs title 0 (- (count title) (count outlet) 3))
    title))

(defn parse-feed
  "Returns one map per <item> in an RSS document."
  [^String body]
  (let [doc (xml/parse-str body :namespace-aware false :support-dtd false)]
    (for [item (tree-seq :content :content doc)
          :when (= :item (:tag item))
          :let [link (child-text item :link)
                outlet (child-text item :source)]
          :when link]
      {:id (sha256 link)
       :url link
       :title (strip-outlet (child-text item :title) outlet)
       :outlet outlet
       :published-at (parse-date (child-text item :pubDate))})))

(defn fetch [^String url]
  (let [client (HttpClient/newHttpClient)
        req (-> (HttpRequest/newBuilder (URI/create url))
                (.header "User-Agent" "womens-lives-counter/0.1 (+https://github.com/derrihuizabelle/women-lifes)")
                (.build))]
    (.body (.send client req (HttpResponse$BodyHandlers/ofString)))))

(defn poll-once!
  "Fetches every feed and publishes articles not seen before. Returns how many were published.
  An article is marked as seen only after Kafka acknowledged it; if the process dies in between,
  the article is published again and downstream stages drop the duplicate by id."
  [{:keys [ds producer feeds]}]
  (let [published (atom 0)]
    (doseq [feed feeds
            article (parse-feed (fetch feed))
            :when (:published-at article)
            :when (not (db/seen? ds (:id article)))]
      (kafka/send! producer (:news-raw topics) (:id article) article)
      (db/mark-seen! ds (:id article) (:url article))
      (metrics/inc! "wl_articles_ingested_total" {})
      (swap! published inc))
    @published))

(defn start!
  "Polls feeds every poll-ms on a background thread. Returns a stop function."
  [{:keys [poll-ms] :as deps}]
  (let [running (atom true)
        t (Thread.
           (fn []
             (while @running
               (try
                 (println "ingestor: published" (poll-once! deps) "new articles")
                 (catch Exception e
                   (metrics/inc! "wl_ingestor_poll_errors_total" {})
                   (println "ingestor: poll failed:" (.getMessage e))))
               (Thread/sleep ^long poll-ms)))
           "ingestor")]
    (.setDaemon t true)
    (.start t)
    (fn [] (reset! running false))))

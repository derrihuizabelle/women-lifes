(ns wl.metrics-test
  (:require [clojure.string :as str]
            [clojure.test :refer [deftest is]]
            [wl.metrics :as m]))

(deftest renders-prometheus-text-format
  (m/inc! "wl_articles_classified_total" {:result "case"})
  (m/inc! "wl_articles_classified_total" {:result "case"})
  (m/gauge! "wl_sse_clients" {} 3)
  (let [out (m/render)]
    (is (str/includes? out "# TYPE wl_articles_classified_total counter\n"))
    (is (re-find #"wl_articles_classified_total\{result=\"case\"\} [2-9]" out))
    (is (str/includes? out "wl_sse_clients 3.0\n"))))

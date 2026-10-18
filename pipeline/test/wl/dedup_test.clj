(ns wl.dedup-test
  (:require [clojure.test :refer [deftest is]]
            [wl.dedup :as d])
  (:import (java.time Instant)))

(def df-case {:state "DF" :city nil :victim-age 30 :published-at (Instant/parse "2026-10-16T13:00:00Z")})

(deftest follow-ups-of-the-same-case-are-merged
  (is (d/same-case? df-case {:state "DF" :city "candangolandia" :victim-age nil :published-at "2026-10-16T20:00:00Z"}))
  (is (d/same-case? df-case {:state "DF" :city nil :victim-age 30 :published-at "2026-10-17T12:00:00Z"})))

(deftest different-cases-are-kept-apart
  (is (not (d/same-case? df-case {:state "SP" :victim-age 30 :published-at "2026-10-16T14:00:00Z"})) "other state")
  (is (not (d/same-case? df-case {:state "DF" :victim-age 45 :published-at "2026-10-16T14:00:00Z"})) "other age")
  (is (not (d/same-case? df-case {:state "DF" :victim-age 30 :published-at "2026-10-25T14:00:00Z"})) "too far apart")
  (is (not (d/same-case? {:state "SP" :city "taboao da serra" :published-at (Instant/parse "2026-10-13T10:00:00Z")}
                         {:state "SP" :city "sao jose dos campos" :published-at "2026-10-12T10:00:00Z"}))
      "other city"))

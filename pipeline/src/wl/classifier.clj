(ns wl.classifier
  "Rule-based classification of news headlines (pt-BR).

  Goal: keep only headlines that report a woman's death in a specific case.
  The rules are deliberately conservative — when in doubt, the article is not
  counted. Exclusions always win over matches."
  (:require [clojure.string :as str]
            [wl.config :refer [topics]]
            [wl.kafka :as kafka]
            [wl.metrics :as metrics]))

(defn normalize [s]
  (-> (or s "")
      (java.text.Normalizer/normalize java.text.Normalizer$Form/NFD)
      (str/replace #"\p{M}" "")
      str/lower-case))

(def ^:private death-patterns
  "Headline describes a death (after normalization: lower case, no accents)."
  [#"\b(mulher|jovem|idosa|adolescente|menina|esposa|companheira|ex-mulher|ex-companheira|ex-namorada)\b[^.;:]{0,40}\b(e|foi|sao|foram)?\s*(morta|assassinada|encontrada morta|encontradas mortas|esfaqueada e morta)\b"
   #"\bmorre(u)?\b[^.;]{0,30}\b(mulher|jovem|baleada|esfaqueada)\b"
   #"\b(mulher|jovem)\b[^.;]{0,40}\bmorre(u)?\b"
   #"\bmortos? em casa\b.*\bfeminicidio\b"
   #"\b(suspeita|investiga)\b[^.;]{0,40}\bfeminicidio\b.*\b(morta|mortos?|morre)\b"
   #"\b(morta|mortos?|morre)\b.*\b(suspeita|investiga)\b[^.;]{0,40}\bfeminicidio\b"
   #"^feminicidio (em|na|no|de)\b"
   #"\bmotivado (o )?feminicidio\b"
   #"\b(mulher|jovem|idosa|adolescente)\b[^.;:]{0,30}\b(e|foi) vitima de feminicidio\b"
   #"\bvitima de feminicidio\b.*\b(enterrad|velad|sepultad|despedem)"
   #"\b(enterrad|velad|sepultad|despedem)\w*\b.*\bvitima de feminicidio\b"
   #"\b(morta|assassinada) (pelo|por) (ex-)?(marido|companheiro|namorado|noivo)\b"])

(def ^:private exclusion-patterns
  "Topics that mention femicide but do not report a new death."
  [#"\btentativa de feminicidio\b" #"\bfeminicidio tentado\b" #"\bestado grave\b"
   #"\bcondena" #"\bjuri\b" #"\bjulgamento\b" #"\bsentenca\b" #"\breu\b" #"\bdenuncia\b" #"\bindiciad"
   #"\binterrogatorio\b" #"\bacusad" #"\bprocurad" #"\bforagid" #"\bpresidio\b" #"\bpenitenciari"
   #"\bconscientiz" #"\bcampanha\b" #"\bprojeto\b" #"\bproposta\b" #"\blei\b" #"\bpec\b" #"\bsenado\b"
   #"\bseminario\b" #"\bwebinario\b" #"\bsimposio\b" #"\bcurso\b" #"\bexposicao\b" #"\bpalestra\b"
   #"\boms\b" #"\bcid\b" #"\bdia (nacional|estadual|de luto)\b" #"\bluto e memoria\b" #"\bpacto\b"
   #"\bnucleo\b" #"\bfrente parlamentar\b" #"\bato\b" #"\bmobilizacao\b" #"\borfaos\b"
   #"\blevantamento\b" #"\brecorde\b" #"\bsem (registro de )?feminicidio\b" #"\bsalvou\b"
   #"\b(\d+|duas|tres|quatro|cinco|seis|sete|oito|nove|dez) mulheres\b" #"\bem 20\d\d\b"
   #"\bcomissao\b" #"\baprova\b" #"\bpena\b" #"\bquem sao\b" #"\bpolicia conclui\b" #"\bentrevista\b"])

(def ^:private states
  {"ac" "AC" "acre" "AC" "al" "AL" "alagoas" "AL" "ap" "AP" "amapa" "AP" "am" "AM" "amazonas" "AM"
   "ba" "BA" "bahia" "BA" "ce" "CE" "ceara" "CE" "df" "DF" "distrito federal" "DF"
   "es" "ES" "espirito santo" "ES" "go" "GO" "goias" "GO" "ma" "MA" "maranhao" "MA"
   "mt" "MT" "mato grosso" "MT" "ms" "MS" "mato grosso do sul" "MS" "mg" "MG" "minas gerais" "MG"
   "pa" "PA" "para" "PA" "pb" "PB" "paraiba" "PB" "pr" "PR" "parana" "PR" "pe" "PE" "pernambuco" "PE"
   "pi" "PI" "piaui" "PI" "rj" "RJ" "rn" "RN" "rio grande do norte" "RN" "rs" "RS" "rio grande do sul" "RS"
   "ro" "RO" "rondonia" "RO" "rr" "RR" "roraima" "RR" "sc" "SC" "santa catarina" "SC" "sp" "SP"
   ;; "se" is left out on purpose: "de se ..." is too common in Portuguese
   "sergipe" "SE" "to" "TO" "tocantins" "TO"})

(def ^:private cities
  "Capitals and cities that often appear in headlines, with their state."
  {"Rio Branco" "AC" "Maceió" "AL" "Macapá" "AP" "Manaus" "AM" "Salvador" "BA" "Fortaleza" "CE"
   "Brasília" "DF" "Candangolândia" "DF" "Ceilândia" "DF" "Taguatinga" "DF" "Samambaia" "DF"
   "Vitória" "ES" "Goiânia" "GO" "São Luís" "MA" "Cuiabá" "MT" "Várzea Grande" "MT"
   "Campo Grande" "MS" "Belo Horizonte" "MG" "Belém" "PA" "João Pessoa" "PB" "Campina Grande" "PB"
   "Curitiba" "PR" "Recife" "PE" "Iati" "PE" "Teresina" "PI" "Rio de Janeiro" "RJ" "Niterói" "RJ"
   "Volta Redonda" "RJ" "Natal" "RN" "Porto Alegre" "RS" "Porto Velho" "RO" "Boa Vista" "RR"
   "Florianópolis" "SC" "São Paulo" "SP" "São José dos Campos" "SP" "Taboão da Serra" "SP"
   "Campinas" "SP" "Aracaju" "SE" "Palmas" "TO"})

(def ^:private city-patterns
  ;; longest names first, so "São José dos Campos" wins over shorter names it contains
  (for [city (sort-by count > (keys cities))]
    [(re-pattern (str "\\b" (normalize city) "\\b")) city]))

(defn- find-city [t]
  (some (fn [[re city]] (when (re-find re t) city)) city-patterns))

(defn- find-state [t city]
  (or (some (fn [[k uf]]
              ;; two-letter codes only count in "no DF", "em SP", "(PE)" or ", SP" forms
              (when (re-find (re-pattern (if (= 2 (count k))
                                           (str "(\\b(no|na|em|do|da|de)\\s|\\(|,\\s)" k "\\b(?!-)")
                                           (str "\\b(no|na|em|do|da|de)\\s" k "\\b")))
                             t)
                uf))
            (sort-by (comp - count key) states))
      (some-> city cities)))

(defn- find-age [t]
  (some-> (re-find #"\b(\d{1,2}) anos\b" t) second parse-long))

(defn classify
  "Returns the article enriched with :case? and, when it is a case, :state, :city and :victim-age."
  [{:keys [title] :as article}]
  (let [t (normalize title)
        excluded (some #(re-find % t) exclusion-patterns)
        death (some #(re-find % t) death-patterns)
        city (find-city t)]
    (cond-> (assoc article :case? (boolean (and death (not excluded))))
      (and death (not excluded))
      (assoc :state (find-state t city)
             :city city
             :victim-age (find-age t)))))

(defn start!
  "Consumes news.raw, publishes every article (classified) to news.classified."
  [{:keys [bootstrap producer]}]
  (kafka/run-consumer! bootstrap "classifier" (:news-raw topics)
                       (fn [k article]
                         (let [result (metrics/timed "classifier" (classify article))]
                           (metrics/inc! "wl_articles_classified_total" {:result (if (:case? result) "case" "not_case")})
                           (kafka/send! producer (:news-classified topics) k result)))))

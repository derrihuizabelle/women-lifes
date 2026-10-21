(ns wl.classifier-test
  (:require [clojure.test :refer [deftest is testing]]
            [wl.classifier :as c]))

;; Real headlines from the Google News feed (Oct 2026), labelled by hand.
(def reported-deaths
  [["Morre mulher de 30 anos baleada na cabeça no DF; ex-marido é suspeito" "DF" 30]
   ["Mulher de 30 anos que morreu baleada perto de casa é velada neste sábado (17) no DF" "DF" 30]
   ["Feminicídio na Candangolândia: mulher leva tiro na cabeça e morre no Hospital de Base" "DF" nil]
   ["Feminicídio: morre mulher baleada na cabeça por ex-companheiro no DF" "DF" nil]
   ["Mulher é morta a facadas na zona leste de São José dos Campos; companheiro é preso em flagrante" "SP" nil]
   ["Polícia investiga suspeita de feminicídio após jovem de 21 anos ser encontrada morta em Porto Alegre" "RS" 21]
   ["Mulher de 21 anos é vítima de feminicídio no Extremo Sul de Porto Alegre" "RS" 21]
   ["Mulher é morta pelo ex-companheiro após término do relacionamento no interior do AM; câmeras registram ataque" "AM" nil]
   ["PM e mulher são encontrados mortos em casa na Grande Natal; polícia investiga feminicídio seguido de suicídio" "RN" nil]
   ["Jovem é morta durante encontro com ex-namorado em Taboão da Serra" "SP" nil]
   ["Mulher é morta a facadas em Iati; polícia procura ex-companheiro suspeito de feminicídio" "PE" nil]])

(def not-reported-deaths
  ["Carro do ovo é usado para conscientizar contra feminicídio nas ruas do Recife"
   "OMS aprova proposta do Brasil e inclui feminicídio na CID-11"
   "Senado adia PEC da Segurança com feminicídio recorde em SP e MG"
   "Mulher é esfaqueada em tentativa de feminicídio em Itapecerica (SP)"
   "Mulher é baleada na cabeça e fica em estado grave no DF; ex-marido é suspeito"
   "Tentativa de feminicídio: PM da reserva é condenado a 15 anos de prisão"
   "Polícia de SP prende procurado pela Justiça por feminicídio em Taboão da Serra"
   "Julgamento de ex-policial acusado de feminicídio entra no 2º dia em Curitiba"
   "Feminicídios em SC: 41 mulheres foram mortas em 2026"
   "Juazeiro completa um ano sem registro de feminicídio e fortalece proteção às mulheres"
   "Acusado de feminicídio é encontrado morto em presídio de MT"
   "Defensoria cria projeto para amparar órfãos do feminicídio no RS"
   "Se matar mulher já era crime, por que existe o feminicídio?"
   "Ato em Curitiba reúne centenas de pessoas contra o feminicídio e em apoio a Lula"
   "Dia Nacional de Luto e de Memória às Mulheres Vítimas de Feminicídio"
   "Nova Xavantina lidera alta de violência contra mulher no leste de MT, aponta levantamento"
   "Em entrevista à TV Gazeta, Ferraço fala sobre feminicídio"
   "Quatro mulheres são vítimas de feminicídio em apenas dois dias no Rio Grande do Sul"
   "Comissão aprova aumento de pena para feminicídio em situações específicas"
   "Médica assassinada no PR: além do feminicídio, polícia conclui que marido também cometeu abandono de incapaz por deixar bebê com corpo"])

(deftest reported-deaths-are-cases
  (doseq [[title state age] reported-deaths]
    (testing title
      (let [r (c/classify {:title title})]
        (is (:case? r))
        (is (= state (:state r)))
        (is (= age (:victim-age r)))))))

(deftest other-news-is-not-a-case
  (doseq [title not-reported-deaths]
    (testing title
      (is (false? (:case? (c/classify {:title title})))))))

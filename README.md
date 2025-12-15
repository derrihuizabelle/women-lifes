# Contador Histórico de Violência Contra a Mulher - Brasil (2018-2025)

## Sumário

- [Contador Histórico de Violência Contra a Mulher - Brasil (2018-2025)](#contador-histórico-de-violência-contra-a-mulher---brasil-2018-2025)
  - [Sumário](#sumário)
  - [Contexto](#contexto)
    - [Tipos de violência contabilizados](#tipos-de-violência-contabilizados)
    - [Fontes de dados](#fontes-de-dados)
  - [Tecnologias](#tecnologias)
  - [Instalação](#instalação)
    - [Pré-requisitos](#pré-requisitos)
    - [Passos](#passos)
  - [Como rodar](#como-rodar)
    - [Ambiente de desenvolvimento](#ambiente-de-desenvolvimento)
    - [Build de produção](#build-de-produção)
    - [Executar testes](#executar-testes)
    - [Linting](#linting)
  - [Estrutura do projeto](#estrutura-do-projeto)
  - [Como contribuir](#como-contribuir)
    - [Diretrizes de contribuição](#diretrizes-de-contribuição)
    - [Atualização de dados](#atualização-de-dados)
  - [Canais de denúncia](#canais-de-denúncia)
  - [Licença](#licença)

## Contexto

Este projeto é um contador de protesto que compila dados de violência contra a mulher no Brasil, abrangendo o período de janeiro de 2018 até dezembro de 2025. O objetivo é dar visibilidade à epidemia de violência que afeta mulheres brasileiras diariamente.

### Tipos de violência contabilizados

- Feminicídios
- Agressões físicas
- Violência doméstica
- Assédio sexual
- Violência psicológica
- Ameaças

### Fontes de dados

- Atlas da Violência (IPEA/FBSP)
- Anuário Brasileiro de Segurança Pública
- Disque 180 - Central de Atendimento à Mulher
- Secretarias de Segurança Pública Estaduais (SSPs)
- IBGE

Os dados de 2025 são projeções baseadas nas tendências históricas dos anos anteriores.

## Tecnologias

- Next.js 14
- React 18
- TypeScript
- Jest + Testing Library (testes)
- Font Awesome (ícones)

## Instalação

### Pré-requisitos

- Node.js 18 ou superior
- npm ou yarn

### Passos

1. Clone o repositório:

```bash
git clone https://github.com/derrihuizabelle/women-lifes
cd women-lifes
```

2. Instale as dependências:

```bash
npm install
```

## Como rodar

### Ambiente de desenvolvimento

```bash
npm run dev
```

O projeto estará disponível em `http://localhost:3000`.

### Build de produção

```bash
npm run build
npm start
```

### Executar testes

```bash
# Rodar todos os testes
npm test

# Rodar testes em modo watch
npm run test:watch

# Rodar testes com cobertura
npm run test:coverage
```

### Linting

```bash
npm run lint
```

## Estrutura do projeto

```
womens-life/
├── app/                    # Páginas e rotas (App Router do Next.js)
│   ├── api/               # Rotas de API
│   │   └── feminicide-data/
│   ├── globals.css        # Estilos globais
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Página inicial
├── hooks/                  # React hooks customizados
│   └── useFeminicideData.ts
├── lib/                    # Bibliotecas e utilitários
│   └── historicalData.ts  # Dados históricos e cálculos
├── __tests__/             # Testes automatizados
│   ├── api/
│   ├── hooks/
│   └── lib/
└── public/                # Arquivos estáticos
```

## Como contribuir

Contribuições são bem-vindas. Você pode encontrar tarefas pendentes nas [issues do repositório](https://github.com/derrihuizabelle/women-lifes/issues), se estiver com dúvida de como começar. Siga os passos abaixo:

1. Faça um fork do projeto

2. Crie uma branch para sua feature ou correção:

```bash
git checkout -b minha-contribuicao
```

3. Faça suas alterações e commits:

```bash
git commit -m "Descrição clara da alteração"
```

4. Certifique-se de que os testes passam:

```bash
npm test
```

5. Certifique-se de que o lint passa:

```bash
npm run lint
```

6. Envie suas alterações:

```bash
git push origin minha-contribuicao
```

7. Abra um Pull Request no repositório original

### Diretrizes de contribuição

- Mantenha o código em TypeScript
- Adicione testes para novas funcionalidades
- Siga o padrão de código existente
- Atualize a documentação quando necessário
- Use mensagens de commit claras e descritivas

### Atualização de dados

Se você possui dados atualizados de fontes oficiais sobre violência contra a mulher no Brasil, contribuições para atualizar o arquivo `lib/historicalData.ts` são especialmente bem-vindas. Certifique-se de incluir as fontes dos dados.

## Canais de denúncia

Se você ou alguém que conhece está sofrendo violência:

- **Disque 180** - Central de Atendimento à Mulher (24h)
- **Disque 190** - Polícia Militar (emergências)
- **Disque 181** - Disk Denúncia (anônimo)

## Licença

Este projeto é open source. Consulte o arquivo LICENSE para mais detalhes.

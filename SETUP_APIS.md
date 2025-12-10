# 📰 Configuração de APIs para Dados Reais

Este guia mostra como configurar APIs para obter dados reais sobre feminicídios no Brasil.

## 🔑 APIs Recomendadas

### 1. NewsAPI (Gratuita)
**Melhor opção para começar**

1. Acesse: [https://newsapi.org/register](https://newsapi.org/register)
2. Registre-se gratuitamente
3. Copie sua API Key
4. Crie arquivo `.env.local`:

```bash
NEWS_API_KEY=sua_chave_aqui
```

**Limites gratuitos:**
- 1.000 requisições/mês
- Notícias dos últimos 30 dias
- Ideal para projetos de demonstração

### 2. Google News RSS (Gratuita)
**Sem necessidade de API Key**

- URL: `https://news.google.com/rss`
- Busca por termos específicos
- Sem limites, mas parsing manual necessário

### 3. APIs Governamentais
**Dados oficiais**

- **Dados Abertos Brasil**: `https://dados.gov.br`
- **DATASUS**: Sistema de informações de saúde
- **SSP (Secretarias de Segurança)**: Dados estaduais

## 🛠️ Como Funciona

### Fluxo de Dados
```
Fontes de Notícias → NewsService → API Route → Frontend → Usuário
```

### Cache Inteligente
- **30 minutos** para dados de notícias
- **5 segundos** para contador em tempo real
- **Fallback automático** se APIs estão indisponíveis

### Extração de Dados
O sistema extrai automaticamente:
- **Local**: Usando regex para cidades brasileiras
- **Idade**: Padrões como "de 34 anos"
- **Circunstâncias**: Palavras-chave como "companheiro", "ex-marido"
- **Data**: Timestamp da publicação

## 🚀 Setup Rápido

### Opção 1: Só com dados estatísticos (sem API)
```bash
# Não precisa configurar nada!
npm run dev
```
O site usará dados do Atlas da Violência (10.7 mulheres/dia)

### Opção 2: Com NewsAPI (recomendado)
```bash
# 1. Registre-se na NewsAPI
# 2. Crie .env.local
echo "NEWS_API_KEY=sua_chave" > .env.local

# 3. Execute
npm run dev
```

### Opção 3: Configuração completa
```bash
# Configurar todas as APIs disponíveis
cp .env.example .env.local
# Edite .env.local com suas chaves

npm run dev
```

## 📊 Qualidade dos Dados

O site mostra badges indicando a fonte dos dados:

- 🟢 **DADOS REAIS**: Casos de notícias recentes
- 🟡 **DADOS ATUALIZADOS**: Mix de dados reais + estatísticas
- 🔴 **DADOS ESTATÍSTICOS**: Baseado no Atlas da Violência

## 🔄 Atualizações Automáticas

### Frequência de Atualização
- **Contador**: A cada 5 segundos
- **Notícias**: A cada 30 minutos
- **Cache**: Inteligente baseado na disponibilidade

### Performance
- **Requisições otimizadas**: Cache em memória
- **Abort controllers**: Cancela requisições antigas
- **Lazy loading**: Componentes carregados sob demanda

## 🛡️ Considerações Éticas

### Tratamento Respeitoso
- **Nomes anonimizados**: Nunca expor identidades reais
- **Dados públicos apenas**: Só informações já publicadas
- **Contexto educativo**: Foco na conscientização
- **Fontes confiáveis**: Apenas veículos jornalísticos sérios

### Disclaimer Legal
O site compila informações de fontes públicas para fins educativos e de conscientização social. Todos os dados pessoais são tratados com máximo respeito e privacidade.

## 🎯 Próximos Passos

Para tornar ainda mais robusto:

1. **Integrar com mais fontes**:
   - Instituto Patrícia Galvão
   - Mapa da Violência
   - Observatório da Violência

2. **Melhorar análise**:
   - NLP para extração mais precisa
   - Machine learning para categorização
   - Validação cruzada de fontes

3. **Adicionar funcionalidades**:
   - Gráficos de tendências
   - Mapas de calor por região
   - Comparativo histórico

## 🆘 Suporte

Se encontrar problemas na configuração:
1. Verifique se as APIs estão funcionais
2. Confirme as variáveis de ambiente
3. Veja os logs no console do navegador
4. Use o fallback estatístico como base

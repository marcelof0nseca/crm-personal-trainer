# PTMANAGER

CRM para personal trainers, vendido por subscrição em Portugal. Interface e
documentos em **português de Portugal**, preços em euros.

> **Este ficheiro é público** (o repositório é público). Nunca escrever aqui
> chaves, segredos, nomes, moradas, NIF ou dados de clientes. O contexto privado
> (quem é o titular legal, preferências de trabalho) vive na memória, fora do
> repositório.

---

## 1. Os primeiros cinco minutos

Se acabou de chegar a este projeto sem contexto nenhum, é isto que precisa de
saber por esta ordem:

1. **A aplicação está viva e a ser vendida** em `ptmanagerapp.com`. Não é um
   protótipo. Não partir nada.
2. **Quase tudo está num ficheiro:** `painel-pt.tsx`, ~7 900 linhas. É
   deliberado. Procure por nome de função com `grep`, não abra o ficheiro
   inteiro.
3. **O modelo de dados não é relacional** e isso decide quase todas as decisões
   técnicas. Ver secção 4.
4. **Faz-se `commit`, nunca `push`.** O push é sempre do dono do produto.
5. **Não há testes automatizados.** Valida-se no browser com Playwright, com
   asserções sobre *o que ficou gravado*. Ver secção 9.
6. **A lista de funcionalidades pedidas é maior do que o produto.** Ver
   secção 10 antes de aceitar construir seja o que for.

Comandos: `npm run dev` · `npm run build` · `npm run preview`.

---

## 2. O produto

Um personal trainer **independente**, em Portugal, com 15 a 60 alunos, muitas
vezes a alugar espaço num ginásio de outra pessoa. Não é para ginásios nem para
cadeias.

O que ele faz na aplicação, todos os dias:

| Separador | O que lá está |
|---|---|
| **Painel** | Receita bruta e líquida, impostos, taxa do ginásio, comparência, faltas |
| **Agenda** | Dia · Semana · Mês · Lista. Marcar, arrastar, copiar, horários livres |
| **Faltas** | Faltas, direito a reposição, créditos ligados à aula de origem |
| **Alunos** | Fichas, plano, preço, cor de identificação. **Os treinos vivem aqui dentro** |
| **Avaliações** | Dobras cutâneas, % massa gorda, perímetros, fotografias, evolução |
| **Finanças** | Entradas e saídas, categorias, IVA, pendências |

Mais um separador **Admin**, só visível ao dono da aplicação.

O aluno **não tem acesso**. O que ele recebe é um PDF. Isto não é uma limitação
técnica — é uma decisão de produto, e condiciona metade do que se pode oferecer
(ver secção 10).

---

## 3. Onde está o quê

| Ficheiro | |
|---|---|
| `painel-pt.tsx` | **A aplicação quase toda** (~7 900 linhas): componentes, helpers, modelo de dados, `AppInner` |
| `src/components/LandingPage.tsx` | Página pública de vendas |
| `src/components/LegalDocs.tsx` | Termos e política de privacidade. **Contém declarações legais** |
| `src/components/Turnstile.tsx` | CAPTCHA do registo |
| `src/data/exercicios.ts` | **Gerado.** 2 076 exercícios, 18 grupos, 14 categorias. Não editar à mão |
| `scripts/gerar-exercicios.mjs` | Gera o ficheiro acima a partir do catálogo MFIT (que não está no repositório) |
| `scripts/exercicios-legado.json` | Os 202 exercícios que a aplicação tinha antes do catálogo |
| `supabase/functions/` | 5 Edge Functions: `admin-overview`, `create-checkout-session`, `create-mbway-checkout-session`, `create-portal-session`, `stripe-webhook` |
| `supabase-schema.sql` | Schema completo e idempotente |

**Stack:** React 18 + Vite 6 · Supabase (Auth, Postgres com RLS, Edge Functions
em Deno) · Stripe · Recharts · lucide-react · Tailwind + CSS-in-JS.
Sem router — a navegação é estado (`view`). Sem gestor de estado externo.

---

## 4. O modelo de dados

**Não é relacional.** Tudo vive em `app_data`, uma linha por
`(user_id, data_key)`, com um vetor JSON inteiro por linha:

```
alunos · agenda · financas · fotos · categorias · definicoes · treinos
```

As chaves são limitadas por um `check` em `supabase-schema.sql`. **Uma chave
nova exige alterar esse `check` e correr o SQL no painel do Supabase.**

Consequências que decidem quase tudo:

- **Não há consultas ao conteúdo.** Filtrar é sempre em memória.
- **Cada gravação reescreve o bloco inteiro.** Daí o carimbo de versão, abaixo.
- **As avaliações físicas são sessões da agenda** (`type: 'avaliacao'` + campos
  `assess*`), não uma entidade própria. Mexer em avaliações mexe na agenda.
- **As fotografias são `data:` URI** dentro do bloco `fotos`. Nunca usar para
  vídeo.
- **A biblioteca de exercícios é a exceção: não é gravada.** Vive no código e só
  as diferenças vão para a base de dados — `bibliotecaExtra` (criados),
  `bibliotecaEdicoes` (alterados), `bibliotecaOcultos` (apagados).
  `normalizarTreinos` deriva a lista completa ao ler; `serializarTreinos`
  volta a tirá-la antes de gravar. Sem isto, guardar um treino reescrevia
  ~300 kB de exercícios que já estão no *bundle*. O id de um exercício de origem
  é `'e:' + nome`, estável entre versões, para as prescrições não perderem a
  ligação.

### O carimbo de versão

`readStoredValue` guarda o `updated_at` que veio do servidor. `writeStoredValue`
só deixa passar o `update` se o servidor **ainda estiver nessa data**. Se não
estiver, lança `ConflitoDeGravacao` e a aplicação oferece recarregar — em vez de
apagar o que o outro dispositivo gravou.

Ao trocar de conta, chamar `esquecerVersoes()`, senão a primeira gravação da
conta nova é recusada.

Não foi preciso mexer no schema: o `updated_at` já existia na tabela e só não
era lido.

O modelo aguenta o que existe hoje. Torna-se insuficiente quando chegar a área
do aluno, os vídeos ou a partilha em equipa.

---

## 5. Convenções

### Idioma

Interface, comentários e mensagens em **pt-PT**. `liberar`→`libertar`,
`em um`→`num`, `seu plano`→`o seu plano`. Números com vírgula decimal:
`toLocaleString('pt-PT')`, nunca `toFixed` em texto visível.

Vale também para os dados. O catálogo de exercícios veio do Brasil e é traduzido
**no gerador**, não à mão: `panturrilha`→`gémeos`, `esteira`→`passadeira`,
`quadríceps`→`quadricípites`, `posteriores de coxa`→`isquiotibiais`,
`caneleira`→`tornozeleira`. Um termo novo acrescenta-se a `SUBSTITUICOES` em
`scripts/gerar-exercicios.mjs` e volta a correr-se o script.

### Design

Tokens CSS em `GlobalStyles`. Regras do dono do produto:

- **Não usar cards dentro de cards.**
- **Vermelho é erro ou perigo** — nunca uma ação positiva. Dourado para
  destaque e recompensa.
- **Mobile-first**; validar sempre a 390 px e a 1440 px.

### Temas

Escuro por omissão, claro completo, e um terceiro estado **Automático** que
segue o sistema. Estrutura em `GlobalStyles`:

```
:root                                        → tokens escuros
@media (prefers-color-scheme: light)
  :root:not([data-tema="escuro"])             → tokens claros
:root[data-tema="claro"]                      → tokens claros
```

O automático é resolvido pelo **CSS**, que corre antes do JavaScript — por isso
não há clarão no arranque. A CSP do `index.html` não permite scripts em linha,
por isso esta é a única forma de o fazer. A preferência fica em
`localStorage['ptmanager:tema']`: é do aparelho, não da conta.

### Acessibilidade

Nunca aninhar `<button>` dentro de elemento com `role="button"` — é ARIA
inválido e contamina o nome acessível. Botões de ação sobre um cartão clicável
são **irmãos**, não filhos.

---

## 6. Armadilhas já encontradas

Cada uma destas custou tempo a descobrir. Não voltar a cair.

- **Ícones no estado persistido.** Um componente React não sobrevive a
  `JSON.stringify`. Usar `iconOf()` ao ler ícones de dados gravados.
- **`grid-cols-3` cai para 2 no telemóvel** por regra global. Uma grelha de 3
  itens deixa uma linha órfã — usar 2 ou 4.
- **`.font-mono` está isento de `overflow-wrap: anywhere`**, senão "07:00" parte
  em três linhas.
- **Estado velho em gravações encadeadas.** `persistTreinos` aceita uma função
  do valor atual justamente por isso: duas gravações no mesmo handler a partir
  do estado do render perdem a primeira.
- **Ações num aviso leem de uma referência, não do estado do render.** O
  "Desfazer" de uma movimentação pode ser clicado depois de outra gravação —
  daí o `sessionsRef`.
- **`const` não é içado.** Uma constante usada antes da declaração rebenta a
  aplicação no arranque, e o `build` passa na mesma.
- **O tema não é só o fundo.** Cores fixas em `rgba` ou hexadecimal dentro do
  JSX partem no tema claro. Sombras, sobreposições e lavagens são tokens; o
  objeto `CHART` passa `var()` (os estilos em linha e os atributos do SVG
  resolvem-nos); e as cores de tipo, estado e categoria, pensadas para fundo
  preto, passam por `acentoTexto()` quando são texto ou ícone.
- **Listas de dois mil elementos não se desenham inteiras.** O seletor de
  exercícios mostra 60 e diz quantos ficaram de fora. A pesquisa usa um campo
  `busca` pré-calculado sem acentos — sem isso, escrever "biceps" não encontrava
  "Bíceps".
- **Impressão.** A folha é montada num portal para o `body`, para o CSS de
  impressão esconder a aplicação com um seletor de filho direto. Gráficos de
  impressão usam dimensões fixas — o `ResponsiveContainer` mede zero fora do
  ecrã. **Os PDF saem sempre a preto sobre branco, seja qual for o tema.**
- **`fmtDateBR` devolve `dd/mm` sem ano.** Serve na agenda, não em documentos.
- **Funções escritas e nunca chamadas.** Já aconteceu com `sessoesChocam`, que
  esteve meses no ficheiro sem ninguém a invocar. Antes de escrever uma
  utilidade, `grep` para ver se já existe.

---

## 7. Infraestrutura

- **Supabase** — região `eu-west-3` (Paris). Está na UE de propósito: os dados
  incluem avaliações físicas e fotografias corporais, categoria especial do
  RGPD. **Mudar de região obriga a atualizar `HOSTING_REGION` em
  `LegalDocs.tsx`** — é uma declaração legal.
- **Stripe** — conta portuguesa. Cartão, Apple Pay, Google Pay e MB WAY.
  MB WAY e Multibanco **não fazem subscrição recorrente**: o MB WAY é pagamento
  único e o webhook concede os meses de acesso.
- **Meses grátis** — trimestral +1, anual +2. Concedidos pelo `stripe-webhook`,
  não pela Stripe, e só no primeiro ciclo.
- **Vercel** — `ptmanagerapp.com`. Registos DNS no Cloudflare com o **proxy
  desligado** (nuvem cinzenta), senão o certificado falha.
- **Turnstile** — cada domínio novo tem de ser acrescentado à lista de
  hostnames, senão ninguém entra.
- **Dois fatores (TOTP)** — em Definições → Segurança. O ecrã do código é da
  interface; o portão a sério é a política restritiva `app_data_exige_aal2` no
  `supabase-schema.sql`. **Se essa política não estiver aplicada, uma sessão em
  `aal1` continua a ler tudo pela API.**

### O plano gratuito não chega, e a razão não é o número de utilizadores

As fotografias são `data:` URI **dentro da base de dados** (`resizePhoto` a
700 px e qualidade 0,72 dá ~90 kB cada, já em base64). O bloco `fotos` é lido
**inteiro em cada abertura da aplicação**.

Um treinador com 30 alunos e 4 avaliações por ano com 3 fotografias faz ~32 MB
por ano — e cerca de **1 GB de tráfego por mês** só ele, se abrir a aplicação
todos os dias. O plano gratuito tem 500 MB de base de dados e 5 GB de tráfego:
**parte por volta do quinto cliente pagante**, e não por causa de "escala".

Some-se que os projetos gratuitos **suspendem ao fim de 7 dias sem atividade** e
não têm cópias de segurança diárias — inaceitável num produto vendido.

**A correção certa não é mudar de plano, é tirar as fotografias da base de
dados** e pô-las no Supabase Storage com URL assinado e temporário: carregam a
pedido em vez de em cada arranque, custam uma fração por GB, e fecham de caminho
o "URLs temporários para ficheiros" da especificação.

Variáveis em `.env.example`. Segredos ficam em `supabase secrets` e nas
variáveis do Vercel. Os `price_...` são públicos; **`sk_...` e `whsec_...` nunca
entram em conversa nem em ficheiro.**

---

## 8. Como trabalhar

- **Commit sim, push nunca.** Commits separados por tema, não um grande.
- **Antes de um lote grande, listar o que vai ser feito e esperar confirmação.**
- Quando algo tem de ser feito à mão (Supabase, Stripe, Vercel, Cloudflare), dar
  **passo a passo com o caminho dos menus**, não a ideia geral.
- Se um painel externo mudou de interface, pedir uma captura em vez de adivinhar.
- Heredocs do shell comem barras invertidas neste ambiente. Para scripts com
  regex, escrever o ficheiro com a ferramenta de escrita e correr com `node`.

---

## 9. Verificação

Não há testes automatizados. O padrão é **validar no browser com Playwright**:

```
npx vite --port 5199 --strictPort      # com VITE_SUPABASE_URL vazio,
                                        # a app corre em localStorage
```

Semeia-se `localStorage` com `page.addInitScript`, e as asserções são sobre
**o que ficou gravado**, não só sobre o que aparece no ecrã — vários bugs de
perda de dados só apareceram assim.

Para lógica que só corre contra o Supabase (o carimbo de versão), extrai-se a
função do ficheiro e corre-se contra um cliente falso. Já feito uma vez; o
padrão funciona.

**Sempre:** `npm run build`, 1440 px e 390 px, **os dois temas**, zero erros de
consola, zero transbordo horizontal.

Duas armadilhas de teste já apanhadas:
- CSS `uppercase` faz o `innerText` devolver maiúsculas — regex sensível a
  maiúsculas falha.
- `fullPage: true` redimensiona a viewport e reinicia a animação do Recharts:
  parece que o gráfico está vazio quando não está.

---

## 10. Estado real de cada área

O dono do produto tem uma especificação de 33 secções. **Descreve uma empresa
com dezenas de engenheiros, não um roteiro para uma pessoa.** Isto é o que
existe de verdade.

### Existe e funciona

| Área | |
|---|---|
| **Agenda** | Dia, semana, mês, lista · procura e filtros · horário de abertura por dia com exceções · horários livres em lote · arrastar com confirmação e desfazer · copiar/colar · recorrência com "só esta / toda a série" · **aviso de conflito** |
| **Faltas** | Estados, direito a reposição, crédito ligado à aula de origem |
| **Prescrição** | Treinos A/B/C, 2 076 exercícios, modelos, arquivo, PDF timbrado agrupado por bloco. Blocos, métodos como lista, 15 campos por exercício, duplicar, arrastar para reordenar |
| **Avaliações** | Dobras, % massa gorda, perímetros, fotografias, gráfico de evolução, PDF |
| **Finanças** | Entradas e saídas, categorias, IVA, taxa do ginásio, pendências |
| **Pagamentos** | Stripe: mensal/trimestral/anual, cartão, Apple Pay, Google Pay, MB WAY, webhook, portal de faturação, meses grátis |
| **Segurança** | Auth, RLS por utilizador, Turnstile, termos e política em pt-PT, dados na UE, exportação e apagamento |
| **Fiabilidade** | Gravação imediata, backup e restauro, **carimbo de versão contra perda silenciosa** |
| **Admin** | Subscrições, receita, churn, alertas |

### Falta, e é barato

- **Fotografias para o Storage** — ver a secção 7. É a próxima coisa a fazer,
  e não é só custo: é o que trava o crescimento
- Deslocação automática ao arrastar exercícios para fora do ecrã — hoje o
  arrasto só chega ao que está visível; os botões de subir e descer cobrem o
  resto
- Atalhos de teclado no construtor
- Códigos de recuperação para os dois fatores — hoje, perder o telemóvel é
  perder o acesso, e a interface di-lo

**A linha do exercício desenha os campos a partir de `CAMPOS_BASE` e
`CAMPOS_EXTRA`** — acrescentar um campo é estender uma lista, mais o PDF.

### Não é tarefa, é decisão de produto

| | Porquê |
|---|---|
| **Área do aluno** | Desbloqueia histórico, recordes, 1RM, progressão automática e adesão — hoje **não há de onde tirar esses dados**, porque o aluno não regista nada. Muda alojamento, termos, preço e suporte |
| **Faturação** | Em Portugal exige software **certificado pela AT**. Não se constrói, integra-se |
| **Multiprofissional, salas, locais** | Muda o modelo de dados inteiro, e vende-se a treinadores sozinhos |
| **Offline e sincronização** | Meses de trabalho |
| **Pix e boleto** | São brasileiros; a empresa é portuguesa e vende em euros |

### Fora de âmbito, por decisão tomada

Não construir sem o dono do produto voltar a pedir: nutrição (ato reservado a
nutricionistas em Portugal), wearables, marketplace, feed social, chat (os
clientes já usam WhatsApp), multiempresa e perfis granulares, IA (não há dados
de treino para analisar), análise de vídeo, e **vídeo nos exercícios** — o aluno
não tem acesso à aplicação, o que ele recebe é o PDF, e por isso os exercícios
têm instruções em texto, que imprimem.

---

## 11. O que vem a seguir

Combinado por níveis, do mais barato ao mais caro:

1. ~~Defeitos: conflito de horário e carimbo de versão~~ **feito**
2. ~~Agenda: vista de dia, lista, filtros, desfazer~~ **feito**
3. ~~Prescrição: métodos como lista, blocos, campos novos, duplicar e arrastar~~ **feito**
4. ~~Segurança: dois fatores e fechar sessão em todo o lado~~ **feito**
   — falta correr a política `app_data_exige_aal2` no Supabase
5. **Fotografias para o Storage** — custo e escala, ver secção 7
6. Decisões de produto — ver secção 10

---

## 12. O que não está aqui

Este ficheiro é público. O contexto privado — quem é o titular legal da empresa,
a identidade fiscal, preferências pessoais de trabalho — está na memória do
assistente, fora do repositório. Se precisar dele e não o tiver, **pergunte ao
dono do produto**; não o reconstrua por adivinhação nem o escreva aqui.

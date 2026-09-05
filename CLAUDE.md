# PTMANAGER

CRM para personal trainers, vendido por subscrição em Portugal. Interface e
documentos em **português de Portugal**, preços em euros.

> Este ficheiro é **público** (o repositório é público). Nunca escrever aqui
> chaves, segredos ou dados pessoais de clientes.

## Stack

React 18 + Vite 6 · Supabase (Auth, Postgres com RLS, Edge Functions em Deno) ·
Stripe · Recharts · lucide-react · Tailwind + CSS-in-JS. Sem router: a navegação
é estado (`view`). Sem gestor de estado externo.

## Onde está o quê

| Ficheiro | |
|---|---|
| `painel-pt.tsx` | **A aplicação quase toda** (~7 mil linhas): componentes, helpers, modelo de dados, `AppInner` |
| `src/components/LandingPage.tsx` | Página pública |
| `src/components/LegalDocs.tsx` | Termos e política de privacidade. **Contém declarações legais** |
| `src/components/Turnstile.tsx` | CAPTCHA |
| `src/data/exercicios.ts` | **Gerado.** 2 076 exercícios, 18 grupos, 14 categorias. Não editar à mão |
| `scripts/gerar-exercicios.mjs` | Gera o ficheiro acima a partir do catálogo MFIT (que não está no repositório) |
| `supabase/functions/` | 5 Edge Functions |
| `supabase-schema.sql` | Schema completo, idempotente |

`painel-pt.tsx` ser um ficheiro só é deliberado até haver razão para dividir.
Ao procurar código, usar `grep` por nome de função.

## Modelo de dados

**Não é relacional.** Tudo vive em `app_data`, uma linha por `(user_id, data_key)`,
com um vetor JSON inteiro por linha:

```
alunos · agenda · financas · fotos · categorias · definicoes · treinos
```

As chaves são limitadas por um `check` em `supabase-schema.sql`. **Uma chave nova
exige alterar esse `check` e correr o SQL no painel do Supabase.**

Consequências a ter presentes:

- Não há consultas ao conteúdo. Filtrar é sempre em memória.
- Cada gravação reescreve o bloco inteiro.
- **As avaliações físicas são sessões da agenda** (`type: 'avaliacao'` + campos
  `assess*`), não uma entidade própria. Editar avaliações toca na agenda.
- As fotografias são `data:` URI dentro do bloco `fotos`. Não usar para vídeo.
- **A biblioteca de exercícios é a exceção: não é gravada.** Vive no código
  (`src/data/exercicios.ts`) e só as diferenças vão para a base de dados —
  `bibliotecaExtra` (criados), `bibliotecaEdicoes` (alterados),
  `bibliotecaOcultos` (apagados). `normalizarTreinos` deriva a lista completa
  ao ler; `serializarTreinos` volta a tirá-la antes de gravar. Sem isto,
  guardar um treino reescrevia ~300 kB de exercícios que já estão no `bundle`.
  O id de um exercício de origem é `'e:' + nome`, estável entre versões, para
  as prescrições não perderem a ligação.

O modelo aguenta o que existe. Torna-se insuficiente quando chegar a área do
aluno, os vídeos ou a partilha em equipa.

## Convenções

**Idioma.** Interface, comentários e mensagens em pt-PT. `liberar`→`libertar`,
`em um`→`num`, `seu plano`→`o seu plano`. Números com vírgula decimal:
`toLocaleString('pt-PT')`, nunca `toFixed` em texto visível.

Isto vale também para os dados. O catálogo de exercícios veio do Brasil e é
traduzido no gerador, não à mão: `panturrilha`→`gémeos`, `esteira`→`passadeira`,
`quadríceps`→`quadricípites`, `posteriores de coxa`→`isquiotibiais`,
`caneleira`→`tornozeleira`. Um termo novo acrescenta-se a `SUBSTITUICOES` em
`scripts/gerar-exercicios.mjs` e volta a correr-se o script.

**Design.** Tokens CSS em `GlobalStyles` (`--brass` turquesa, `--rust`,
`--gold`, `--bg-*`, `--text-*`). Regras do dono do produto:

- **Não usar cards dentro de cards.**
- Vermelho é erro ou perigo — nunca uma ação positiva.
- Mobile-first; validar sempre a 390 px e a 1440 px.

**Acessibilidade.** Nunca aninhar `<button>` dentro de elemento com
`role="button"` — é ARIA inválido e contamina o nome acessível. Botões de ação
sobre um cartão clicável são **irmãos**, não filhos.

## Armadilhas já encontradas

- **Ícones no estado persistido.** Um componente React não sobrevive a
  `JSON.stringify`. Usar `iconOf()` ao ler ícones de dados gravados.
- **`grid-cols-3` cai para 2 no telemóvel** por regra global. Uma grelha de 3
  itens deixa uma linha órfã — usar 2 ou 4.
- **`.font-mono` está isento de `overflow-wrap: anywhere`**, senão "07:00" parte
  em três linhas.
- **Estado velho em gravações encadeadas.** `persistTreinos` aceita uma função
  do valor atual justamente por isso: duas gravações no mesmo handler a partir
  do estado do render perdem a primeira.
- **`const` não é içado.** Uma constante usada antes da declaração rebenta a
  app no arranque, e o build passa na mesma.
- **Impressão.** A folha é montada num portal para o `body`, para o CSS de
  impressão esconder a app com um seletor de filho direto. Gráficos de impressão
  usam dimensões fixas — o `ResponsiveContainer` mede zero fora do ecrã.
- **`fmtDateBR` devolve `dd/mm` sem ano.** Serve na agenda, não em documentos.
- **Listas de dois mil elementos não se desenham inteiras.** O seletor de
  exercícios mostra 60 e diz quantos ficaram de fora. A pesquisa é sobre um
  campo `busca` pré-calculado sem acentos — normalizar 2 076 nomes a cada tecla
  custava tempo, e sem isso escrever "biceps" não encontrava "Bíceps".

## Infraestrutura

- **Supabase** — projeto `veqeecnwtwunntojicko`, região `eu-west-3` (Paris).
  Está na UE de propósito: os dados incluem avaliações físicas e fotografias
  corporais, categoria especial do RGPD. **Mudar de região obriga a atualizar
  `HOSTING_REGION` em `LegalDocs.tsx`** — é uma declaração legal.
- **Stripe** — conta portuguesa. Cartão, Apple Pay, Google Pay e MB WAY.
  MB WAY e Multibanco **não fazem subscrição recorrente**: o MB WAY é pagamento
  único e o webhook concede os meses de acesso.
- **Meses grátis** — trimestral +1, anual +2. Concedidos pelo `stripe-webhook`,
  não pela Stripe, e só no primeiro ciclo.
- **Vercel** — `ptmanagerapp.com`. Registos DNS no Cloudflare com o **proxy
  desligado** (nuvem cinzenta), senão o certificado falha.
- **Turnstile** — cada domínio novo tem de ser acrescentado à lista de hostnames,
  senão ninguém entra.

Segredos ficam em `supabase secrets` e nas variáveis do Vercel. Os `price_...`
são públicos; `sk_...` e `whsec_...` nunca entram em conversa nem em ficheiro.

## Verificação

Não há testes automatizados. O padrão desta base de código é **validar no
browser com Playwright**: sessão simulada em `localStorage`, `page.route` a
intercetar Supabase e Stripe, e asserções sobre **o que foi gravado**, não só
sobre o que aparece no ecrã — vários bugs de perda de dados só apareceram assim.

Sempre: `npm run build`, 1440 px e 390 px, zero erros de consola, zero overflow
horizontal.

## Fora de âmbito, por decisão

Não construir sem o dono do produto voltar a pedir: nutrição (ato reservado a
nutricionistas em Portugal), wearables, marketplace, feed social, chat (os
clientes já usam WhatsApp), multiempresa e perfis granulares (vende-se a
treinadores individuais), IA (não há dados de treino para analisar), e análise
de vídeo.

A especificação de 33 secções que originou estas escolhas descreve uma empresa
com dezenas de engenheiros, não um roteiro para uma pessoa.

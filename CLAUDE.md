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
2. **Quase tudo está num ficheiro:** `painel-pt.tsx`, ~16 500 linhas. É
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
| **Avaliações** | Dobras (5 protocolos), bioimpedância, 14 perímetros, cintura-anca, metas, fotografias, evolução, PDF timbrado |
| **Finanças** | Entradas e saídas, categorias, IVA, pendências |

Mais um separador **Admin**, só visível ao dono da aplicação.

O aluno **não tem acesso**. O que ele recebe é um PDF. Isto não é uma limitação
técnica — é uma decisão de produto, e condiciona metade do que se pode oferecer
(ver secção 10).

---

## 3. Onde está o quê

| Ficheiro | |
|---|---|
| `painel-pt.tsx` | **A aplicação quase toda** (~16 500 linhas): componentes, helpers, modelo de dados, `AppInner` |
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
alunos · agenda · financas · fotos · categorias · definicoes · treinos ·
formularios
```

As chaves são limitadas por um `check` em `supabase-schema.sql`. **Uma chave
nova exige alterar esse `check` e correr o SQL no painel do Supabase.**

Consequências que decidem quase tudo:

- **Não há consultas ao conteúdo.** Filtrar é sempre em memória.
- **Cada gravação reescreve o bloco inteiro.** Daí o carimbo de versão, abaixo.
- **As avaliações físicas são sessões da agenda** (`type: 'avaliacao'` + campos
  `assess*`), não uma entidade própria. Mexer em avaliações mexe na agenda.
  Uma avaliação tem estado (`assessEstado`: `rascunho` ou `final` — quem não
  tem o campo é final) e história (`assessVersoes`: até 20 retratos dos campos
  anteriores, cada um com quem, quando e porquê). Escrever num rascunho não
  gera revisão; finalizar e rever um documento final geram. **O autosave grava
  em silêncio e só para rascunhos** — guardar sozinho um documento já entregue
  criaria revisões sem motivo.
- **As fotografias já não vivem aqui.** O bloco `fotos` guarda só
  `{ id, path, createdAt }`; os ficheiros estão no balde privado `fotos` do
  Supabase Storage, em `<user_id>/<foto_id>.jpg`, e chegam por URL assinado com
  oito horas de prazo. `photosById` continua a devolver `dataUri` para o resto
  da aplicação não ter de saber disto — em modo local é mesmo a imagem, com
  conta ligada é o endereço assinado. Uma fotografia antiga com `dataUri` e sem
  `path` ainda aparece: a migração é preguiçosa e segura de interromper.
- **Um exercício de treino é uma lista de linhas, não "3 séries de 10".**
  `ex.linhas` é a fonte de verdade; cada linha tem um `tipo` que decide os
  campos (`TIPOS_SERIE`). Os campos antigos (`series`, `reps`, `carga`,
  `descanso`, `rpe`…) foram para dentro das linhas, e
  `migrarExercicioParaLinhas` converte quem ainda os tenha — é idempotente e
  corre em `normalizarTreinos`. O método pode levar números próprios em
  `ex.metodoParams` (`CAMPOS_POR_METODO`), e `ex.grupo` liga os exercícios de
  uma supersérie, que ganham etiqueta A1/A2 por `etiquetasDeGrupo`.
- **Um horário livre é um evento**, `kind: 'evento'` com `type: 'horario_livre'`.
  `type: 'bloqueado'` é o mesmo espaço marcado como indisponível — apagar não
  chegava, porque «Libertar horários da semana» voltava a encher o buraco. A
  conversão entre aula e evento só se abre nos dois casos em que não há
  ligação viva a perder: um horário livre passa a aula, e uma aula
  **cancelada** volta a horário livre.
- **As exceções de horário vivem em `definicoes.excecoes`**, uma por data, e
  ganham ao dia da semana (`horarioDoDia`). Estiveram meses a ser lidas sem
  que houvesse por onde escrevê-las.
- **O crédito de reposição é a falta.** Não há entidade "crédito": a sessão
  com `status: 'falta'` leva `faltaPrecisaReposicao`, `faltaCreditoValidade`,
  `faltaCreditoPor`, `faltaCreditoEm` e `faltaCreditoLog` (o registo de
  auditoria), e liga-se à aula de reposição pelos dois sentidos —
  `reposicaoSessionId` na falta, `reposicaoDeSessionId` na reposição. **O
  estado nunca é gravado:** `reposicaoEstadoDe` deriva-o da reposição ligada e
  da validade, para não haver dois valores a dessincronizar. A regra por
  omissão (gerar automático, validade em dias) vive em `definicoes.reposicao` e
  só se aplica na altura de conceder — mudar a regra não encurta prazos já
  dados.
- **O timbre vive em `definicoes.timbre`**, e o logótipo lá dentro como `data:`
  URI — ao contrário das fotografias, que foram para o Storage. É um só,
  pequeno, e tem de estar carregado no instante em que a folha imprime. As
  secções de cada documento (`timbre.seccoes`) são reconstruídas ao ler a
  partir de `SECCOES_AVALIACAO` / `SECCOES_TREINO`, para uma secção nova
  aparecer ligada a quem já tinha timbre gravado.
- **Os formulários de saúde vivem em `formularios`** — `modelos` (os que o
  treinador criou) e `respostas`. Os três de origem (PAR-Q, anamnese,
  consentimentos) estão no código, como a biblioteca: não se gravam e não se
  editam, duplicam-se. **A redação do PAR-Q não se mexe** — reescrito deixa de
  ser o instrumento. Preencher de novo acrescenta uma resposta, nunca
  substitui: um consentimento assinado no ano passado vale pelo que foi
  assinado nessa altura. **As assinaturas são imagens no bloco `fotos`** e no
  balde do Storage, lidas por `photosById` (nunca por `urlsDeFotos`, que está
  vazio em modo local).
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
- **A procura da biblioteca traduz o termo, não o exercício.** `termosDeBusca`
  aplica `TERMOS_ESTRANGEIROS` ao que foi escrito e devolve as duas leituras;
  `correspondeABusca` compara com o índice do exercício (nome + sinónimos).
  Guardar um segundo nome para cada um dos 2076 custaria memória sem ganhar
  nada. **Os pares pt-BR são os mesmos de `SUBSTITUICOES` no gerador, lidos ao
  contrário — um termo novo acrescenta-se aos dois sítios.**
- **Este ficheiro é CRLF.** Um script que substitua `\n` por `\r\n` numa
  cadeia que já tem `\r\n` produz `\r\r\n`, e **um único `\r` a mais faz o
  git dar o ficheiro inteiro como reescrito** — 11 mil linhas de diff por
  causa de um byte. Escrever sempre com `newline=''` e verificar o
  `git diff --stat` antes de commitar.
- **Listas de dois mil elementos não se desenham inteiras.** O seletor de
  exercícios mostra 60 e diz quantos ficaram de fora. A pesquisa usa um campo
  `busca` pré-calculado sem acentos — sem isso, escrever "biceps" não encontrava
  "Bíceps".
- **Impressão.** A folha é montada num portal para o `body`, para o CSS de
  impressão esconder a aplicação com um seletor de filho direto. Gráficos de
  impressão usam dimensões fixas — o `ResponsiveContainer` mede zero fora do
  ecrã. **Os PDF saem sempre a preto sobre branco, seja qual for o tema.**
- **`fmtDateBR` devolve `dd/mm` sem ano.** Serve na agenda, não em documentos.
- **Não há como numerar páginas em CSS de impressão.** `counter(page)` só vive
  nas *page margin boxes*, que o Chrome não suporta. Quem numera é a opção
  «Cabeçalhos e rodapés» da caixa de impressão, e as definições dizem-no ao
  utilizador. O que se consegue repetir em todas as folhas é um elemento
  `position: fixed` — é assim que sai o aviso de confidencialidade.
- **As regras da folha vivem em `regrasDaFolha(prefixo)`**, emitidas duas
  vezes: dentro de `@media print` e dentro de `.print-previa`. Escrever uma
  regra só num dos sítios faz a pré-visualização mentir sobre o papel.
- **Uma sub-vista tapa a navegação.** Treinos, formulários e ficha ocupam o
  ecrã inteiro; `mudarVista` fecha-as antes de trocar de separador, senão
  carregar em «Agenda» não fazia nada e a aplicação parecia encravada.
- **Erro de leitura engolido = conta vazia.** `loadAll` distingue «não há
  dados» de «não consegui ler os dados» e levanta um aviso fixo no segundo
  caso. Sem isso, uma política mal escrita passou semanas sem dar sinal: o
  servidor recusava tudo e a aplicação mostrava uma conta limpa.
- **Botões dentro de um `role="button"` partem mesmo.** Não é teoria de
  acessibilidade: o nome acessível do cartão passa a incluir o rótulo de cada
  ação, e um clique no botão abre o formulário do cartão. Já aconteceu com os
  botões de estado do `SessionCard`. O padrão certo estava ao lado, na pega de
  arrastar: **irmão** do cartão, sobreposto em `position: absolute`, com o
  cartão a abrir-lhe um vão da mesma largura para o texto não passar por baixo.
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
  **Uma política nunca pode consultar `auth.mfa_factors` diretamente.** Corre
  com os direitos de quem faz o pedido, e `authenticated` não pode ler essa
  tabela — o resultado é `42501 permission denied` em *todas* as consultas a
  `app_data`, leituras incluídas, e uma conta cheia a aparecer vazia. A
  pergunta vive em `public.aal_suficiente()`, `security definer`, que devolve
  só sim ou não. Dar `select` nessa tabela a `authenticated` resolveria o erro
  e exporia a coluna `secret` dos códigos TOTP de toda a gente.

- **Storage** — balde privado `fotos`, criado pelo `supabase-schema.sql` com
  limite de 5 MB e só imagens. As políticas escoram-se no primeiro segmento do
  caminho ser o id do dono, e exigem `aal2` a quem tem dois fatores. A CSP do
  `index.html` tem de aceitar `img-src https://*.supabase.co`, senão nenhuma
  fotografia aparece.

### Sobre o plano do Supabase

O gratuito não serve para um produto vendido: **suspende ao fim de 7 dias sem
atividade** e não tem cópias de segurança diárias. O Pro (~25 $/mês) é o chão.

O que era o verdadeiro travão já foi corrigido: as fotografias estavam em
base64 dentro da base de dados e o bloco viajava inteiro em cada abertura —
~1 GB de tráfego por mês e por treinador, o que rebentava o plano gratuito por
volta do **quinto cliente**. Agora carregam a pedido, do Storage.

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
  maiúsculas falha. **Já custou tempo três vezes:** comparar sempre em
  minúsculas o texto de títulos de secção e de rótulos.
- **O rato do Playwright usa coordenadas da janela.** Um elemento abaixo da
  dobra dentro de um modal com scroll não recebe nada: `scrollIntoViewIfNeeded()`
  antes de ler o `boundingBox()`.
- `fullPage: true` redimensiona a viewport e reinicia a animação do Recharts:
  parece que o gráfico está vazio quando não está.
- **`getByRole(..., { name })` compara por subcadeia, não por igualdade.**
  `name: 'Acrescentar'` apanha o «Acrescentar intervalo» que está mais acima
  na página. Usar `exact: true` quando o rótulo é prefixo de outro.
- **`.first()` não chega se o primeiro estiver escondido.** A agenda desenha
  mais do que uma escala ao mesmo tempo: usar `locator('[role="button"]:visible')`.

---

## 10. Estado real de cada área

O dono do produto tem uma especificação de 33 secções. **Descreve uma empresa
com dezenas de engenheiros, não um roteiro para uma pessoa.** Isto é o que
existe de verdade.

### Existe e funciona

| Área | |
|---|---|
| **Agenda** | Dia, semana, mês, lista · procura e filtros · **botão de horários na própria agenda**, com horário por dia, **exceções por data** e pré-visualização da semana · horários livres em lote · **arrastar larga e move, com desfazer** · **selecionar várias e mover, mudar a duração, bloquear ou apagar de uma vez** · copiar/colar · recorrência com "só esta / toda a série" · **replicar uma marcação por X semanas** · **três botões de confirmação com cor cheia: dada, falta, e falta com direito a reposição** · **aviso de conflito** |
| **Faltas** | Estados, direito a reposição, crédito ligado à aula de origem · **validade do crédito, estado "Expirada" e registo de auditoria** (quem concedeu, quando, o que aconteceu desde então) |
| **Prescrição** | Treinos A/B/C, 2 076 exercícios, modelos, arquivo, PDF timbrado agrupado por bloco. Blocos, métodos como lista, 15 campos por exercício, duplicar, arrastar para reordenar · **combinações com nome e cor** (bi-set, supersérie, trissérie e mais nove), cada membro num tom da cor do grupo |
| **Vista de treino** | O programa como se lê, e não como se escreve: um treino de cada vez, por bloco, com o resumo em números (exercícios, séries, pausa somada, volume). **A carga de cada série e os números do método editam-se ali mesmo**; o resto é no construtor. `TreinoVista`, ao lado de `PrescricaoBuilder` |
| **Biblioteca** | Procura que traduz o termo escrito (pt-BR e inglês de ginásio) · sinónimos por exercício · favoritos · pastas · progressões, regressões e substituições, com **troca de exercício num clique dentro do treino** |
| **Avaliações** | Dobras, % massa gorda, perímetros, fotografias, gráfico de evolução, PDF · **rascunho e final, autosave, revisões com motivo, comparar e repor** |
| **Documentos** | Timbre com logótipo próprio, estúdio, nº profissional e contactos · aviso de confidencialidade em todas as folhas · escolher que secções saem · **pré-visualizar antes de imprimir** · abrir o e-mail para o aluno |
| **Finanças** | Entradas e saídas, categorias, IVA, taxa do ginásio, pendências |
| **Pagamentos** | Stripe: mensal/trimestral/anual, cartão, Apple Pay, Google Pay, MB WAY, webhook, portal de faturação, meses grátis |
| **Relatórios** | Relatório do período (atividade, ocupação da agenda, receita dos planos, lançamentos, tabela por aluno) e relatório de progresso do aluno (primeira vs última avaliação, com gráfico) · ambos timbrados |
| **Ficha 360º** | Aulas, faltas, avaliações, treinos e formulários numa linha só, por aluno · procura livre sobre tudo · filtros por tipo e período · resumo com comparência e créditos · os pontos a ter em conta em cima |
| **Formulários** | PAR-Q, anamnese e consentimentos (treino, imagem, dados de saúde) · construtor próprio · assinatura desenhada · PDF timbrado · pontos a ter em conta, ditos como avisos |
| **Segurança** | Auth, RLS por utilizador, Turnstile, termos e política em pt-PT, dados na UE, exportação e apagamento |
| **Fiabilidade** | Gravação imediata, backup e restauro, **carimbo de versão contra perda silenciosa** |
| **Admin** | Subscrições, receita, churn, alertas |

### Falta, e é barato

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

## 10b. Regra que a especificação impõe e é fácil esquecer

**A aplicação assinala, nunca diagnostica.** As faixas de referência da OMS para
a cintura e a relação cintura-anca são apresentadas como faixas, com a ressalva
à vista, e nunca como veredicto. O mesmo vale para o PAR-Q e para a anamnese: um
«sim» levanta um **ponto a ter em conta**, com a ressalva escrita ao lado, no
ecrã e no PDF — nunca um impedimento, uma aptidão ou uma autorização médica. E as cores dessas faixas não usam vermelho — aqui o vermelho é erro, e
uma medida fora da faixa não é um erro de ninguém.

## 11. O que vem a seguir

Combinado por níveis, do mais barato ao mais caro:

1. ~~Defeitos: conflito de horário e carimbo de versão~~ **feito**
2. ~~Agenda: vista de dia, lista, filtros, desfazer~~ **feito**
3. ~~Prescrição: métodos como lista, blocos, campos novos, duplicar e arrastar~~ **feito**
4. ~~Segurança: dois fatores e fechar sessão em todo o lado~~ **feito**
   — SQL corrido: `aal_suficiente()` e as duas políticas restritivas estão
   aplicadas (`polpermissive = false` nas duas)
5. ~~Fotografias para o Storage~~ **feito** — falta correr o SQL do balde
6. ~~Avaliações: perímetros, cintura-anca, metas, comparação~~ **feito**
7. ~~Séries individuais, campos por método, combinar em supersérie~~ **feito**
8. ~~Agenda: aluno no horário livre, célula colorida, vários intervalos por
   dia, copiar horário, duração do slot, créditos com validade e auditoria,
   mover vários eventos~~ **feito**
9. ~~Timbre completo: logótipo, contactos, nº profissional, aviso de
   confidencialidade, escolher secções, pré-visualizar~~ **feito**
   — a numeração das páginas é do browser, não da aplicação (ver secção 6)
10. ~~Versões da avaliação: rascunho, revisões, quem editou, comparar,
    restaurar, motivo, autosave~~ **feito**
11. ~~Biblioteca: procura em pt-BR e inglês, sinónimos, progressões,
    regressões, substituições, pastas, favoritos~~ **feito**
    — **menos os nomes ingleses dos 2076**: o catálogo MFIT já não está no
    disco e com ele foi-se o `name_en`. Se voltar a aparecer, o gerador pode
    passar a guardá-lo
12. ~~Anamnese, PAR-Q e consentimentos — construtor de formulários~~ **feito**
    — SQL corrido: `formularios` já está no `check` do `data_key`
13. ~~Ficha 360º com linha temporal pesquisável~~ **feito**
    — sem os pagamentos: uma transação não tem `studentId`
14. ~~Progresso e relatórios — só o que existe sem área do aluno~~ **feito**
15. **IA** — decisão do dono do produto, não tarefa. Ver secção 10
16. Decisões de produto — ver secção 10

---

## 12. O que não está aqui

Este ficheiro é público. O contexto privado — quem é o titular legal da empresa,
a identidade fiscal, preferências pessoais de trabalho — está na memória do
assistente, fora do repositório. Se precisar dele e não o tiver, **pergunte ao
dono do produto**; não o reconstrua por adivinhação nem o escreva aqui.

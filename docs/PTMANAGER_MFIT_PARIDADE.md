# Matriz de cobertura

Estado de cada área do documento «Prompt Mestre» v2.0 (27/10/2026), sem IA e sem
o módulo FMS, retirado pelo dono do produto a 30/10/2026. Revista contra o texto do
documento a 30/10/2026.

**Estados:**

- **Feito:** existe, está ligado à navegação e foi testado.
- **Parcial:** o essencial existe; a coluna diz o que falta.
- **Externo:** o código existe, desligado, à espera de credenciais ou de um fornecedor.
- **Falta:** não existe.
- **Fora:** decisão do dono do produto.

**O que «Feito» ainda não quer dizer.** Nada do que depende de `supabase-schema.sql`
novo ou das Edge Functions novas está aplicado em produção (ver «Para ligar»). Foi
testado com um servidor simulado que corre as mesmas funções puras; não foi testado
num Supabase real, nem num telemóvel real. Pela definição de pronto do documento
(secção 11), o roteiro **não está concluído**: faltam estes passos e as linhas abaixo
marcadas como Parcial, Externo e Falta.

## 5. Paridade

| Secção | Área | Estado | Falta / notas | Testes |
|---|---|---|---|---|
| 2.10 | Data de início, RIR alvo, título de evento | Feito | | `validar-prescricao`, browser |
| 5.1 | Importação CSV, pipeline de contactos, conversão sem duplicar, lixeira | Feito | | `validar-modulos-3`, browser |
| 5.1 | Autocadastro por link | Feito | Vira contacto, nunca aluno sozinho | `validar-modulos-4`, browser simulado |
| 5.1 | Segmentos guardados, ações em lote sobre alunos | Falta | Há grupos e etiquetas | |
| 5.1 | Prazo de retenção da lixeira | Falta | Recupera-se sem limite; a eliminação definitiva continua na ficha | |
| 5.1 | Último acesso do aluno, revogar sessões | Falta | Reenvio e estado do convite já existiam | |
| 5.1 | Ficha 360º com os módulos novos | Parcial | Não mostra documentos, faturas, contactos nem desafios | |
| 5.2 | Vídeo do exercício | Parcial | Um por exercício, por decisão do dono do produto: ficheiro até 10 s ou link do YouTube. O link chega à área do aluno; o ficheiro não. Sem GIF nem limites configuráveis | `validar-modulos-4`, browser |
| 5.3 | Clonar programa | Parcial | Falta destino em grupo e para modelos | `validar-prescricao`, browser |
| 5.3 | Presets, versões, publicação, ciclos, treino extra, replicar série, RIR | Parcial | Presets ao nível de exercício e treino, não de série; sem favoritar nem versionar presets | `validar-modulos`, browser |
| 5.3 | Partilha por link e PDF | Parcial | Link com token e PDF timbrado; sem expiração nem atalho de WhatsApp no link | |
| 5.3 | Interface e executor por método | Parcial | Campos por método e cronómetros EMOM, AMRAP, Tabata, intervalado e For time; sem guia passo a passo para cluster, drop-set e afins | `validar-modulos`, browser |
| 5.4 | Execução, valores reais, feedback, central de feedbacks | Parcial | Sem campos obrigatórios configuráveis, sem lado D/E por série | `validar-sessoes`, browser |
| 5.4 | Frequência, evolução de cargas, recordes, 1RM com fórmula | Feito | | `validar-modulos`, browser |
| 5.4 | Corrigir sessão com motivo e versões; ligar à agenda | Falta | Corrige-se e apaga-se sem histórico; «Aula dada» não liga ao registo | |
| 5.5.1 | Protocolos, Yuhasz, Brozek | Parcial | Petroski 1995 por confirmar em fonte fiável: não se inventa. O registo tem 6 fichas validadas, não 11 | browser |
| 5.5.2 a 5.5.6, 5.5.8 a 5.5.11 | Online, recorrência, postural, neuromotora, funcional, força, condicionamento, mobilidade, revisões, PDF | Feito | Online só com o servidor ligado | `validar-modulos-2`, browser |
| 5.5.7 | FMS | Fora | Retirado pelo dono do produto | |
| 5.6.1, 5.6.2 | Modelos de horário por intervalo, com pré-visualização | Feito | | `validar-modulos-3`, browser |
| 5.6.3 | Copiar para outro dia, com desfazer | Feito | Numa ação só, sem área de transferência | browser |
| 5.6.3 | Arrastar com confirmação | Parcial | **Só rato e caneta.** O toque já falhou num telemóvel real e não se verifica sem um; em toque, mover é por seleção ou pelo formulário | browser (rato) |
| 5.6.4 | Lembretes | Parcial | Aviso na área do aluno nas 24 h anteriores; sem minutos configuráveis nem envio | `validar-modulos-4` |
| 5.6.5 | Agenda do aluno, pedidos, cancelamento, reposições à vista | Parcial | Sem reservar em horários livres nem usar o crédito sozinho: tudo passa pelo treinador | `validar-modulos-4`, browser simulado |
| 5.6.6 | Turmas, lista de espera com ordem determinística | Parcial | Promove à mão; a aceitação com prazo não chega ao aluno | `validar-modulos-3`, browser |
| 5.7.1 | Push | Externo | Ativar e desligar na área do aluno, lembretes de aula e avisos, silêncio das 22:00 às 08:00. Falta criar as chaves VAPID e o agendador, e **nunca correu com um serviço real** | `validar-modulos-4`, browser simulado |
| 5.7.2, 5.7.3 | Modelos com variáveis, WhatsApp por ligação | Feito | | `validar-modulos-3`, browser |
| 5.7.4 | Feed de atualizações | Parcial | Aniversários, faturas, avaliações em atraso, créditos e pedidos; sem recordes nem treinos concluídos | browser simulado |
| 5.7.5 | Comentários contextuais | Parcial | Resposta ao feedback; sem progresso nem documentos | |
| 5.8 | Central de retenção | Parcial | Cinco estados, regras configuráveis, retrato semanal, denominadores; sem filtros por plano ou grupo, sem ação em lote, sem períodos anuais | `validar-modulos-3`, browser |
| 5.9 | Progresso do aluno | Parcial | Publica texto, medida e fotografia com consentimento, e o treinador revê; sem comparação lado a lado | `validar-modulos-4`, browser simulado |
| 5.10 | Documentos | Parcial | PDF e imagem, balde privado, visibilidade; sem substituir por versão, validade nem profissional parceiro | browser simulado |
| 5.11 | Área do aluno | Parcial | Início, agenda, progresso, histórico, avisos, formulários, contratos, avaliações, faturas, documentos, língua; sem unidades, sem gerir password a partir do perfil | `validar-modulos-4`, browser simulado |
| 5.12 | Planos, faturas, estados, IVA, inadimplência, relatórios | Parcial | Em cêntimos; sem parcelamento, upgrade nem lembretes automáticos | `validar-modulos-3`, browser |
| 5.12 | Cobrança online, KYC, payout | Externo | Botão «Pagar» do aluno e ligação do treinador, em conta Stripe Standard de cada treinador, que paga as taxas e responde às disputas. Desligada por omissão e só em modo de teste; sem saldo nem lista de payouts. **Nunca correu contra o Stripe** | `validar-modulos-4`, browser simulado |
| 5.13 | Página pública de vendas | Parcial | Publicação por retrato, consentimento, Turnstile, limite de pedidos; sem checkout, FAQ, fotografia, funil UTM nem Open Graph por página (a aplicação é SPA) | `validar-modulos-4`, browser simulado |
| 5.14 | Desafios | Parcial | Link público, etapas, acompanhamento, passar a contacto; sem duplicar, capacidade, recado nem converter logo em aluno | `validar-modulos-3`, `validar-modulos-4` |
| 5.15 | Pontos, conquistas, recompensas | Parcial | Registo imutável, idempotência, resgate e reversão; só treinos pontuam sozinhos, e não se desliga por aluno | `validar-modulos-3`, browser |
| 5.16 | Conteúdos e imagens para redes | Parcial | Biblioteca começa vazia, de propósito, e sem ecrã de gestão; imagens com modelos próprios | browser |
| 5.17 | Relatórios | Parcial | Números dentro de cada área; sem relatório único com CSV e PDF de tudo | |
| 5.18 | pt, en, es | Parcial | **Só área do aluno (navegação e ecrãs novos) e páginas públicas.** O registo de sessão do aluno e toda a aplicação do treinador continuam em português. Sem unidades imperiais nem fuso por utilizador | `validar-modulos-4`, browser |

## 6. Diferenciais

| Secção | Área | Estado | Falta / notas |
|---|---|---|---|
| 6.1 | Check-in de prontidão | Parcial | Regras escritas e fixas; sem histórico nem correlação |
| 6.2 | Metas e marcos | Feito | Marcos são texto |
| 6.3 | Tarefas | Parcial | Criadas à mão, pela retenção, pela satisfação e por regras; não a partir da Ficha 360º |
| 6.4 | Regras quando/então | Parcial | Correm ao abrir a área, sem servidor a vigiar; só criam tarefas |
| 6.5 | Operações em lote | Parcial | Agenda sim; alunos e faturas não |
| 6.6 | Portabilidade | Parcial | Cópia com módulos e exportação por aluno; sem checksum nem exportação de ficheiros |
| 6.7 | PWA | Parcial | Manifesto e casca sem dados; sem fila offline nem aviso de sem ligação. O rascunho do treino já vivia no aparelho |
| 6.8 | Calendário | Feito | `.ics` e ligação revogável; sem OAuth, por decisão do documento |
| 6.9 | Contratos | Parcial | Versão imutável, aceite simples; sem assinatura desenhada nem cópia a descarregar pelo aluno |
| 6.10 | Satisfação e indicação | Parcial | NPS, indicação, depoimentos com autorização; sem CSAT nem prémio automático |
| 6.11 | Locais e regras de reserva | Parcial | Conflito de local e preparação; sem horário por recurso nem depósito |

## 8. Segurança

| Secção | Área | Estado | Falta / notas |
|---|---|---|---|
| 8.1 | RLS | Parcial | Em todas as tabelas novas, **por testar num Supabase real** |
| 8.2 | Dados de saúde | Parcial | Fotografia com consentimento próprio, balde privado com dois fatores; sem registo de acessos a ficheiros |
| 8.3 | Pagamentos | Parcial | Assinatura, idempotência, domínio separado; por testar com eventos reais |
| 8.4 | Tokens e links | Feito | Hash, âmbito reduzido, revogação, Turnstile, limite de pedidos |
| 8.5 | Auditoria | Parcial | Pagamentos, devoluções, exceções de acesso, conversões, aceites e exportações; não cobre publicações de programa, presenças nem pontos |
| 8.6, 8.7 | Observabilidade e lançamento gradual | Falta | Só o interruptor da carteira |

## Para ligar

Nada disto foi feito: é do dono do produto, quando decidir.

1. Correr `supabase-schema.sql` (aditivo e repetível). **Antes disso as áreas novas
   gravam, mas as tabelas novas não existem.** O `check` `modulo:` é o primeiro a
   fazer falta.
2. Publicar as funções novas e a `aluno-view` alterada: `aluno-acao`, `publico`,
   `publico-calendario`, `cobranca-onboarding`, `cobranca-checkout`,
   `cobranca-webhook`, `notificacoes-despachar`, `aluno-view`.
3. Segredos: `TURNSTILE_SECRET_KEY` (sem ele as páginas públicas recusam formulários).
   Opcionais: `STRIPE_CONNECT_ENABLED`, `STRIPE_CONNECT_SECRET_KEY`,
   `STRIPE_CONNECT_WEBHOOK_SECRET`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`,
   `CRON_SECRET`.
4. No Turnstile, confirmar que o domínio está na lista.
5. Revisão legal da política de privacidade e dos termos. Passa a haver cobrança,
   contratos, fotografias enviadas pelo aluno, formulários públicos e contas de aluno.

## Decisões

- **Sessões separadas:** cada cliente Supabase só lê do endereço a sessão que é sua.
- **Data de início:** um aluno novo começa com a data de hoje; os antigos ficam vazios.
- **Cópia de programa:** o período recomeça hoje, nasce ativa e mantém a `origem`.
- **Título:** só em eventos; numa aula, o nome é o do aluno.
- **Ninguém de fora escreve nos dados da conta.** Aluno e público criam `entradas`, e
  é o treinador quem aceita. Evita conflitos nos blocos e mantém a decisão com ele.
- **O público lê um retrato:** publicar copia só o que é público para
  `publico_enderecos`. A página nunca lê `app_data`.
- **A vista do aluno é uma função pura** (`_shared/vista-aluno.ts`): cada campo sai
  por nome. As regras copiadas de `src/features` conferem-se em `validar-modulos-4`.
- **Cobrança separada da assinatura:** outro segredo, outro webhook, outras tabelas.
  Só o webhook confirma; um pagamento à mão fica assinalado como tal.
- **Sem cron:** regras e faturas em falta calculam-se ao abrir, de forma repetível.
- **Um comprovativo não é uma fatura:** faturação legal exige software certificado.

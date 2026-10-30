# Matriz de cobertura

Estado de cada área do documento «Prompt Mestre» v2.0 (27/10/2026), sem IA e sem
o módulo FMS, retirado pelo dono do produto a 30/10/2026.

**Estados:** Feito · Parcial · Falta · Externo (depende de um fornecedor ou de
credenciais) · Fora (decisão).

A coluna «Base» resume uma auditoria ao código de 26/10/2026, não uma nova
verificação linha a linha. Antes de implementar uma área, confirma-se no código.

| Secção | Área | Base no código | Estado | Testes |
|---|---|---|---|---|
| 2.10 | Data de início do aluno | Lida, sem campo | Feito | Browser, 390/1440 |
| 2.10 | RIR alvo, valor ou faixa | Nos dados e no registo, sem campo | Feito | `validar-prescricao`, browser |
| 2.10 | Título de evento | Pesquisável, sem campo | Feito | Browser |
| 2.10 | IVA | Não existe; há `taxPercent` | Falta (5.12) | |
| 2.10 | `CAMPOS_BASE`, `prescricao.ativo` | Legado | Mantidos | |
| 5.1 | Autocadastro, pipeline, CSV, lixeira | Só cadastro manual e eliminação definitiva | Falta | |
| 5.2 | Vários media, limites configuráveis | Um vídeo até 10 s por exercício | Parcial | |
| 5.3 | Clonar programa | Duplicava exercício e treino | Parcial: falta destino em grupo | `validar-prescricao`, browser |
| 5.3 | Presets, ciclos, treino extra, versões, executor | Não existem | Falta | |
| 5.4 | Feedback, frequência, cargas, recordes | Registo da sessão existe | Parcial | |
| 5.5 | Protocolos novos, online, recorrência | 5 protocolos de dobras e bioimpedância | Parcial | |
| 5.5 | Postural | Não existe | Falta | |
| 5.5 | Neuromotora, funcional, força | Base de protocolos a confirmar | Parcial | |
| 5.5.7 | FMS | | Fora | |
| 5.6 | Horários, livres, exceções | Existem | Parcial | |
| 5.6 | Copiar, colar, arrastar | Removidos em setembro | Falta; arrastar exige aparelho real | |
| 5.6 | Agenda do aluno, lembretes, espera, turmas | Não existem | Falta | |
| 5.7 | Push, modelos, feed | Não existem | Falta, com partes Externo | |
| 5.8 | Central de retenção | Não existe | Falta | |
| 5.9 | Progresso do aluno | Não existe | Falta | |
| 5.10 | Documentos e ficheiros | Só PDF gerado | Falta | |
| 5.11 | Área do aluno completa | Treinos, histórico, registo | Parcial | |
| 5.12 | Planos, faturas, carteira, KYC | Não existem | Falta e Externo; só modo de teste | |
| 5.13 | Página pública de vendas | Não existe | Falta | |
| 5.14 a 5.16 | Desafios, pontos, conteúdos | Não existem | Falta | |
| 5.17 | Relatórios | Período e progresso | Parcial | |
| 5.18 | pt, en, es | Só pt-PT | Falta | |
| 6.x | Diferenciais | Não existem | Falta | |
| 8.x | Segurança dos módulos novos | RLS e dois fatores nos atuais | Por módulo | |

## Decisões

- **Sessões separadas:** cada cliente Supabase só lê do endereço a sessão que é
  sua (`eRegressoDoAluno`). Antes, um convite gravava a sessão do aluno também na
  chave do treinador.
- **Data de início:** um aluno novo começa com a data de hoje; os antigos ficam
  vazios, para não se inventar história.
- **Cópia de programa:** o período recomeça hoje, nasce ativa e mantém a `origem`.
- **Título:** só em eventos; numa aula, o nome é o do aluno.

## Próximo lote

Fase 1 do documento: destino em grupo fica para quando existirem grupos (5.1);
seguem-se presets de treino e o feedback pós-treino.

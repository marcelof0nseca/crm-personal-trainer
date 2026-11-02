// A página pública de vendas. Conta um dia de trabalho, hora a hora, e o que se vê dentro
// do telemóvel são gravações da aplicação real, com alunos fictícios (public/landing/).
// Um texto só promete o que a aplicação já faz hoje: ver CLAUDE.md, secção 10.
import { useEffect, useRef, useState } from 'react';
import { Mail, Play, Plus } from 'lucide-react';
import LegalModal from './LegalDocs';

const CADENCIA_POR_PLANO = { mensal: '/mês', trimestral: ' a cada 3 meses', anual: ' a cada 12 meses' };

/* ============================== O DIA ============================== */

const MOMENTOS = [
  {
    hora: '07:00',
    titulo: 'Antes do primeiro aluno',
    texto: 'Abre o telemóvel e já sabe como vai o mês e o que precisa da sua decisão.',
    areas: [
      { clip: 'painel', nome: 'Painel', texto: 'Receita bruta e líquida, impostos, taxa do ginásio, horas pagas, comparência e faltas. Navega para qualquer mês.' },
      { clip: 'novidades', nome: 'Novidades', texto: 'Aniversários, faturas em atraso e o que os alunos pediram. Nada entra nos seus dados sem o aceitar.' },
      { clip: 'tarefas', nome: 'Tarefas e regras', texto: 'O que fazer hoje, o que ficou atrasado e o que vem aí. Regras simples criam tarefas por si.' },
      { clip: 'relatorio', nome: 'Relatório do período', texto: 'Atividade, ocupação da agenda e receita, pronto a imprimir com o seu timbre.' },
    ],
  },
  {
    hora: '08:00',
    titulo: 'A semana, sob controlo',
    texto: 'Marcar, confirmar, trocar. Vários alunos à mesma hora, se for o seu caso.',
    areas: [
      { clip: 'agenda', nome: 'Agenda', texto: 'Dia, semana, mês e lista. Aula dada, falta ou falta com reposição, num toque. Avisa se houver choque, mas nunca o impede.' },
      { clip: 'agenda-avancada', nome: 'Horários, turmas e locais', texto: 'Férias e feriados sem mexer no horário normal, turmas com lista de espera, salas, regras de reserva e calendário para o telemóvel.' },
      { clip: 'faltas', nome: 'Faltas e reposições', texto: 'Cada falta guarda o motivo, o crédito, a validade e quem o concedeu. Nada fica esquecido numa conversa.' },
    ],
  },
  {
    hora: '09:30',
    titulo: 'Na sala de treino',
    texto: 'O programa aberto na mão, um exercício de cada vez, e o que o aluno fez fica escrito.',
    areas: [
      { clip: 'treino', nome: 'Vista de treino', texto: 'Completa ou passo a passo. Escreve a carga ali mesmo, com a percentagem do modelo à vista, e o volume faz-se sozinho.' },
      { clip: 'registar', nome: 'Registar a sessão', texto: 'Última vez ao lado, cronómetro de descanso e um toque por série. Se o telemóvel bloquear, o rascunho não se perde.' },
      { clip: 'construtor', nome: 'Construir o treino', texto: '2 076 exercícios, 38 métodos e 15 combinações. Bi-set, drop-set, cluster, EMOM: os campos mudam com o método.' },
      { clip: 'modelos', nome: '1 060 modelos prontos', texto: 'Por objetivo, nível, frequência e equipamento. Um toque cria o programa do aluno, e depois é seu para alterar.' },
    ],
  },
  {
    hora: '11:00',
    titulo: 'Avaliar sem papel',
    texto: 'Medidas, testes, questionários e assinaturas, ligados ao aluno e fáceis de comparar.',
    areas: [
      { clip: 'avaliacao', nome: 'Avaliação física', texto: 'Dobras cutâneas, bioimpedância, perímetros, metas e fotografias, com o gráfico de evolução. Rascunho, final e revisões com motivo.' },
      { clip: 'centro-avaliacoes', nome: 'Postural, funcional e neuromotora', texto: 'Grelha e ângulos sobre a fotografia, baterias e modelos seus, recorrência e envio ao aluno. Assinala, nunca diagnostica.' },
      { clip: 'formularios', nome: 'PAR-Q, anamnese e consentimentos', texto: 'Preenche com o aluno ao lado, com assinatura no ecrã. Também pode criar os seus formulários.' },
      { clip: 'pdf', nome: 'PDF com o seu timbre', texto: 'Logótipo, número profissional e contactos. Escolhe as secções e vê o documento antes de imprimir.' },
    ],
  },
  {
    hora: '14:00',
    titulo: 'Cada aluno, inteiro',
    texto: 'Em vez de procurar em conversas antigas, abre a ficha.',
    areas: [
      { clip: 'alunos', nome: 'Alunos e Ficha 360º', texto: 'Plano, preço e contactos. Aulas, faltas, avaliações, treinos e formulários numa linha só, com procura.' },
      { clip: 'metas', nome: 'Metas', texto: 'Ponto de partida, alvo, prazo e marcos. O aluno vê as que quiser partilhar.' },
      { clip: 'documentos', nome: 'Documentos', texto: 'Ficheiros guardados em privado, formulários enviados, resultados partilhados e os dados do aluno, se ele os pedir.' },
    ],
  },
  {
    hora: '16:00',
    titulo: 'Do lado do aluno',
    texto: 'O aluno tem a área dele, com conta ou por um link. Vê o treino e regista o que fez, sem lhe pedir nada.',
    areas: [
      { clip: 'aluno-inicio', nome: 'O treino dele', texto: 'Próximo treino, um toque para começar, última carga à vista e vídeo do exercício. O registo chega à sua ficha.' },
      { clip: 'aluno-areas', nome: 'Agenda, progresso e mais', texto: 'Próximas aulas, pedidos, metas, evolução, avisos, formulários, faturas e documentos. Em português, inglês ou espanhol.' },
    ],
  },
  {
    hora: '18:00',
    titulo: 'Quem está a desaparecer',
    texto: 'Antes de perder um aluno, costuma haver sinais. Aqui ficam à vista, com o motivo escrito.',
    areas: [
      { clip: 'retencao', nome: 'Retenção', texto: 'Engajado, oscilando, em risco, abandono e recuperado, por regras suas. Mostra porque está ali e abre o WhatsApp com a mensagem.' },
      { clip: 'mensagens', nome: 'Mensagens', texto: 'Modelos com o nome do aluno já preenchido, e avisos que aparecem na área dele. Quem envia é sempre o treinador.' },
      { clip: 'contactos', nome: 'Contactos', texto: 'Quem ainda não é aluno, etapa a etapa. Converter não duplica ninguém, e há importação por CSV, grupos, etiquetas e lixeira.' },
    ],
  },
  {
    hora: '20:00',
    titulo: 'Trazer alunos novos',
    texto: 'A sua página, as suas ligações e um motivo para os atuais continuarem.',
    areas: [
      { clip: 'vendas', nome: 'Página de vendas e imagens', texto: 'Monta a página sem saber programar, com depoimentos autorizados, ligações de inscrição e de indicação, e imagens para as redes.' },
      { clip: 'pagina-publica', nome: 'O que o cliente vê', texto: 'Quem preenche entra nos seus contactos, com o consentimento guardado. Nunca vira aluno sem a sua decisão.' },
      { clip: 'fidelizacao', nome: 'Desafios, pontos e satisfação', texto: 'Desafios por link, pontos por treino e recompensas definidas por si. NPS com nota baixa a pedir contacto.' },
    ],
  },
  {
    hora: '21:30',
    titulo: 'As contas do dia',
    texto: 'O que recebeu, o que falta receber e quanto sobra mesmo.',
    areas: [
      { clip: 'planos', nome: 'Planos e faturas dos alunos', texto: 'Planos, faturas geradas ao abrir, IVA, pagamentos registados, atrasos, contratos com versão e aceite, e relatório por plano.' },
      { clip: 'financas', nome: 'Finanças', texto: 'As suas entradas e saídas, por categoria, com o saldo do mês e as pendências destacadas.' },
    ],
  },
];

const ECRAS_MURO = ['agenda', 'treino', 'registar', 'avaliacao', 'retencao', 'aluno-areas', 'formularios', 'modelos', 'financas', 'pagina-publica', 'contactos', 'planos'];

/* ============================== A LISTA COMPLETA ============================== */

const LISTA = [
  { nome: 'Agenda', itens: ['Dia, semana, mês e lista, com procura e filtros', 'Aula dada, falta e falta com reposição num toque', 'Vários alunos no mesmo horário, cada um com o seu estado', 'Horários livres em lote, com pré-visualização', 'Selecionar várias: mover, copiar, mudar duração, bloquear ou apagar', 'Séries semanais: só esta ou toda a série', 'Arrastar entre dias no computador, com confirmação', 'Exceções por data, férias e feriados', 'Turmas, lista de espera, locais e tempo de preparação', 'Aviso de conflito que nunca bloqueia', 'Regras de reserva e pedidos do aluno', 'Exportação .ics e calendário por ligação privada'] },
  { nome: 'Faltas e reposições', itens: ['Motivo, justificação e direito a reposição', 'Crédito ligado à aula de origem', 'Validade e estado «Expirada»', 'Histórico de quem concedeu e quando', 'Filtros por aluno, período e estado'] },
  { nome: 'Alunos', itens: ['Alunos sem limite', 'Plano, preço, imposto e taxa do ginásio por aluno', 'Data de início e de nascimento', 'Ficha 360º com procura e filtros', 'Etiquetas e grupos', 'Lixeira recuperável e eliminação definitiva', 'Importação por CSV com pré-visualização', 'Exportação dos dados de um aluno'] },
  { nome: 'Treinos', itens: ['Treinos A/B/C, blocos e arquivo', 'Séries individuais, cada uma com os seus campos', '38 métodos, com a explicação de cada um', '15 combinações com etiquetas A1/A2 e cor', 'Sub-etapas geradas: drop-set, cluster, pirâmide, myo-reps, ladder', 'Vista completa ou passo a passo', 'RIR alvo em valor ou faixa', 'Presets prontos e seus', 'Rascunho, programado, publicado e versões', 'Ciclos, semanas e deload', 'Treino extra, à parte do programa', 'Duplicar programas entre alunos', 'PDF timbrado'] },
  { nome: 'Biblioteca', itens: ['2 076 exercícios em português', 'Procura em pt-PT, pt-BR e inglês de ginásio', 'Sinónimos, favoritos e pastas', 'Progressões, regressões e substituições', 'Exercícios seus, sem limite', 'Um vídeo por exercício: ficheiro ou link do YouTube'] },
  { nome: 'Modelos de treino', itens: ['1 060 fichas prontas a usar', 'Filtros por objetivo, nível, frequência, método e equipamento', 'Aquecimento, parte principal e volta à calma', 'Critérios de entrada, progressão e regressão', 'Avisos de validação clínica e supervisão', 'Guardar nos seus modelos'] },
  { nome: 'Treino realizado', itens: ['Registo pelo treinador ou pelo aluno', 'Carga, repetições, tempo, RIR e RPE reais', 'Última vez à vista', 'Cronómetro de descanso e de EMOM, AMRAP, Tabata', 'Rascunho no aparelho', 'Duração, esforço, sintomas referidos e notas', 'Central de feedbacks', 'Frequência, cargas, recordes e 1RM com a fórmula à vista', 'Corrigir ou apagar uma sessão'] },
  { nome: 'Avaliações', itens: ['Dobras cutâneas: 6 protocolos', 'Bioimpedância com 12 campos', '14 perímetros e cintura-anca', 'Conversão de Siri e de Brozek', 'Fotografias de progresso em armazenamento privado', 'Rascunho, final e revisões com motivo', 'Comparar avaliações e repor versões', 'Avaliação postural com grelha, fio de prumo e ângulos', 'Baterias funcional, neuromotora e de força', 'Condicionamento e mobilidade', 'Modelos seus e recorrência', 'Medidas preenchidas pelo aluno, para rever', 'Faixas de referência que assinalam, sem diagnosticar'] },
  { nome: 'Formulários', itens: ['PAR-Q, anamnese e consentimentos', 'Construtor de formulários', 'Assinatura desenhada no ecrã', 'Envio para o aluno preencher', 'Pontos a ter em conta, ditos como avisos', 'PDF timbrado'] },
  { nome: 'Documentos', itens: ['Timbre com logótipo, estúdio e nº profissional', 'Aviso de confidencialidade em todas as folhas', 'Escolher secções e pré-visualizar', 'Ficheiros PDF e imagem por aluno', 'Partilhar resultados com o aluno, sem fotografias'] },
  { nome: 'Área do aluno', itens: ['Entrada por conta ou por link, à sua escolha', 'Próximo treino e registo da sessão', 'Vídeo do exercício no treino', 'Agenda, pedidos e reposições', 'Check-in «Como está hoje?»', 'Metas, evolução, recordes e pontos', 'Fotografias de progresso com autorização', 'Avisos, formulários, contratos, faturas e documentos', 'Português, inglês e espanhol', 'Instalável no ecrã do telemóvel'] },
  { nome: 'Retenção e tarefas', itens: ['Cinco estados, por regras que pode alterar', 'O motivo escrito, aluno a aluno', 'Números com o denominador à vista', 'Retrato semanal e tendência', 'WhatsApp com a mensagem pronta', 'Tarefas de hoje, atrasadas e próximas', 'Regras quando/então'] },
  { nome: 'Contactos e mensagens', itens: ['Etapas, do contacto novo ao convertido', 'Próximo contacto, notas e motivo de perda', 'Converter sem duplicar', 'Modelos com variáveis e pré-visualização', 'Avisos na área do aluno, únicos ou repetidos', 'Novidades com tudo o que chegou'] },
  { nome: 'Planos e faturas dos alunos', itens: ['Mensal, trimestral, anual, livre e pacote', 'Faturas com IVA, desconto e estados', 'Registo de pagamentos e devoluções', 'Atrasos, tolerância e exceções', 'Contratos com versão e aceite do aluno', 'Comprovativos internos e exportação CSV', 'Receita recorrente dos alunos, à parte'] },
  { nome: 'Vendas e fidelização', itens: ['Página de vendas sua, publicada por ligação', 'Depoimentos só com autorização', 'Ligações de inscrição e de indicação', 'Imagens para publicações e histórias', 'Desafios por link, com etapas', 'Pontos, conquistas, recompensas e resgates', 'NPS e alerta de nota baixa'] },
  { nome: 'Finanças e relatórios', itens: ['Painel: bruto, líquido, impostos e taxa do ginásio', 'Horas pagas, calculadas pelo plano', 'Entradas e saídas por categoria', 'Pendências destacadas', 'Relatório do período', 'Relatório de progresso do aluno'] },
  { nome: 'Segurança e dados', itens: ['Dados alojados na União Europeia', 'Dois fatores e fechar sessão em todo o lado', 'Dados isolados por conta', 'Fotografias e documentos privados', 'Aviso se outro aparelho gravar primeiro', 'Cópia de segurança e restauro completos', 'Apagar um aluno ou todos os dados', 'Registo de alterações', 'Tema claro, escuro e automático'] },
];

const FAQ_ITEMS = [
  { q: 'Os vídeos desta página são reais?', a: 'São. Foram gravados na própria aplicação, em tamanho de telemóvel, e nada foi desenhado à parte. Só os alunos e os números são fictícios.' },
  { q: 'Preciso de instalar alguma coisa?', a: 'Não. Funciona no navegador do telemóvel, do tablet ou do computador. Se preferir, pode adicioná-la ao ecrã inicial do telemóvel.' },
  { q: 'Os meus alunos têm acesso?', a: 'Se quiser, sim. Cada aluno pode ter uma conta própria ou um link pessoal, e vê apenas o que é dele. Se preferir, não ativa nada e os alunos continuam a receber o PDF.' },
  { q: 'Como funcionam os 7 dias grátis?', a: 'Regista o cartão ao criar a conta, mas nada é cobrado nesse momento, em qualquer dos três planos. Ao 8º dia, se não tiver cancelado, a Stripe cobra o plano escolhido. Vale só na primeira vez.' },
  { q: 'Como funcionam os meses grátis?', a: 'No trimestral paga 3 meses e fica com 4. No anual paga 12 e fica com 14. Somam-se aos 7 dias grátis e entram logo na primeira cobrança.' },
  { q: 'Posso cancelar quando quiser?', a: 'Sim, a qualquer momento, no portal da Stripe. Cancelar durante os 7 dias grátis não gera nenhuma cobrança.' },
  { q: 'O PTMANAGER emite faturas legais?', a: 'Não. As faturas dos alunos servem para organizar o que cada um paga, e o comprovativo é interno. A faturação legal em Portugal exige software certificado pela AT, que continua a usar à parte.' },
  { q: 'Onde ficam os dados dos meus alunos?', a: 'Na União Europeia, separados por conta. As fotografias ficam em armazenamento privado, e pode exportar ou apagar os dados sempre que precisar.' },
  { q: 'Como ativo o plano depois de pagar?', a: 'É automático. Assim que a Stripe confirma, o plano fica ativo em poucos segundos. Se demorar, o botão «Verificar subscrição» confirma de imediato.' },
];

/* ============================== MOVIMENTO ============================== */

const CURVA = 'cubic-bezier(0.23, 1, 0.32, 1)';

function semMovimento() {
  if (typeof window === 'undefined') return true;
  const reduzido = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ligacao = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const poupar = ligacao && (ligacao.saveData || /^(slow-2g|2g)$/.test(ligacao.effectiveType || ''));
  return Boolean(reduzido || poupar);
}

function useNaVista(limiar = 0.3, umaVez = false) {
  const ref = useRef(null);
  const [visivel, setVisivel] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setVisivel(true); return undefined; }
    const obs = new IntersectionObserver(([e]) => {
      setVisivel(e.isIntersecting);
      if (e.isIntersecting && umaVez) obs.disconnect();
    }, { threshold: limiar });
    obs.observe(el);
    return () => obs.disconnect();
  }, [limiar, umaVez]);
  return [ref, visivel];
}

function Revelar({ children, className = '', atraso = 0, style, as: Tag = 'div' }) {
  const [ref, visivel] = useNaVista(0.12, true);
  return (
    <Tag ref={ref} className={`lp-revelar ${visivel ? 'lp-visivel' : ''} ${className}`} style={{ ...style, transitionDelay: visivel ? `${atraso}ms` : '0ms' }}>
      {children}
    </Tag>
  );
}

/* ============================== O TELEMÓVEL ============================== */

// O vídeo só carrega quando aparece. Sem autorização para tocar sozinho (movimento
// reduzido, modo de poupança do iPhone), fica o último fotograma e um botão.
function TelemovelReal({ clip, tocar, rotulo, onFim, onTempo, tamanho }) {
  const video = useRef(null);
  const [parado, setParado] = useState(semMovimento);
  const [aTrocar, setATrocar] = useState(false);
  const [comecou, setComecou] = useState(false);

  useEffect(() => {
    const v = video.current;
    if (!v) return undefined;
    if (!tocar || parado) { v.pause(); return undefined; }
    const destino = `/landing/${clip}.mp4`;
    if (!v.src.endsWith(destino)) {
      setATrocar(true);
      v.src = destino;
      v.load();
    }
    const p = v.play();
    if (p && p.catch) p.then(() => setComecou(true)).catch((e) => { if (e && e.name === 'NotAllowedError') setParado(true); });
    return undefined;
  }, [clip, tocar, parado]);

  return (
    <div className="lp-telemovel" style={tamanho ? { width: tamanho } : undefined}>
      <span className="lp-botao lp-botao-a" />
      <span className="lp-botao lp-botao-b" />
      <span className="lp-botao lp-botao-c" />
      <div className="lp-ecra">
        <video
          ref={video}
          muted
          playsInline
          preload="none"
          poster={(!comecou || parado) ? `/landing/${clip}.jpg` : undefined}
          aria-label={`Gravação da aplicação: ${rotulo}`}
          className={aTrocar ? 'lp-a-trocar' : ''}
          onPlaying={() => setATrocar(false)}
          onCanPlay={() => setATrocar(false)}
          onEnded={onFim}
          onTimeUpdate={(e) => { if (onTempo && e.currentTarget.duration) onTempo(e.currentTarget.currentTime / e.currentTarget.duration); }}
        />
        {parado && (
          <button type="button" className="lp-tocar" onClick={() => setParado(false)} aria-label={`Ver a gravação: ${rotulo}`}>
            <Play size={20} style={{ display: 'block' }} />
          </button>
        )}
      </div>
    </div>
  );
}

function useEcraLargo() {
  const [largo, setLargo] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 900px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 900px)');
    const mudar = (e) => setLargo(e.matches);
    mq.addEventListener('change', mudar);
    return () => mq.removeEventListener('change', mudar);
  }, []);
  return largo;
}

function Momento({ m }) {
  const largo = useEcraLargo();
  const [ativa, setAtiva] = useState(0);
  const [ref, visivel] = useNaVista(0.35);
  const barra = useRef(null);
  const area = m.areas[ativa];

  function escolher(i) {
    if (barra.current) barra.current.style.transform = 'scaleX(0)';
    setAtiva(i);
  }
  const telemovel = (
    <TelemovelReal clip={area.clip} tocar={visivel} rotulo={area.nome} onFim={() => escolher((ativa + 1) % m.areas.length)} onTempo={(f) => { if (barra.current) barra.current.style.transform = `scaleX(${f})`; }} />
  );

  return (
    <section ref={ref} id={`hora-${m.hora.replace(':', '')}`} className="lp-momento">
      <div className="lp-coluna-texto">
        <Revelar className="lp-cabeca">
          <span className="lp-hora font-mono">{m.hora}</span>
          <h3 className="font-hero lp-h3">{m.titulo}</h3>
          <p className="lp-corrido">{m.texto}</p>
        </Revelar>
        {!largo && <div className="lp-telemovel-movel">{telemovel}</div>}
        <ul className="lp-areas">
          {m.areas.map((a, i) => (
            <li key={a.clip}>
              <button type="button" onClick={() => escolher(i)} aria-pressed={i === ativa} className={`lp-area ${i === ativa ? 'lp-area-ativa' : ''}`}>
                <span className="lp-area-nome">{a.nome}</span>
                <span className="lp-area-corpo"><span>{a.texto}</span></span>
                {i === ativa && <span className="lp-area-barra" ref={barra} />}
              </button>
            </li>
          ))}
        </ul>
      </div>
      {largo && <div className="lp-telemovel-largo">{telemovel}</div>}
    </section>
  );
}

function Muro() {
  const linha = [...ECRAS_MURO, ...ECRAS_MURO];
  return (
    <div className="lp-muro" aria-hidden="true">
      <div className="lp-muro-fita">
        {linha.map((c, i) => <img key={`${c}${i}`} src={`/landing/${c}.jpg`} alt="" loading="lazy" width="150" height="325" />)}
      </div>
    </div>
  );
}

function Pergunta({ item, aberta, onToggle }) {
  return (
    <div className="lp-pergunta">
      <button type="button" onClick={onToggle} aria-expanded={aberta} className="lp-pergunta-botao">
        <span>{item.q}</span>
        <Plus size={16} style={{ flexShrink: 0, transition: `transform 220ms ${CURVA}`, transform: aberta ? 'rotate(45deg)' : 'none', color: 'var(--text-faint)' }} />
      </button>
      <div className={`lp-colapso ${aberta ? 'lp-aberto' : ''}`}><div><p className="lp-corrido" style={{ paddingBottom: 18 }}>{item.a}</p></div></div>
    </div>
  );
}

export default function LandingPage({ logoSrc, plans, supportEmail, onGetStarted, onLogin }) {
  const mailto = (subject) => (supportEmail ? `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}` : '');
  const [legalDoc, setLegalDoc] = useState(null);
  const [aberta, setAberta] = useState(0);
  const [heroIndice, setHeroIndice] = useState(0);
  const [heroRef, heroVisivel] = useNaVista(0.2);
  const plansRef = useRef(null);
  const featuresRef = useRef(null);
  const trialPlan = plans.find((p) => p.trialDays);
  const HERO = ['agenda', 'treino', 'registar', 'retencao'];
  const irPara = (ref) => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const cta = trialPlan ? `Experimentar ${trialPlan.trialDays} dias grátis` : 'Começar agora';

  return (
    <div className="min-h-screen bg-base flex flex-col lp">
      <style>{`
        html { scroll-behavior: smooth; }
        .lp { --lp-curva: ${CURVA}; overflow-x: clip; }

        .lp-revelar { opacity: 0; transform: translateY(18px); transition: opacity 600ms var(--lp-curva), transform 600ms var(--lp-curva); }
        .lp-visivel { opacity: 1; transform: none; }

        .lp-progresso { position: absolute; left: 0; right: 0; bottom: -1px; height: 2px; background: var(--brass); transform-origin: left; transform: scaleX(0); }
        @supports (animation-timeline: scroll()) {
          .lp-progresso { animation: lp-encher linear both; animation-timeline: scroll(root); }
          @keyframes lp-encher { to { transform: scaleX(1); } }
        }

        .lp-cta { display: inline-flex; align-items: center; justify-content: center; min-height: 48px; padding: 0 22px; border-radius: var(--r-md); font-weight: 600; font-size: 15px; background: var(--brass); color: var(--bg-base); transition: transform 160ms var(--lp-curva), filter 160ms ease; }
        .lp-cta:active { transform: scale(0.97); }
        @media (hover: hover) and (pointer: fine) { .lp-cta:hover { filter: brightness(1.08); } }
        .lp-link { font-size: 14px; color: var(--text-muted); text-decoration: underline; text-underline-offset: 4px; text-decoration-color: var(--border-strong); }
        .lp-link:hover { color: var(--text-primary); }

        /* Topo */
        .lp-topo { max-width: 1160px; margin: 0 auto; padding: 40px 20px 56px; display: grid; gap: 40px; }
        .lp-h1 { font-size: clamp(2.5rem, 9.4vw, 4.6rem); line-height: 1; letter-spacing: -0.024em; font-weight: 650; color: var(--text-primary); margin: 0; text-wrap: balance; }
        .lp-h1 span { display: block; overflow: hidden; padding-bottom: 0.08em; margin-bottom: -0.08em; }
        .lp-h1 i { display: block; font-style: normal; animation: lp-subir 900ms var(--lp-curva) both; }
        .lp-h1 span:nth-child(2) i { animation-delay: 70ms; }
        .lp-h1 span:nth-child(3) i { animation-delay: 140ms; }
        @keyframes lp-subir { from { transform: translateY(105%); } to { transform: none; } }
        .lp-entrar { animation: lp-aparecer 800ms 220ms var(--lp-curva) both; }
        .lp-entrar-tel { animation: lp-tel 1000ms 120ms var(--lp-curva) both; }
        @keyframes lp-aparecer { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
        @keyframes lp-tel { from { opacity: 0; transform: translateY(44px) rotate(1.5deg); } to { opacity: 1; transform: none; } }
        .lp-legenda { font-size: 12px; color: var(--text-faint); }
        .lp-numeros { display: flex; flex-wrap: wrap; gap: 8px 24px; border-top: 1px solid var(--border-hair); padding-top: 18px; font-size: 13px; color: var(--text-muted); }
        .lp-numeros b { color: var(--text-primary); font-weight: 600; }

        /* O telemóvel */
        .lp-telemovel { position: relative; width: clamp(214px, 60vw, 300px); margin: 0 auto; padding: 8px; border-radius: 42px; background: #0b0d10; box-shadow: 0 0 0 1px rgba(255,255,255,0.09) inset, 0 34px 70px -28px rgba(5,10,14,0.65); }
        .lp-botao { position: absolute; background: #1b1f25; border-radius: 2px; }
        .lp-botao-a { left: -2px; top: 19%; width: 2px; height: 7%; }
        .lp-botao-b { left: -2px; top: 28%; width: 2px; height: 7%; }
        .lp-botao-c { right: -2px; top: 23%; width: 2px; height: 11%; }
        .lp-ecra { position: relative; aspect-ratio: 390 / 844; border-radius: 34px; overflow: hidden; background: #0a0b0d; }
        .lp-ecra video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: opacity 260ms ease, filter 260ms ease; }
        .lp-a-trocar { opacity: 0.25; filter: blur(4px); }
        .lp-tocar { position: absolute; inset: auto 0 18px; margin: 0 auto; width: 52px; height: 52px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: var(--brass); color: #0a0b0d; }

        /* O dia */
        .lp-secao { max-width: 1160px; margin: 0 auto; padding: 0 20px; }
        .lp-h2 { font-size: clamp(1.9rem, 6vw, 3.1rem); line-height: 1.05; letter-spacing: -0.02em; font-weight: 640; color: var(--text-primary); margin: 0; text-wrap: balance; }
        .lp-h3 { font-size: clamp(1.6rem, 5vw, 2.35rem); line-height: 1.08; letter-spacing: -0.016em; font-weight: 620; color: var(--text-primary); margin: 0; text-wrap: balance; }
        .lp-corrido { font-size: 15px; line-height: 1.55; color: var(--text-muted); margin: 0; max-width: 58ch; }
        .lp-horas { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; margin: 24px -20px 0; padding: 0 20px 4px; }
        .lp-horas::-webkit-scrollbar { display: none; }
        .lp-horas a { flex: none; padding: 7px 11px; border: 1px solid var(--border-hair); border-radius: var(--r-pill); font-size: 13px; color: var(--text-muted); transition: color 160ms ease, border-color 160ms ease; }
        .lp-horas a:hover { color: var(--brass); border-color: var(--brass); }
        .lp-momento { padding: 52px 0; border-top: 1px solid var(--border-hair); scroll-margin-top: 60px; display: grid; gap: 36px; }
        .lp-cabeca { display: flex; flex-direction: column; gap: 10px; }
        .lp-hora { font-size: 15px; color: var(--brass); }
        .lp-coluna-texto { display: flex; flex-direction: column; gap: 26px; min-width: 0; }
        .lp-areas { list-style: none; padding: 0; margin: 0; border-top: 1px solid var(--border-hair); }
        .lp-area { position: relative; display: block; width: 100%; text-align: left; padding: 15px 0; border-bottom: 1px solid var(--border-hair); }
        .lp-area-nome { display: block; font-size: 16px; font-weight: 600; color: var(--text-faint); transition: color 200ms ease; }
        .lp-area:hover .lp-area-nome { color: var(--text-primary); }
        .lp-area-ativa .lp-area-nome { color: var(--text-primary); }
        .lp-area-corpo { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 320ms var(--lp-curva); }
        .lp-area-corpo > span { overflow: hidden; min-height: 0; font-size: 14px; line-height: 1.5; color: var(--text-muted); max-width: 54ch; }
        .lp-area-ativa .lp-area-corpo { grid-template-rows: 1fr; margin-top: 5px; }
        .lp-area-barra { position: absolute; left: 0; right: 0; bottom: -1px; height: 2px; background: var(--brass); transform: scaleX(0); transform-origin: left; transition: transform 260ms linear; }

        /* Muro de ecrãs */
        .lp-muro { overflow: hidden; padding: 12px 0 8px; -webkit-mask-image: linear-gradient(90deg, transparent, #000 7%, #000 93%, transparent); mask-image: linear-gradient(90deg, transparent, #000 7%, #000 93%, transparent); }
        .lp-muro-fita { display: flex; gap: 14px; width: max-content; animation: lp-fita 70s linear infinite; }
        .lp-muro:hover .lp-muro-fita { animation-play-state: paused; }
        .lp-muro img { width: 150px; height: auto; aspect-ratio: 390 / 844; border-radius: 20px; object-fit: cover; background: #0a0b0d; }
        @keyframes lp-fita { to { transform: translateX(-50%); } }

        /* A lista */
        .lp-lista { columns: 1; column-gap: 40px; margin-top: 36px; }
        .lp-grupo { break-inside: avoid; padding: 18px 0 22px; border-top: 1px solid var(--border-strong); }
        .lp-grupo h3 { font-size: 14px; font-weight: 700; color: var(--text-primary); margin: 0 0 10px; }
        .lp-grupo ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; }
        .lp-grupo li { font-size: 13.5px; line-height: 1.42; color: var(--text-muted); }

        /* Planos */
        .lp-plano { display: grid; gap: 14px; padding: 24px 0; border-top: 1px solid var(--border-hair); }
        .lp-plano-nome { font-size: 18px; font-weight: 650; color: var(--text-primary); }
        .lp-selo { display: block; font-size: 12px; color: var(--brass); font-weight: 600; margin-top: 2px; }
        .lp-preco { font-size: clamp(1.7rem, 5vw, 2.2rem); font-weight: 600; color: var(--text-primary); letter-spacing: -0.02em; }
        .lp-riscado { font-size: 14px; color: var(--text-faint); text-decoration: line-through; margin-right: 8px; }
        .lp-nota { font-size: 13px; color: var(--text-muted); line-height: 1.45; }

        /* Perguntas */
        .lp-pergunta { border-top: 1px solid var(--border-hair); }
        .lp-pergunta-botao { width: 100%; display: flex; justify-content: space-between; gap: 16px; align-items: center; text-align: left; padding: 16px 0; font-size: 16px; font-weight: 600; color: var(--text-primary); min-height: var(--tap); }
        .lp-colapso { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 280ms var(--lp-curva); }
        .lp-aberto { grid-template-rows: 1fr; }
        .lp-colapso > div { overflow: hidden; }

        @media (min-width: 900px) {
          .lp-topo { grid-template-columns: minmax(0, 1fr) 320px; align-items: center; padding: 64px 20px 72px; gap: 56px; }
          .lp-momento { grid-template-columns: minmax(0, 1fr) 320px; gap: 72px; padding: 84px 0; align-items: start; }
          .lp-telemovel-largo { position: sticky; top: 84px; }
          .lp-coluna-texto { min-height: 660px; }
          .lp-lista { columns: 3; }
          .lp-plano { grid-template-columns: 180px 240px minmax(0, 1fr) auto; align-items: center; gap: 28px; }
          .lp-muro img { width: 180px; }
        }
        @media (min-width: 620px) and (max-width: 899px) { .lp-lista { columns: 2; } }

        @supports (animation-timeline: view()) {
          @media (prefers-reduced-motion: no-preference) {
            .lp-telemovel-largo .lp-telemovel, .lp-telemovel-movel .lp-telemovel { animation: lp-chegar linear both; animation-timeline: view(); animation-range: entry 0% entry 55%; }
            @keyframes lp-chegar { from { opacity: 0.35; transform: translateY(44px) scale(0.965); } to { opacity: 1; transform: none; } }
          }
        }
        @media (prefers-reduced-motion: reduce) {
          html { scroll-behavior: auto; }
          .lp-revelar { transform: none; transition: opacity 200ms ease; }
          .lp-h1 i, .lp-entrar, .lp-entrar-tel { animation: none; }
          .lp-muro { overflow-x: auto; }
          .lp-muro-fita { animation: none; }
          .lp-area-barra { display: none; }
        }
      `}</style>

      <header className="vidro" style={{ position: 'sticky', top: 0, zIndex: 30, borderBottom: '1px solid var(--border-hair)' }}>
        <div className="flex items-center justify-between gap-4" style={{ maxWidth: 1160, margin: '0 auto', padding: '11px 20px' }}>
          <div className="flex items-center gap-2 min-w-0">
            <img src={logoSrc} alt="" style={{ width: 28, height: 28, flexShrink: 0 }} />
            <span className="font-display font-semibold text-primary truncate" style={{ fontSize: 17 }}>PT<span style={{ color: 'var(--brass)' }}>MANAGER</span></span>
          </div>
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => irPara(featuresRef)} className="hidden sm:inline lp-link" style={{ textDecoration: 'none' }}>Tudo o que faz</button>
            <button type="button" onClick={() => irPara(plansRef)} className="hidden sm:inline lp-link" style={{ textDecoration: 'none' }}>Preços</button>
            <button type="button" onClick={onLogin} className="btn btn-ghost" style={{ fontSize: 13 }}>Entrar</button>
          </div>
        </div>
        <span className="lp-progresso" aria-hidden="true" />
      </header>

      <main className="flex-1">
        <section ref={heroRef} className="lp-topo">
          <div className="flex flex-col gap-6" style={{ minWidth: 0 }}>
            <h1 className="font-hero lp-h1">
              <span><i>O dia inteiro</i></span>
              <span><i>de um personal,</i></span>
              <span><i style={{ color: 'var(--brass)' }}>no telemóvel.</i></span>
            </h1>
            <p className="lp-entrar lp-corrido" style={{ fontSize: 17 }}>
              Alunos, agenda, treinos, avaliações, faturas e uma área própria para cada aluno. Esse telemóvel não é uma ilustração: é a aplicação a funcionar.
            </p>
            <div className="lp-entrar flex flex-wrap items-center gap-x-5 gap-y-3">
              <button type="button" onClick={onGetStarted} className="lp-cta">{cta}</button>
              <button type="button" onClick={() => irPara(plansRef)} className="lp-link">Ver preços</button>
            </div>
            {trialPlan && <p className="lp-entrar lp-legenda" style={{ margin: 0 }}>Sem cobrança agora. Depois, {trialPlan.perMonth}. Cancela quando quiser.</p>}
            <div className="lp-entrar lp-numeros">
              <span><b className="font-mono">2 076</b> exercícios</span>
              <span><b className="font-mono">1 060</b> modelos de treino</span>
              <span><b className="font-mono">38</b> métodos</span>
              <span>Dados na <b>UE</b></span>
            </div>
          </div>
          <div className="lp-entrar-tel flex flex-col items-center gap-3">
            <TelemovelReal clip={HERO[heroIndice]} tocar={heroVisivel} rotulo="Agenda, treino e retenção" onFim={() => setHeroIndice((i) => (i + 1) % HERO.length)} />
            <span className="lp-legenda">Gravação real. Alunos fictícios.</span>
          </div>
        </section>

        <Muro />

        <div ref={featuresRef} className="lp-secao" style={{ paddingTop: 64, scrollMarginTop: 40 }}>
          <Revelar className="flex flex-col gap-3" style={{ paddingBottom: 40 }}>
            <h2 className="font-hero lp-h2">Um dia de trabalho, hora a hora.</h2>
            <p className="lp-corrido">Cada gravação foi feita na própria aplicação, em tamanho de telemóvel. Toque numa área para a ver.</p>
            <nav className="lp-horas font-mono" aria-label="Saltar para uma hora do dia">
              {MOMENTOS.map((m) => <a key={m.hora} href={`#hora-${m.hora.replace(':', '')}`}>{m.hora}</a>)}
            </nav>
          </Revelar>
          {MOMENTOS.map((m) => <Momento key={m.hora} m={m} />)}
        </div>

        <section className="lp-secao" style={{ paddingTop: 72, paddingBottom: 40 }}>
          <Revelar className="flex flex-col gap-3">
            <h2 className="font-hero lp-h2">E a lista inteira, sem letras pequenas.</h2>
            <p className="lp-corrido">Tudo isto está incluído em qualquer plano.</p>
          </Revelar>
          <div className="lp-lista">
            {LISTA.map((g, i) => (
              <Revelar key={g.nome} className="lp-grupo" atraso={Math.min(i, 5) * 30}>
                <h3>{g.nome}</h3>
                <ul>{g.itens.map((it) => <li key={it}>{it}</li>)}</ul>
              </Revelar>
            ))}
          </div>
        </section>

        <section ref={plansRef} className="lp-secao" style={{ paddingTop: 72, paddingBottom: 40, scrollMarginTop: 40 }}>
          <Revelar className="flex flex-col gap-3" style={{ paddingBottom: 28 }}>
            <h2 className="font-hero lp-h2">{trialPlan ? `${trialPlan.trialDays} dias para experimentar. Depois, um preço só.` : 'Um preço só, com tudo incluído.'}</h2>
            <p className="lp-corrido">A única diferença entre os planos é o preço e o tempo. Preços de lançamento, processados pela Stripe.</p>
          </Revelar>
          {plans.map((plan, i) => (
            <Revelar key={plan.id} className="lp-plano" atraso={i * 60}>
              <div className="lp-plano-nome">{plan.name}{plan.highlight && <span className="lp-selo">O mais escolhido</span>}</div>
              <div>
                {plan.precoLancamento && <span className="lp-riscado font-mono">{plan.precoLancamento.antes}</span>}
                <span className="lp-preco font-mono">{plan.price}</span>
                {plan.perMonth && plan.bonusMonths > 0 && <span className="lp-nota font-mono" style={{ display: 'block' }}>≈ {plan.perMonth}</span>}
              </div>
              <div className="lp-nota">
                {plan.note}{plan.trialDays ? ', a partir do 8º dia' : ''}
                {plan.bonusLabel && <span style={{ display: 'block', color: 'var(--gold)', fontWeight: 600 }}>{plan.bonusLabel}{plan.trialDays ? ' na primeira cobrança' : ''}</span>}
              </div>
              <button type="button" onClick={onGetStarted} className="lp-cta" style={{ whiteSpace: 'nowrap' }}>{plan.trialDays ? `${plan.trialDays} dias grátis` : 'Começar'}</button>
            </Revelar>
          ))}
          <div style={{ borderTop: '1px solid var(--border-hair)', paddingTop: 16 }}>
            {supportEmail && <a href={mailto('Dúvida sobre os planos do PTMANAGER')} className="lp-link inline-flex items-center gap-1.5"><Mail size={14} /> Dúvidas antes de começar? Escreva-nos</a>}
          </div>
        </section>

        <section className="lp-secao" style={{ paddingTop: 64, paddingBottom: 40, maxWidth: 780 }}>
          <Revelar style={{ paddingBottom: 24 }}><h2 className="font-hero lp-h2">Perguntas que nos fazem.</h2></Revelar>
          {FAQ_ITEMS.map((item, i) => <Pergunta key={item.q} item={item} aberta={aberta === i} onToggle={() => setAberta(aberta === i ? -1 : i)} />)}
        </section>

        <section className="lp-secao" style={{ paddingTop: 48, paddingBottom: 88 }}>
          <Revelar className="flex flex-col gap-5" style={{ borderTop: '1px solid var(--border-strong)', paddingTop: 44 }}>
            <h2 className="font-hero lp-h2">Amanhã às 07:00,<br />já pode estar aqui.</h2>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <button type="button" onClick={onGetStarted} className="lp-cta">{cta}</button>
              {trialPlan && <span className="lp-legenda">Depois, {trialPlan.perMonth} no plano mensal.</span>}
            </div>
          </Revelar>
        </section>
      </main>

      <footer className="flex flex-col sm:flex-row items-center justify-between gap-3" style={{ maxWidth: 1160, width: '100%', margin: '0 auto', padding: '20px', borderTop: '1px solid var(--border-hair)' }}>
        <span className="lp-legenda">PTMANAGER</span>
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => setLegalDoc('termos')} className="lp-link" style={{ fontSize: 12 }}>Termos de Utilização</button>
          <button type="button" onClick={() => setLegalDoc('privacidade')} className="lp-link" style={{ fontSize: 12 }}>Política de Privacidade</button>
        </div>
      </footer>

      {legalDoc && <LegalModal docId={legalDoc} supportEmail={supportEmail} onClose={() => setLegalDoc(null)} />}
    </div>
  );
}

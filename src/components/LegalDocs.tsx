import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

/* ===========================================================================
   ATENÇÃO — A PREENCHER ANTES DE PUBLICAR
   Estes textos foram redigidos à medida do PTMANAGER e do que a aplicação
   realmente faz, mas NÃO substituem revisão jurídica. Antes de aceitar
   pagamentos de clientes, é preciso:
     1. [FEITO em 2026-09-02] LEGAL_ENTITY preenchido; NIF validado.
     2. [FEITO em 2026-09-01] Região confirmada: eu-west-3, Paris, França.
     3. Submeter ambos os documentos a revisão por advogado.
   =========================================================================== */

// Identificação do responsável pelo tratamento, tal como registada nas Finanças
// e na Stripe. O nome tem de coincidir exatamente com o associado ao NIF.
const LEGAL_ENTITY = {
  name: 'Bruno Fonseca Gomes de Souza',
  nif: '319977218',
  address: 'Rua dos Fiéis de Deus, 103, 2.º esquerdo, 4820-251 Fafe',
  country: 'Portugal',
};

// Atualizar sempre que o conteúdo mudar de forma material: é a data que o
// utilizador vê e que prova quando as condições passaram a ser estas.
const LAST_UPDATED = '2 de setembro de 2026';

// Região onde o projeto Supabase está alojado. Verificado a 2026-09-01:
// projeto `veqeecnwtwunntojicko`, região eu-west-3 (Paris, França).
// Se algum dia o projeto mudar, esta linha tem de mudar com ele -- é uma
// declaração legal, não um comentário.
const HOSTING_REGION = 'França (Paris), União Europeia';

function docs(supportEmail) {
  const contact = supportEmail || '[E-MAIL DE SUPORTE]';
  return {
    privacidade: {
      title: 'Política de Privacidade',
      intro: `Esta política explica que dados o PTMANAGER trata, com que finalidade e quais os seus direitos. Última atualização: ${LAST_UPDATED}.`,
      sections: [
        {
          h: '1. Quem trata os seus dados',
          p: [
            `O responsável pelo tratamento dos dados da sua conta é ${LEGAL_ENTITY.name}, NIF ${LEGAL_ENTITY.nif}, com morada em ${LEGAL_ENTITY.address}, ${LEGAL_ENTITY.country}.`,
            `Para qualquer questão sobre privacidade, contacte ${contact}.`,
          ],
        },
        {
          h: '2. Papéis: os dados dos seus alunos são da sua responsabilidade',
          p: [
            'Esta distinção é importante. Quanto aos dados da sua própria conta (e-mail, subscrição), o PTMANAGER é o responsável pelo tratamento.',
            'Quanto aos dados que introduz sobre os seus alunos — nome, contacto, medidas corporais, avaliações físicas e fotografias — é o utilizador quem determina o que recolhe e porquê. Nessa relação, o utilizador é o responsável pelo tratamento e o PTMANAGER atua como subcontratante, limitando-se a alojar e processar esses dados por sua conta.',
            'Na prática, isto significa que é da sua responsabilidade obter o consentimento dos seus alunos, informá-los sobre o que guarda e responder aos pedidos que lhe façam.',
          ],
        },
        {
          h: '3. Que dados são tratados',
          p: [
            'Da sua conta: endereço de e-mail, palavra-passe (guardada apenas em forma cifrada, nunca legível), data de registo, data do último acesso e estado da subscrição.',
            'Que o utilizador introduz sobre os seus alunos: nome, número de sócio, telefone, sexo, altura, plano contratado e valores associados; registos de aulas, faltas e reposições; avaliações físicas, incluindo peso, percentagem de massa gorda, dobras cutâneas e outros indicadores corporais; e fotografias de progresso, quando as adicionar.',
            'Financeiros: os valores e categorias que lançar na área de finanças. Os dados do cartão nunca passam pelo PTMANAGER — são tratados diretamente pela Stripe.',
          ],
        },
        {
          h: '4. Dados de saúde',
          p: [
            'As medidas corporais, avaliações físicas e fotografias de progresso podem constituir dados relativos à saúde, que o Regulamento Geral sobre a Proteção de Dados classifica como categoria especial e sujeita a proteção reforçada.',
            'O tratamento destes dados assenta no consentimento explícito do titular. Compete ao utilizador obter esse consentimento junto de cada aluno, de preferência por escrito, antes de registar medições ou fotografias.',
          ],
        },
        {
          h: '5. Onde ficam os dados',
          p: [
            `Os dados da aplicação são alojados na infraestrutura da Supabase, em servidores localizados na ${HOSTING_REGION}, e estão cifrados em repouso.`,
            'Cada conta está isolada ao nível da base de dados: as regras de segurança impedem que uma conta aceda aos dados de outra.',
            'Os pagamentos são processados pela Stripe, que atua como responsável independente pelos dados de pagamento.',
          ],
        },
        {
          h: '6. Durante quanto tempo',
          p: [
            'Os dados que introduz permanecem enquanto mantiver a conta ativa. Pode apagá-los a qualquer momento em Definições → Dados e privacidade → Apagar todos os dados.',
            'Os registos de faturação são conservados pelo período exigido pela legislação fiscal aplicável.',
          ],
        },
        {
          h: '7. Os seus direitos',
          p: [
            'Assistem-lhe os direitos de acesso, retificação, apagamento, limitação, portabilidade e oposição relativamente aos dados da sua conta.',
            'A função de exportação de cópia de segurança permite obter, a qualquer momento, todos os dados em formato legível por máquina.',
            `Para exercer qualquer destes direitos, contacte ${contact}. Tem também o direito de apresentar reclamação à Comissão Nacional de Proteção de Dados (CNPD).`,
          ],
        },
        {
          h: '8. Segurança',
          p: [
            'O acesso exige autenticação e as palavras-passe são guardadas com função de hash pelo fornecedor de autenticação, não sendo legíveis por ninguém, incluindo por nós.',
            'O acesso ao painel exige sessão iniciada e subscrição ativa, e existe proteção contra tentativas repetidas de início de sessão.',
            'As cópias de segurança que exportar são ficheiros sem cifra: contêm nomes, medidas e fotografias em texto legível. Guarde-as em local seguro e não as partilhe por canais não protegidos.',
          ],
        },
        {
          h: '9. Armazenamento no dispositivo',
          p: [
            'A aplicação utiliza o armazenamento local do navegador para manter a sessão iniciada e para o controlo de tentativas de início de sessão. Não são utilizados cookies de publicidade nem de rastreio de terceiros.',
          ],
        },
        {
          h: '10. Alterações',
          p: [
            'Esta política pode ser atualizada. Alterações relevantes serão comunicadas por e-mail ou através da aplicação antes de produzirem efeitos.',
          ],
        },
      ],
    },

    termos: {
      title: 'Termos de Utilização',
      intro: `Estas condições regulam o acesso e a utilização do PTMANAGER. Ao criar conta, declara aceitá-las. Última atualização: ${LAST_UPDATED}.`,
      sections: [
        {
          h: '1. Objeto',
          p: [
            'O PTMANAGER é uma aplicação de gestão destinada a personal trainers, que permite organizar alunos, agenda, avaliações físicas, fotografias de progresso e finanças.',
            `O serviço é prestado por ${LEGAL_ENTITY.name}, NIF ${LEGAL_ENTITY.nif}.`,
          ],
        },
        {
          h: '2. Conta',
          p: [
            'A conta é pessoal e intransmissível. É responsável por manter a confidencialidade da sua palavra-passe e por toda a atividade realizada na sua conta.',
            'Deve ter pelo menos 18 anos e capacidade legal para contratar.',
            'Os seus alunos não têm acesso à aplicação: apenas o titular da conta acede aos dados.',
          ],
        },
        {
          h: '3. Subscrições e pagamentos',
          p: [
            'O acesso ao painel exige uma subscrição ativa. Os planos e preços em vigor são os apresentados na página de planos.',
            'Nos planos com meses de oferta, esses meses são acrescentados ao primeiro período, após confirmação do pagamento.',
            'Os pagamentos são processados pela Stripe. As subscrições por cartão renovam automaticamente no final de cada período, salvo cancelamento prévio.',
            'Pode cancelar a qualquer momento; o acesso mantém-se até ao fim do período já pago. Salvo imposição legal, os valores relativos a períodos já iniciados não são reembolsados.',
          ],
        },
        {
          h: '4. Direito de livre resolução',
          p: [
            'Enquanto consumidor, dispõe do prazo legal de 14 dias para livre resolução do contrato. Ao iniciar a utilização do serviço durante esse prazo, aceita que a execução comece de imediato, o que pode implicar a perda desse direito nos termos da lei aplicável.',
          ],
        },
        {
          h: '5. Dados dos seus alunos',
          p: [
            'Ao introduzir dados sobre terceiros, garante que dispõe de fundamento legítimo para o fazer e que obteve o consentimento necessário, em especial no que respeita a medidas corporais, avaliações físicas e fotografias.',
            'É o utilizador quem responde perante os seus alunos pelo tratamento desses dados. O PTMANAGER limita-se a alojá-los e processá-los por sua conta e segundo as suas instruções.',
          ],
        },
        {
          h: '6. Utilização aceitável',
          p: [
            'Não é permitido utilizar o serviço para fins ilícitos, tentar aceder a dados de outras contas, contornar limites técnicos ou de subscrição, nem revender o acesso a terceiros.',
            'O incumprimento pode levar à suspensão ou encerramento da conta.',
          ],
        },
        {
          h: '7. Disponibilidade',
          p: [
            'Procuramos manter o serviço disponível de forma contínua, mas não é garantida disponibilidade ininterrupta. Podem ocorrer interrupções para manutenção, atualizações ou por causas imputáveis a terceiros, como os fornecedores de alojamento e de pagamentos.',
            'Recomenda-se a exportação periódica de cópias de segurança.',
          ],
        },
        {
          h: '8. Limitação de responsabilidade',
          p: [
            'O serviço é uma ferramenta de organização e não substitui aconselhamento médico, nutricional ou jurídico. As decisões técnicas tomadas com base nos dados registados são da exclusiva responsabilidade do utilizador.',
            'Na medida permitida por lei, a responsabilidade total fica limitada ao valor pago pelo utilizador nos doze meses anteriores ao facto que a originou. Nada nestes termos exclui responsabilidades que não possam ser excluídas por lei.',
          ],
        },
        {
          h: '9. Cessação',
          p: [
            'Pode encerrar a conta a qualquer momento. Podemos suspender ou encerrar o acesso em caso de incumprimento destes termos ou de falta de pagamento.',
            'Antes de encerrar, exporte os seus dados: após o encerramento poderão ser eliminados de forma definitiva.',
          ],
        },
        {
          h: '10. Lei aplicável',
          p: [
            'Aplica-se a lei portuguesa. Para a resolução de litígios de consumo, pode recorrer às entidades de resolução alternativa competentes.',
          ],
        },
      ],
    },
  };
}

export const LEGAL_DOC_IDS = { privacidade: 'privacidade', termos: 'termos' };

export default function LegalModal({ docId = 'termos', supportEmail, onClose }) {
  const [active, setActive] = useState(docId);
  const all = docs(supportEmail);
  const doc = all[active] || all.termos;

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 flex items-stretch sm:items-center justify-center animate-in p-0 sm:p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(3px)', zIndex: 70 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={doc.title}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="border border-hair w-full sm:max-w-2xl flex flex-col sm:rounded-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--bg-surface)', boxShadow: 'var(--shadow-lg)', height: '100%', maxHeight: 'min(100dvh, 720px)' }}
      >
        <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-hair flex-shrink-0">
          <div className="flex gap-1 min-w-0">
            {[['termos', 'Termos'], ['privacidade', 'Privacidade']].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setActive(id)}
                className="px-3 py-1.5 rounded-lg text-sm font-body btn-surface nowrap"
                style={{
                  backgroundColor: active === id ? 'var(--brass-soft)' : 'transparent',
                  color: active === id ? 'var(--brass)' : 'var(--text-muted)',
                  fontWeight: active === id ? 600 : 400,
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <button onClick={onClose} type="button" className="p-1.5 rounded-lg btn-surface flex-shrink-0" aria-label="Fechar">
            <X size={18} className="text-muted" style={{ display: 'block' }} />
          </button>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5">
          <h2 className="font-display text-xl font-semibold text-primary">{doc.title}</h2>
          <p className="text-xs font-body text-faint mt-1.5">{doc.intro}</p>
          <div className="flex flex-col gap-5 mt-5">
            {doc.sections.map((s) => (
              <section key={s.h}>
                <h3 className="font-body text-sm font-semibold text-primary mb-1.5">{s.h}</h3>
                {s.p.map((t, i) => (
                  <p key={i} className="text-sm font-body text-muted leading-relaxed mb-2">{t}</p>
                ))}
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

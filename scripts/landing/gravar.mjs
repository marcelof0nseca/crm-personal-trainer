import { SP, pw, abrir, grava, toca, escreve, desliza, espera } from './base.mjs';

const nav = (page, n) => page.locator('button:visible').filter({ hasText: new RegExp(`^\\s*${n}\\s*$`) }).first();
const pronta = async (page) => { await nav(page, 'Painel').waitFor({ timeout: 30000 }); await espera(page, 1000); };
const seguinte = (page) => page.locator('button:visible', { hasText: 'Seguinte' }).first();
const botao = (page, nome, exact = false) => page.getByRole('button', { name: nome, exact });
const mais = async (page, area) => { await toca(page, nav(page, 'Mais'), 500); await toca(page, botao(page, new RegExp(`^${area}`)), 900); };
const voltarMais = (page) => toca(page, botao(page, 'Voltar a Mais'), 500);
const abrirAluno = async (page, nome = 'Rita Ferreira') => { await toca(page, nav(page, 'Alunos'), 500); await toca(page, page.getByText(nome).first(), 700); };
const aba = (page, nome) => toca(page, page.getByRole('tab', { name: nome }), 1000);

const CLIPES = {
  async painel(page) {
    await pronta(page);
    await grava(page, 'painel', async () => {
      await espera(page, 700);
      await toca(page, page.locator('button:visible').filter({ has: page.locator('svg.lucide-chevron-left') }).first(), 1100);
      await desliza(page, 640, 1500);
      await espera(page, 900);
      await desliza(page, 760, 1500);
      await espera(page, 900);
      await desliza(page, -1400, 1100);
      await espera(page, 500);
    });
  },
  async agenda(page) {
    await pronta(page);
    await toca(page, nav(page, 'Agenda'), 700);
    await grava(page, 'agenda', async () => {
      await espera(page, 900);
      await desliza(page, 420, 1000);
      await toca(page, page.getByRole('button', { name: 'Marcar como realizado' }).first(), 900);
      await toca(page, botao(page, 'Dia', true), 1000);
      await toca(page, botao(page, 'Mês', true), 1100);
      await toca(page, botao(page, 'Semana', true), 900);
      await desliza(page, 300, 800);
    });
  },
  async agendaAvancada(page) {
    await pronta(page);
    await mais(page, 'Agenda avançada');
    await grava(page, 'agenda-avancada', async () => {
      await espera(page, 700);
      await escreve(page, page.getByLabel('Nome (opcional)'), 'Férias de agosto');
      await page.keyboard.press('Escape').catch(() => {});
      await espera(page, 500);
      await aba(page, 'Turmas');
      await desliza(page, 340, 1000);
      await espera(page, 500);
      await desliza(page, -340, 500);
      await aba(page, 'Locais');
      await aba(page, 'Regras de reserva');
      await aba(page, 'Calendário');
    });
  },
  async faltas(page) {
    await pronta(page);
    await toca(page, nav(page, 'Faltas'), 800);
    await grava(page, 'faltas', async () => {
      await espera(page, 900);
      await desliza(page, 380, 1100);
      await espera(page, 800);
      await toca(page, page.getByRole('button', { name: 'Histórico' }).nth(1), 1300);
      await desliza(page, 240, 800);
      await espera(page, 900);
    });
  },
  async alunos(page) {
    await pronta(page);
    await toca(page, nav(page, 'Alunos'), 600);
    await grava(page, 'alunos', async () => {
      await espera(page, 700);
      await desliza(page, 300, 800);
      await desliza(page, -300, 500);
      await toca(page, page.getByText('Rita Ferreira').first(), 800);
      await desliza(page, 400, 900);
      await toca(page, page.getByText('Ficha 360º').first(), 1200);
      await desliza(page, 420, 1100);
      await espera(page, 700);
      await desliza(page, 500, 1100);
    });
  },
  async treino(page) {
    await pronta(page);
    await abrirAluno(page);
    await toca(page, botao(page, /Treinos/), 700);
    await grava(page, 'treino', async () => {
      await espera(page, 600);
      await toca(page, page.getByText('Força e composição').first(), 900);
      await desliza(page, 330, 900);
      await toca(page, botao(page, 'Passo a passo'), 800);
      const carga = page.getByLabel(/Carga da série 1 de Agachamento/);
      await escreve(page, carga, '40');
      await page.evaluate(() => document.activeElement && document.activeElement.blur());
      await espera(page, 800);
      await toca(page, seguinte(page), 1000);
      await toca(page, seguinte(page), 1000);
    });
  },
  async construtor(page) {
    await pronta(page);
    await abrirAluno(page);
    await toca(page, botao(page, /Treinos/), 600);
    await toca(page, page.getByText('Força e composição').first(), 700);
    await grava(page, 'construtor', async () => {
      await toca(page, botao(page, /Editar programa/), 1000);
      await desliza(page, 520, 1200);
      await espera(page, 500);
      await toca(page, botao(page, /Acrescentar exercício/), 900);
      await escreve(page, page.getByPlaceholder(/Procurar|Pesquisar/).first(), 'remada');
      await espera(page, 900);
      await toca(page, page.getByRole('button', { name: /^Remada/ }).first(), 900);
      await espera(page, 600);
    });
  },
  async modelos(page) {
    await pronta(page);
    await abrirAluno(page);
    await toca(page, botao(page, /Treinos/), 600);
    await grava(page, 'modelos', async () => {
      await toca(page, botao(page, /Biblioteca de modelos/), 2200);
      await espera(page, 600);
      await escreve(page, page.getByPlaceholder(/Procurar|Pesquisar|Procura/).first(), 'musculação');
      await page.evaluate(() => document.activeElement && document.activeElement.blur());
      await espera(page, 900);
      await desliza(page, 340, 1000);
      await toca(page, page.getByText(/Musculação \| 0[3-9]/).first(), 1100);
      await desliza(page, 620, 1400);
      await espera(page, 700);
    });
  },
  async registar(page) {
    await pronta(page);
    await abrirAluno(page);
    await toca(page, botao(page, /Treinos/), 600);
    await toca(page, page.getByText('Força e composição').first(), 700);
    await grava(page, 'registar', async () => {
      await toca(page, botao(page, /Registar sessão/), 1200);
      await espera(page, 500);
      const vistos = page.locator('button[aria-pressed]:visible');
      await toca(page, vistos.nth(1), 1000);
      await toca(page, vistos.nth(2), 1000);
      await toca(page, seguinte(page), 1100);
      await espera(page, 700);
    });
  },
  async avaliacao(page) {
    await pronta(page);
    await toca(page, nav(page, 'Avaliações'), 700);
    await grava(page, 'avaliacao', async () => {
      await espera(page, 500);
      await toca(page, page.getByText('Rita Ferreira').first(), 1100);
      await desliza(page, 420, 1100);
      await espera(page, 700);
      await desliza(page, 560, 1200);
      await espera(page, 800);
    });
  },
  async centroAvaliacoes(page) {
    await pronta(page);
    await mais(page, 'Centro de avaliações');
    await grava(page, 'centro-avaliacoes', async () => {
      await espera(page, 800);
      await page.getByLabel(/^Aluno/).first().selectOption('a1').catch(() => {});
      await espera(page, 800);
      await desliza(page, 380, 1000);
      await espera(page, 600);
      await toca(page, botao(page, /Bateria funcional/), 1000);
      const seletores = page.locator('[role=dialog] select:visible');
      await seletores.nth(0).selectOption({ index: 3 }); await espera(page, 350);
      await seletores.nth(1).selectOption({ index: 2 }); await espera(page, 350);
      await desliza(page, 300, 800);
      await espera(page, 600);
    });
  },
  async formularios(page) {
    await pronta(page);
    await abrirAluno(page);
    await grava(page, 'formularios', async () => {
      await desliza(page, 300, 500);
      await toca(page, page.getByText('Formulários').first(), 1000);
      await toca(page, botao(page, /Preencher/), 1200);
      await desliza(page, 300, 900);
      const sim = page.getByRole('button', { name: 'Não', exact: true });
      await toca(page, sim.nth(0), 400);
      await toca(page, sim.nth(1), 400);
      await espera(page, 300);
      const tela = page.locator('canvas:visible').first();
      await tela.scrollIntoViewIfNeeded();
      await espera(page, 400);
      const c = await tela.boundingBox();
      const y0 = c.y + c.height * 0.55;
      await page.mouse.move(c.x + 30, y0);
      await page.mouse.down();
      for (let i = 0; i <= 44; i += 1) { await page.mouse.move(c.x + 30 + i * ((c.width - 70) / 44), y0 + Math.sin(i / 1.7) * c.height * 0.26 * (1 - i / 62) + Math.cos(i / 5) * c.height * 0.08); await page.waitForTimeout(16); }
      await page.mouse.up();
      await espera(page, 900);
    });
  },
  async documentos(page) {
    await pronta(page);
    await abrirAluno(page);
    await toca(page, botao(page, /Treinos/), 600);
    await toca(page, page.getByText('Força e composição').first(), 700);
    await grava(page, 'pdf', async () => {
      await toca(page, botao(page, /Exportar PDF/), 1500);
      await desliza(page, 240, 900);
      await espera(page, 1000);
    });
  },
  async financas(page) {
    await pronta(page);
    await toca(page, nav(page, 'Finanças'), 700);
    await grava(page, 'financas', async () => {
      await espera(page, 800);
      await desliza(page, 360, 1000);
      await espera(page, 700);
      await desliza(page, 420, 1000);
      await espera(page, 600);
      await desliza(page, -780, 800);
      await toca(page, botao(page, 'Gasto', true), 900);
      await espera(page, 700);
    });
  },
  async relatorio(page) {
    await pronta(page);
    await grava(page, 'relatorio', async () => {
      await toca(page, botao(page, /Relatório do período/), 1400);
      await desliza(page, 460, 1100);
      await espera(page, 700);
      await desliza(page, 520, 1100);
      await espera(page, 600);
    });
  },
  async retencao(page) {
    await pronta(page);
    await mais(page, 'Retenção');
    await grava(page, 'retencao', async () => {
      await espera(page, 1100);
      await desliza(page, 260, 800);
      await espera(page, 500);
      await desliza(page, -260, 500);
      await page.getByLabel('Mostrar').selectOption('todos');
      await espera(page, 800);
      await desliza(page, 420, 1100);
      await desliza(page, -420, 500);
      await aba(page, 'Números');
      await espera(page, 400);
      await aba(page, 'Regras');
    });
  },
  async crm(page) {
    await pronta(page);
    await mais(page, 'Contactos');
    await grava(page, 'contactos', async () => {
      await espera(page, 700);
      await desliza(page, 340, 900);
      await espera(page, 500);
      await desliza(page, -340, 500);
      await aba(page, 'Importar');
      await aba(page, 'Grupos e etiquetas');
      await aba(page, 'Lixeira');
    });
  },
  async tarefas(page) {
    await pronta(page);
    await mais(page, 'Tarefas e regras');
    await grava(page, 'tarefas', async () => {
      await espera(page, 700);
      await desliza(page, 280, 800);
      await toca(page, page.getByText('Renovar o plano do Bruno'), 900);
      await desliza(page, -280, 500);
      await aba(page, 'Regras');
    });
  },
  async mensagens(page) {
    await pronta(page);
    await mais(page, 'Mensagens');
    await grava(page, 'mensagens', async () => {
      await page.getByLabel('Pré-visualizar com o aluno').selectOption('a2');
      await espera(page, 900);
      await desliza(page, 420, 1100);
      await espera(page, 500);
      await desliza(page, 420, 1000);
      await espera(page, 500);
    });
  },
  async novidades(page) {
    await pronta(page);
    await mais(page, 'Novidades');
    await grava(page, 'novidades', async () => {
      await espera(page, 1000);
      await page.getByRole('tab', { name: /Por tratar/ }).tap();
      await espera(page, 1100);
      await toca(page, botao(page, 'Marcar a aula'), 1000);
      await desliza(page, 220, 700);
      await espera(page, 600);
      await aba(page, 'Registo');
    });
  },
  async planos(page) {
    await pronta(page);
    await mais(page, 'Planos e faturas');
    await grava(page, 'planos', async () => {
      await espera(page, 800);
      await desliza(page, 280, 800);
      await desliza(page, -280, 500);
      await aba(page, 'Alunos e planos');
      await aba(page, 'Planos');
      await aba(page, 'Contratos');
      await aba(page, 'Números');
      await desliza(page, 220, 700);
    });
  },
  async documentosArea(page) {
    await pronta(page);
    await mais(page, 'Documentos');
    await grava(page, 'documentos', async () => {
      await espera(page, 700);
      await page.getByLabel(/^Aluno/).first().selectOption('a1');
      await espera(page, 800);
      await aba(page, 'Formulários enviados');
      await aba(page, 'Partilhar resultados');
      await page.getByLabel(/^Aluno/).first().selectOption('a1');
      await espera(page, 500);
      await page.getByLabel(/^Avaliação/).first().selectOption({ index: 1 });
      await espera(page, 900);
      await aba(page, 'Exportar dados');
    });
  },
  async vendas(page) {
    await pronta(page);
    await mais(page, 'Vendas');
    await grava(page, 'vendas', async () => {
      await espera(page, 700);
      await desliza(page, 560, 1200);
      await espera(page, 500);
      await desliza(page, -560, 500);
      await aba(page, 'Depoimentos');
      await aba(page, 'Inscrição e indicações');
      await aba(page, 'Imagens');
      await escreve(page, page.getByLabel('Título', { exact: true }), 'Hoje há treino');
      await page.evaluate(() => document.activeElement && document.activeElement.blur());
      await desliza(page, 340, 900);
      await espera(page, 500);
    });
  },
  async fidelizacao(page) {
    await pronta(page);
    await mais(page, 'Desafios e pontos');
    await grava(page, 'fidelizacao', async () => {
      await espera(page, 600);
      await toca(page, page.getByText('30 dias a mexer').first(), 900);
      await desliza(page, 420, 1000);
      await desliza(page, -420, 500);
      await aba(page, 'Pontos');
      await espera(page, 600);
      await desliza(page, 300, 800);
      await desliza(page, -300, 500);
      await aba(page, 'Satisfação');
    });
  },
  async metas(page) {
    await pronta(page);
    await mais(page, 'Metas');
    await grava(page, 'metas', async () => {
      await espera(page, 700);
      await page.getByLabel(/^Aluno/).first().selectOption('a1');
      await espera(page, 700);
      await desliza(page, 340, 900);
      await espera(page, 600);
    });
  },
};

// Área do aluno e página pública
const ALUNO = {
  async alunoInicio(page) {
    await page.getByRole('heading', { name: /Rita/ }).waitFor({ timeout: 30000 });
    await grava(page, 'aluno-inicio', async () => {
      await espera(page, 900);
      await desliza(page, 300, 800);
      await espera(page, 400);
      await desliza(page, -300, 500);
      await toca(page, botao(page, /Começar treino/), 1200);
      await espera(page, 500);
      await desliza(page, 300, 800);
      await espera(page, 400);
      const v = page.locator('button[aria-pressed]:visible');
      await toca(page, v.nth(0), 800);
      await toca(page, v.nth(1), 800);
      await toca(page, v.nth(2), 900);
    });
  },
  async alunoAreas(page) {
    await page.getByRole('heading', { name: /Rita/ }).waitFor({ timeout: 30000 });
    const bar = (n) => page.getByRole('navigation').getByRole('button', { name: new RegExp(`^${n}`) });
    await grava(page, 'aluno-areas', async () => {
      await toca(page, bar('Agenda'), 900);
      await desliza(page, 300, 800);
      await desliza(page, -300, 500);
      await toca(page, bar('Progresso'), 900);
      await desliza(page, 420, 1000);
      await desliza(page, -420, 500);
      await toca(page, bar('Histórico'), 900);
      await toca(page, bar('Mais'), 900);
      await desliza(page, 620, 1300);
      await espera(page, 500);
    });
  },
  async publica(page) {
    await page.getByRole('heading', { name: /Treino a sério/ }).waitFor({ timeout: 30000 });
    await grava(page, 'pagina-publica', async () => {
      await espera(page, 900);
      await desliza(page, 300, 900);
      await espera(page, 500);
      await escreve(page, page.getByLabel('Nome'), 'Patrícia Dias');
      await escreve(page, page.getByLabel('Email'), 'patricia@exemplo.pt');
      await page.evaluate(() => document.activeElement && document.activeElement.blur());
      await desliza(page, 300, 700);
      await toca(page, page.getByLabel(/Confirmo/), 500);
      await espera(page, 400);
      await toca(page, botao(page, 'Quero começar'), 1200);
    });
  },
};

const pedidos = process.argv.slice(2);
const browser = await pw.chromium.launch();
for (const nome of (pedidos.length ? pedidos : [...Object.keys(CLIPES), ...Object.keys(ALUNO)])) {
  const opcoes = nome === 'publica' ? { url: '/?p=anamartins', sessao: false } : (ALUNO[nome] ? { url: '/?a=tokentokentokentokentoken1', via: 'conta' } : {});
  const { page, ctx } = await abrir(browser, opcoes);
  try { await (CLIPES[nome] || ALUNO[nome])(page); } catch (e) { console.log(`${nome}: FALHOU ANTES: ${String(e.message).split('\n').slice(0, 2).join(' ').slice(0, 240)}`); await page.screenshot({ path: `${SP}/${nome}-ERRO.png` }).catch(() => {}); }
  await ctx.close();
}
await browser.close();
process.exit(0);

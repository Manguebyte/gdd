// Gera as páginas do site a partir dos GDDs da raiz do repositório.
//
// POR QUE: cada GDD continua sendo um arquivo único na raiz (é assim que o time
// e os agentes editam), mas no site cada jogo vira duas páginas: "GDD" (design)
// e "Guia Unity" (implementação). A divisão acontece aqui, no build, então os
// arquivos originais nunca são alterados.
//
// ESTRATÉGIA: o arquivo é cortado em blocos em cada título de nível 1 ou 2
// (fora de blocos de código). Cada bloco herda o "modo" do anterior; o modo só
// muda quando o título casa com `guideStart` (vira Guia Unity) ou `gddStart`
// (volta a ser GDD). Se `guideStart` não casar com nada, o build falha: é sinal
// de que o título do guia foi renomeado e a tabela GAMES precisa ser ajustada.
//
// Uso: node scripts/split-gdds.mjs (também roda sozinho via docusaurus.config.mjs)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import GithubSlugger from 'github-slugger';

const SITE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const REPO_ROOT = path.resolve(SITE_DIR, '..');
const DOCS_DIR = path.join(SITE_DIR, 'docs');
const REPO_URL = 'https://github.com/Manguebyte/gdd';

// Um jogo novo entra no site adicionando uma linha aqui.
export const GAMES = [
  {
    source: 'RallySurvive.md',
    slug: 'rallysurvive',
    label: 'Franquia Rally',
    description: 'Corrida topdown 2D guiada pelo mouse: RallySurvive, Navigation Expert, RaceLegenda e Street Legends.',
    guideStart: /^# Parte 7\b/,
    gddStart: /^# Parte 15\b/,
  },
  {
    source: 'StarExpeditionCo.md',
    slug: 'star-expedition-co',
    label: 'Star Expedition Co.',
    description: 'Gerenciamento de equipe com expedições idle em tempo real.',
    guideStart: /^# Parte 2\b/,
  },
  {
    source: 'GDD_8-Bit_Armageddon.md',
    slug: '8-bit-armageddon',
    label: '8-Bit Armageddon',
    description: 'Roguelike de defesa automática de planeta.',
    guideStart: /^## 10\. /,
  },
  {
    source: 'RequiemOfBlessings.md',
    slug: 'requiem-of-blessings',
    label: 'Requiem of Blessings',
    description: 'RPG mobile de fantasia sombria com turnos ativos (esquiva e parry).',
    guideStart: /^## 12\. /,
  },
  {
    source: 'DiceAndBlood.md',
    slug: 'dice-and-blood',
    label: 'DiceAndBlood',
    description: 'RPG tático roguelike em tabuleiro 8x8, com movimento por dado.',
    guideStart: /^# Parte 2\b/,
  },
  {
    source: 'GDD_Protocolo_Ectoplasma.md',
    slug: 'protocolo-ectoplasma',
    label: 'Protocolo Ectoplasma',
    description: 'Ação top-down: capturar fantasmas em zonas contaminadas da cidade.',
    guideStart: /^## 10\. /,
    gddStart: /^## 12\. /,
  },
  {
    // Não tem GDD próprio no repositório, só o tutorial de implementação.
    source: 'tutorial-mvp-completo-unity.md',
    slug: 'mercador-e-legiao',
    label: 'Mercador & Legião',
    description: 'Tutorial Unity do MVP completo (heróis, quests, combate, crafting e loja).',
    guideOnly: true,
    guideLabel: 'Tutorial Unity (MVP)',
  },
];

const FENCE = /^ {0,3}(```|~~~)/;
const HEADING = /^(#{1,6})\s+(.*?)\s*#*\s*$/;

// Marca quais linhas estão dentro de blocos de código, para não confundir
// comentários de C# ou shell (`# ...`) com títulos.
function codeMask(lines) {
  let inFence = false;
  return lines.map((line) => {
    if (FENCE.test(line)) {
      inFence = !inFence;
      return true;
    }
    return inFence;
  });
}

// Texto do título como o Docusaurus o exibe, para gerar o mesmo id de âncora.
function plainHeadingText(text) {
  return text
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[`*_]/g, '')
    .trim();
}

function anchorsOf(body) {
  const slugger = new GithubSlugger();
  const lines = body.split('\n');
  const mask = codeMask(lines);
  const anchors = new Set();
  lines.forEach((line, i) => {
    const m = !mask[i] && line.match(HEADING);
    if (m) anchors.add(slugger.slug(plainHeadingText(m[2])));
  });
  return anchors;
}

// Links relativos para arquivos do repositório (ex.: contexts/.../CONTEXT.md)
// não existem no site: passam a apontar para o arquivo no GitHub.
function rewriteRepoLinks(body) {
  return body.replace(/\]\((?!https?:|mailto:|#|\/)([^)\s]+)\)/g, (_, target) => {
    const clean = target.replace(/^\.\//, '');
    return `](${REPO_URL}/blob/main/${clean})`;
  });
}

// Marcadores como "<Planet>" ou "<Nome>" no texto seriam lidos como tags HTML
// e sumiriam da página. Fora de código, tudo entre < > que não seja uma tag
// HTML conhecida nem um link automático vira texto literal.
const HTML_TAGS = new Set(
  'a abbr b br code del details div em h1 h2 h3 h4 h5 h6 hr i img kbd li mark ol p pre s small span strong sub summary sup table tbody td th thead tr u ul'.split(' '),
);

function escapePlaceholders(body) {
  const lines = body.split('\n');
  const mask = codeMask(lines);
  return lines
    .map((line, i) => {
      if (mask[i] || !line.includes('<')) return line;
      // Partes pares ficam fora de `code spans`; só elas são alteradas.
      return line
        .split(/(`+[^`]*`+)/)
        .map((part, k) =>
          k % 2
            ? part
            : part.replace(/<(\/?)([^<>\s/]+)([^<>]*)>/g, (match, _slash, name) => {
                if (HTML_TAGS.has(name.toLowerCase()) || /^(https?|mailto):/.test(name)) return match;
                return match.replace(/</g, '&lt;').replace(/>/g, '&gt;');
              }),
        )
        .join('');
    })
    .join('\n');
}

// Âncoras que ficaram na outra página (GDD <-> Guia Unity) viram link entre páginas.
function rewriteCrossPageAnchors(body, ownAnchors, otherAnchors, otherFile) {
  if (!otherFile) return body;
  return body.replace(/\]\(#([^)\s]+)\)/g, (match, anchor) => {
    if (ownAnchors.has(anchor) || !otherAnchors.has(anchor)) return match;
    return `](./${otherFile}#${anchor})`;
  });
}

function splitGame(game) {
  const raw = fs.readFileSync(path.join(REPO_ROOT, game.source), 'utf8');
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  const mask = codeMask(lines);

  // O primeiro H1 é o título do documento; o site usa o título do front matter.
  if (HEADING.test(lines[0]) && lines[0].startsWith('# ')) {
    lines.shift();
    mask.shift();
  }

  // Arquivos organizados em "# Parte N" repetem o assunto logo abaixo, em um
  // "## ..." ("# Parte 8 — ... Fase 1" + "## Fase 1 — Movimento do Carro").
  // No site essa "Parte" é redundante (a página já diz se é GDD ou Guia): o H1
  // sai e o H2 vira o título de seção. Se um H1 tiver texto próprio antes do
  // próximo título, ele é mantido, rebaixado para H2.
  const nextContentLine = (i) => {
    for (let j = i + 1; j < lines.length; j++) if (lines[j].trim()) return j;
    return -1;
  };
  const partHeading = (i) => !mask[i] && /^# /.test(lines[i]);
  const dropLine = (i) => {
    if (!partHeading(i)) return false;
    const j = nextContentLine(i);
    return j !== -1 && !mask[j] && /^## /.test(lines[j]);
  };

  const chunks = [{ heading: null, lines: [], mode: 'gdd' }];
  let mode = game.guideOnly ? 'guide' : 'gdd';
  chunks[0].mode = mode;
  let guideFound = Boolean(game.guideOnly);

  lines.forEach((line, i) => {
    const isSplitHeading = !mask[i] && /^#{1,2} /.test(line) && !game.guideOnly;
    if (isSplitHeading) {
      if (game.guideStart.test(line)) {
        mode = 'guide';
        guideFound = true;
      } else if (game.gddStart && game.gddStart.test(line)) {
        mode = 'gdd';
      }
      chunks.push({ heading: line, lines: [], mode });
    }
    if (dropLine(i)) return;
    chunks[chunks.length - 1].lines.push(partHeading(i) ? `#${line}` : line);
  });

  if (!guideFound) {
    throw new Error(
      `[split-gdds] ${game.source}: nenhum título casou com guideStart ${game.guideStart}. ` +
        'O título do guia Unity mudou? Ajuste GAMES em site/scripts/split-gdds.mjs.',
    );
  }

  // O Índice manual é redundante com a barra lateral e o sumário do site.
  const isIndex = (c) => c.heading && /^#{1,2} Índice\s*$/.test(c.heading);
  const bodyOf = (m) =>
    chunks
      .filter((c) => c.mode === m && !isIndex(c))
      .flatMap((c) => c.lines)
      .join('\n')
      .replace(/^(\s*---\s*\n)+/, '') // separador solto logo após o título removido
      .trim();

  return { gdd: bodyOf('gdd'), guide: bodyOf('guide') };
}

function frontMatter(fields) {
  const yaml = Object.entries(fields)
    .map(([k, v]) => `${k}: ${typeof v === 'string' ? JSON.stringify(v) : v}`)
    .join('\n');
  return `---\n${yaml}\n---\n\n`;
}

function writeIfChanged(file, content) {
  if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === content) return;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

function editUrl(game) {
  return `${REPO_URL}/edit/main/${game.source}`;
}

function buildIntro() {
  const rows = GAMES.map((g) => {
    const first = g.guideOnly ? 'guia-unity' : 'gdd';
    const links = g.guideOnly
      ? `[${g.guideLabel}](./${g.slug}/guia-unity.md)`
      : `[GDD](./${g.slug}/gdd.md) · [Guia Unity](./${g.slug}/guia-unity.md)`;
    return `| [${g.label}](./${g.slug}/${first}.md) | ${g.description} | ${links} |`;
  });
  return (
    frontMatter({ title: 'GDDs da Mangue Byte Games', slug: '/', sidebar_position: 0, sidebar_label: 'Início' }) +
    'Documentos de design dos jogos do estúdio. Cada jogo tem duas páginas: o **GDD** (mecânicas, regras e decisões ' +
    'de design) e o **Guia Unity** (implementação passo a passo).\n\n' +
    '| Jogo | Resumo | Páginas |\n| --- | --- | --- |\n' +
    rows.join('\n') +
    '\n\n' +
    'As páginas são geradas a partir dos arquivos `.md` da raiz do repositório. Para corrigir algo, edite o arquivo ' +
    'original (o link "Editar esta página" no fim de cada página leva direto a ele).\n'
  );
}

export function splitGdds() {
  fs.mkdirSync(DOCS_DIR, { recursive: true });

  // Remove pastas de jogos que saíram da tabela GAMES.
  const slugs = new Set(GAMES.map((g) => g.slug));
  for (const entry of fs.readdirSync(DOCS_DIR, { withFileTypes: true })) {
    if (entry.isDirectory() && !slugs.has(entry.name)) {
      fs.rmSync(path.join(DOCS_DIR, entry.name), { recursive: true, force: true });
    }
  }

  GAMES.forEach((game, index) => {
    const dir = path.join(DOCS_DIR, game.slug);
    const { gdd, guide } = splitGame(game);
    const gddAnchors = anchorsOf(gdd);
    const guideAnchors = anchorsOf(guide);

    writeIfChanged(
      path.join(dir, '_category_.json'),
      JSON.stringify(
        {
          label: game.label,
          position: index + 1,
          link: { type: 'doc', id: `${game.slug}/${game.guideOnly ? 'guia-unity' : 'gdd'}` },
        },
        null,
        2,
      ) + '\n',
    );

    const gddFile = path.join(dir, 'gdd.md');
    if (game.guideOnly) {
      fs.rmSync(gddFile, { force: true });
    } else {
      writeIfChanged(
        gddFile,
        frontMatter({
          title: `${game.label} — GDD`,
          sidebar_label: 'GDD',
          sidebar_position: 1,
          toc_max_heading_level: 3,
          custom_edit_url: editUrl(game),
        }) +
          rewriteCrossPageAnchors(escapePlaceholders(rewriteRepoLinks(gdd)), gddAnchors, guideAnchors, 'guia-unity.md') +
          '\n',
      );
    }

    writeIfChanged(
      path.join(dir, 'guia-unity.md'),
      frontMatter({
        title: `${game.label} — ${game.guideLabel ?? 'Guia Unity'}`,
        sidebar_label: game.guideLabel ?? 'Guia Unity',
        sidebar_position: 2,
        toc_max_heading_level: 3,
        custom_edit_url: editUrl(game),
      }) +
        rewriteCrossPageAnchors(
          escapePlaceholders(rewriteRepoLinks(guide)),
          guideAnchors,
          gddAnchors,
          game.guideOnly ? null : 'gdd.md',
        ) +
        '\n',
    );
  });

  writeIfChanged(path.join(DOCS_DIR, 'intro.md'), buildIntro());
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  splitGdds();
  console.log(`[split-gdds] ${GAMES.length} jogos gerados em ${path.relative(process.cwd(), DOCS_DIR)}`);
}

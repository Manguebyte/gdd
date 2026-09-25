// Configuração do site dos GDDs (Docusaurus).
//
// POR QUE: os GDDs vivem como .md na raiz do repositório; este site só os
// apresenta. A pasta site/docs é gerada por scripts/split-gdds.mjs e não vai
// para o git.

import path from 'node:path';
import { themes as prismThemes } from 'prism-react-renderer';
import { GAMES, REPO_ROOT, splitGdds } from './scripts/split-gdds.mjs';

// Gera as páginas antes de o plugin de docs ler a pasta.
splitGdds();

// ESTRATÉGIA: em `npm start`, este plugin observa os .md da raiz. Quando um
// deles muda, regenera site/docs, e o plugin de docs recarrega a página.
function gddSourcesPlugin() {
  return {
    name: 'gdd-sources',
    getPathsToWatch() {
      return GAMES.map((g) => path.join(REPO_ROOT, g.source));
    },
    async loadContent() {
      splitGdds();
    },
  };
}

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'GDDs · Mangue Byte Games',
  tagline: 'Documentos de design dos jogos do estúdio',
  favicon: 'img/favicon.svg',

  // GitHub Pages: https://manguebyte.github.io/gdd/
  url: 'https://manguebyte.github.io',
  baseUrl: '/gdd/',
  organizationName: 'Manguebyte',
  projectName: 'gdd',
  trailingSlash: false,

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'pt-BR',
    locales: ['pt-BR'],
  },

  markdown: {
    // .md é lido como Markdown comum, não MDX: os GDDs têm `{uid}`, `<Planet>`
    // etc. no texto, que quebrariam o parser MDX.
    format: 'detect',
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: '/',
          // Sem isso, a pasta "8-bit-armageddon" perderia o "8-" (lido como ordem).
          numberPrefixParser: false,
          showLastUpdateTime: false,
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  plugins: [gddSourcesPlugin],

  themes: [
    [
      '@easyops-cn/docusaurus-search-local',
      /** @type {import('@easyops-cn/docusaurus-search-local').PluginOptions} */
      ({
        hashed: true,
        language: ['pt', 'en'],
        docsRouteBasePath: '/',
        indexBlog: false,
        highlightSearchTermsOnTargetPage: true,
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      colorMode: {
        respectPrefersColorScheme: true,
      },
      docs: {
        sidebar: {
          hideable: true,
          autoCollapseCategories: true,
        },
      },
      navbar: {
        title: 'Mangue Byte Games · GDDs',
        logo: {
          alt: 'Mangue Byte Games',
          src: 'img/favicon.svg',
        },
        items: [
          {
            href: 'https://github.com/Manguebyte/gdd',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        copyright: `© ${new Date().getFullYear()} Mangue Byte Games`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ['csharp', 'json', 'bash', 'powershell', 'yaml'],
      },
    }),
};

export default config;

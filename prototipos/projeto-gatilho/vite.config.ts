import { defineConfig } from 'vitest/config';

// base './': o build é servido em /gdd/prototipos/projeto-gatilho/ no GitHub Pages,
// então todos os caminhos dos arquivos gerados precisam ser relativos.
export default defineConfig({
  base: './',
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});

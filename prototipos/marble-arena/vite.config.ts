import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// base './': o build é servido em /gdd/prototipos/marble-arena/ no GitHub Pages,
// então todos os caminhos dos arquivos gerados precisam ser relativos.
export default defineConfig({
  base: './',
  plugins: [react()],
  // O WebAssembly do Rapier vem embutido no JS (~2 MB): o aviso de pacote grande é esperado.
  build: { chunkSizeWarningLimit: 4000 },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});

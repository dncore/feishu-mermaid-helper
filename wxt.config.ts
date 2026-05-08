import { defineConfig } from 'wxt'

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Feishu Mermaid Visual Editor',
    description: 'Visual editor for Mermaid diagrams in Feishu documents',
    version: '1.0.0',
    permissions: ['clipboardWrite'],
  },
})

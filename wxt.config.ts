import { defineConfig } from 'wxt'

// In CI, RELEASE_VERSION is set from the git tag (e.g. "v1.2.3").
// Locally it falls back to the version in package.json.
const version = (process.env.RELEASE_VERSION ?? process.env.npm_package_version ?? '0.0.0')
  .replace(/^v/, '')

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Feishu Mermaid Visual Editor',
    description: 'Visual editor for Mermaid diagrams in Feishu documents',
    version,
    permissions: ['clipboardWrite'],
  },
})

import { defineConfig } from 'wxt'
import type { Plugin } from 'vite'

// Chrome rejects content scripts that contain non-ASCII bytes (including valid
// UTF-8), so we escape everything to pure ASCII in the output bundle.
// This covers both user source and third-party code (e.g. Mermaid's U+FFFF
// sentinel and CodeMirror's U+0080 word-boundary constant).
function escapeNonAscii(): Plugin {
  return {
    name: 'escape-non-ascii',
    generateBundle(_opts, bundle) {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== 'chunk') continue
        chunk.code = chunk.code.replace(/[^\x00-\x7F]/gu, (ch) => {
          const cp = ch.codePointAt(0)!
          if (cp > 0xFFFF) {
            // Surrogate pair — safe in all string contexts, including regex.
            const hi = 0xD800 + ((cp - 0x10000) >> 10)
            const lo = 0xDC00 + ((cp - 0x10000) & 0x3FF)
            return `\\u${hi.toString(16).padStart(4, '0').toUpperCase()}\\u${lo.toString(16).padStart(4, '0').toUpperCase()}`
          }
          return `\\u${cp.toString(16).padStart(4, '0').toUpperCase()}`
        })
      }
    },
  }
}

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
  vite: () => ({
    plugins: [escapeNonAscii()],
  }),
})

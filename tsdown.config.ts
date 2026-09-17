import type { UserConfig } from 'tsdown'

const CLIENT_EXTERNALS = [
  '@deepseek-ai/dsh-client-ui-primitives',
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  'cordis',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-runtime/client',
]

const clientBundle: UserConfig = {
  entry: { client: 'src/client/index.ts' },
  outDir: 'lib',
  format: 'cjs',
  platform: 'browser',
  dts: false,
  sourcemap: true,
  clean: false,
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
  },
  deps: {
    neverBundle: [...CLIENT_EXTERNALS],
    alwaysBundle: (id: string) => !CLIENT_EXTERNALS.includes(id),
  },
  outputOptions: {
    entryFileNames: 'client.js',
    banner: '(function() {\n  var factory = function(require) {\n',
    footer: '\n    return module.exports;\n  };\n  if (typeof window !== "undefined" && window.__ModuleLoader__ && typeof window.__ModuleLoader__.load === "function") {\n    window.__ModuleLoader__.load({ id: "@dsh-external/dsh-group-chat", factory: factory });\n    window.__ModuleLoader__.load({ id: "@dsh-external/dsh-let-them-cook", factory: factory });\n  }\n})();',
    intro: 'var module = { exports: {} }; var exports = module.exports;',
    codeSplitting: false,
  },
}

export default [clientBundle] satisfies UserConfig[]

import { createRequire, registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';

// Share singleton DSH runtime packages across globally installed DSH modules.
// These packages export process-local Symbols / WeakMaps. Loading duplicate
// physical copies can make the registration side and lookup side use different
// keys, which surfaces as errors such as:
//   Cannot read properties of undefined (reading 'prepare')
const base = createRequire(join(process.env.APPDATA, 'npm/node_modules/@deepseek-ai/dsh-base/package.json'));
const canonicalPackages = new Map([
  ['@deepseek-ai/dsh-scope', base.resolve('@deepseek-ai/dsh-scope')],
  ['@deepseek-ai/dsh-tools', base.resolve('@deepseek-ai/dsh-tools')],
  ['@deepseek-ai/dsh-tools/types', base.resolve('@deepseek-ai/dsh-tools/types')],
  ['@deepseek-ai/dsh-tools/presentation', base.resolve('@deepseek-ai/dsh-tools/presentation')],
  ['@deepseek-ai/dsh-tools/invariant', base.resolve('@deepseek-ai/dsh-tools/invariant')],
]);

registerHooks({
  resolve(specifier, context, nextResolve) {
    const canonical = canonicalPackages.get(specifier);
    if (canonical) {
      return { url: pathToFileURL(canonical).href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

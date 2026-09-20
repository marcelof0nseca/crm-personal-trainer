/*
 * O Node não resolve `import './sessoes'` sem extensão (o Vite resolve). Este
 * gancho tenta `.ts` quando falta, para os scripts de validação importarem os
 * ficheiros de src/data tal como a aplicação os importa, sem escrever a
 * extensão no código da aplicação.
 *
 * Uso, no topo de um script:
 *   import { register } from 'node:module';
 *   register('./resolver-extensao-ts.mjs', import.meta.url);
 */
export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (e) {
    if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) return nextResolve(`${specifier}.ts`, context);
    throw e;
  }
}

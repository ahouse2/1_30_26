/* @vitest-environment node */
import { resolveConfig } from '../vite.resolve';

describe('Vite config', () => {
  test('includes framer-motion resolve hints', () => {
    const alias = resolveConfig.alias as Record<string, string> | undefined;
    expect(alias?.['framer-motion']).toBeTruthy();
    expect(resolveConfig.conditions).toEqual(expect.arrayContaining(['import']));
  });
});

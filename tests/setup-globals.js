/**
 * Vitest: 브라우저용 classic script(utils.js)를 jsdom 전역에 로드
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
globalThis.eval(readFileSync(resolve(root, 'scripts/utils.js'), 'utf8'));

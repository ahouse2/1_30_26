import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const resolveConfig = {
  alias: {
    '@': path.resolve(__dirname, 'src'),
    'framer-motion': path.resolve(__dirname, 'node_modules/framer-motion/dist/es/index.mjs'),
  },
  conditions: ['import', 'module', 'browser', 'default'],
};

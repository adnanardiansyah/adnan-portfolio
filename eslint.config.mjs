import { FlatCompat } from '@eslint/eslintrc';
const compat = new FlatCompat({ baseDirectory: import.meta.dirname });
const config = [
  { files: ['**/*.{js,jsx,mjs}'] },
  { ignores: ['.next/**', 'node_modules/**', 'scripts/**'] },
  ...compat.extends('next/core-web-vitals'),
];
export default config;

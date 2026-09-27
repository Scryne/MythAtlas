import nextVitals from 'eslint-config-next/core-web-vitals';

const config = [
  ...nextVitals,
  {
    rules: {
      '@next/next/no-img-element': 'off',
      'react/no-unescaped-entities': 'off',
      // React Compiler kuralları (eslint-plugin-react-hooks 7) Next 16 ile geldi; uygulama
      // Compiler kullanmıyor. Mevcut ihlaller borç olarak görünür kalsın, derlemeyi kesmesin.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
    },
  },
  {
    ignores: ['.next/**', 'node_modules/**', 'public/**', 'qa/reports/**', 'next-env.d.ts'],
  },
];

export default config;

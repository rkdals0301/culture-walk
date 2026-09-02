import nextVitals from 'eslint-config-next/core-web-vitals';

const config = [
  {
    ignores: [
      '.next/**',
      '.open-next/**',
      '.wrangler/**',
      '.playwright-cli/**',
      '.playwright-mcp/**',
      '.agents/**',
      'output/**',
      'node_modules/**',
      'coverage/**',
      'dist/**',
      'worker-configuration.d.ts',
    ],
  },
  ...nextVitals,
  {
    rules: {
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/incompatible-library': 'off',
    },
  },
];

export default config;

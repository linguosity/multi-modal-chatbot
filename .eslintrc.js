// Use Next.js default ESLint config with relaxed rules
module.exports = {
  extends: [
    'next/core-web-vitals'
  ],
  rules: {
    // Relax strict rules for cleanup phase
    'react/no-unescaped-entities': 'warn',
    'jsx-a11y/alt-text': 'warn',
    '@next/next/no-img-element': 'warn',
    '@next/next/no-html-link-for-pages': 'warn',
    'react-hooks/exhaustive-deps': 'warn'
  },
  ignorePatterns: [
    'node_modules',
    '.next',
    'dist',
    'build'
  ]
};
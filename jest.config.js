module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.test.[jt]s?(x)'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/e2e/',
    '<rootDir>/.next/',
    '<rootDir>/build/',
    '<rootDir>/dist/',
    '<rootDir>/playwright-report/',
    '<rootDir>/test-results/'
  ],
  moduleNameMapper: {
    '^@supabase/ssr$': '<rootDir>/tests/__mocks__/@supabase/ssr.ts',
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}'
  ],
  verbose: true,
  watchPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/test-results/',
    '<rootDir>/playwright-report/'
  ]
};
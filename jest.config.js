module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.test.[jt]s?(x)'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/e2e/'
  ],
  moduleNameMapper: {
    '^@supabase/ssr$': '<rootDir>/tests/__mocks__/@supabase/ssr.ts',
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.ts'],
};
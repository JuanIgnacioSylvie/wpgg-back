module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin', 'import'],
  extends: [
    'plugin:@typescript-eslint/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json',
      },
    },
  },
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
  },
  overrides: [
    // ─── Rule 1: Domain layer isolation (Requirement 10.1) ──────────────────────
    // No file in */domain/** may import @prisma/client, axios, bcrypt, or @nestjs/*
    // Exception: @nestjs/common is allowed ONLY for HttpException and HttpStatus
    {
      files: ['**/domain/**/*.ts'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['@prisma/client'],
                message:
                  'Domain layer must not import @prisma/client. Use domain interfaces instead. (Requirement 10.1)',
              },
              {
                group: ['axios', 'axios/*'],
                message:
                  'Domain layer must not import axios. Use domain service interfaces instead. (Requirement 10.1)',
              },
              {
                group: ['bcrypt', 'bcryptjs'],
                message:
                  'Domain layer must not import bcrypt. Use IHashProvider interface instead. (Requirement 10.1)',
              },
              {
                group: [
                  '@nestjs/core',
                  '@nestjs/jwt',
                  '@nestjs/config',
                  '@nestjs/throttler',
                  '@nestjs/cache-manager',
                  '@nestjs/platform-express',
                  '@nestjs/testing',
                  '@nestjs/schematics',
                  '@nestjs/cli',
                ],
                message:
                  'Domain layer must not import NestJS framework packages. Only @nestjs/common (HttpException, HttpStatus) is permitted. (Requirement 10.1)',
              },
            ],
          },
        ],
        // Prevent domain from importing infrastructure via relative paths
        'import/no-restricted-paths': [
          'error',
          {
            basePath: __dirname,
            zones: [
              {
                target: './src/modules/auth/domain',
                from: './src/modules/auth/infrastructure',
                message:
                  'Domain layer must not import from infrastructure layer. (Requirement 10.1)',
              },
              {
                target: './src/modules/riot/domain',
                from: './src/modules/riot/infrastructure',
                message:
                  'Domain layer must not import from infrastructure layer. (Requirement 10.1)',
              },
              {
                target: './src/modules/ddragon/domain',
                from: './src/modules/ddragon/infrastructure',
                message:
                  'Domain layer must not import from infrastructure layer. (Requirement 10.1)',
              },
            ],
          },
        ],
      },
    },

    // ─── Rule 2: Application layer must NOT import infrastructure (Requirement 10.2) ─
    {
      files: ['**/application/**/*.ts'],
      rules: {
        'import/no-restricted-paths': [
          'error',
          {
            basePath: __dirname,
            zones: [
              {
                target: './src/modules/auth/application',
                from: './src/modules/auth/infrastructure',
                message:
                  'Application layer must not import from infrastructure layer. Use domain interfaces instead. (Requirement 10.2)',
              },
              {
                target: './src/modules/riot/application',
                from: './src/modules/riot/infrastructure',
                message:
                  'Application layer must not import from infrastructure layer. Use domain interfaces instead. (Requirement 10.2)',
              },
              {
                target: './src/modules/ddragon/application',
                from: './src/modules/ddragon/infrastructure',
                message:
                  'Application layer must not import from infrastructure layer. Use domain interfaces instead. (Requirement 10.2)',
              },
            ],
          },
        ],
      },
    },
  ],
};

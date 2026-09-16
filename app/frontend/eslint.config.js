import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import prettier from 'eslint-config-prettier'

export default tseslint.config(
  { ignores: ['dist', 'node_modules', '*.config.js'] },
  js.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  reactHooks.configs.flat.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-refresh': reactRefresh,
    },
    rules: {
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // revisar: react-router v7 tipa navigate() como Promise<void> y los efectos
      // hacen fetch fire-and-forget cuyos errores ya se capturan dentro del loader.
      // Arreglo: `void navigate(...)` / `void loadX()` en 11 llamadas.
      '@typescript-eslint/no-floating-promises': 'off',

      // revisar: regla del React Compiler. El código carga datos en useEffect
      // (setState al resolver la promesa); satisfacerla exige Suspense o una
      // librería de data-fetching. 6 avisos.
      'react-hooks/set-state-in-effect': 'off',

      // Se mantiene activa, solo se excluyen los atributos JSX: pasar handlers
      // async a onClick/onSubmit es el patrón normal en React.
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
    },
  },
  {
    // revisar: única frontera sin tipar de la app. `res.json()` devuelve `any`
    // y aquí se leen message/details para construir el ApiError. Arreglo: tipar
    // el body (`as { message?: string; details?: ZodErrorDetails }`).
    files: ['src/services/api.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
    },
  },
  prettier,
)

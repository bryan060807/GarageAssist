import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';
import eslintJs from '@eslint/js';

export default [
  eslintJs.configs.recommended,
  {
    ignores: ['dist/**/*']
  },
  firebaseRulesPlugin.configs['flat/recommended']
];

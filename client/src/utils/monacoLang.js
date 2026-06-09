/*
 Maps app language IDs → Monaco Editor language IDs.

   cpp    → 'c'       (C and C++ share the same tokenizer in Monaco)
    kotlin → 'java'        (Java tokenizer works well for Kotlin)
    swift  → 'objective-c' (similar C-family syntax)
 */
export const MONACO_LANG_MAP = {
  javascript: 'javascript',
  typescript: 'typescript',
  json:       'json',
  html:       'html',
  css:        'css',
  python:     'python',
  java:       'java',
  c:          'c',
  cpp:        'c',          // C tokenizer covers C++ syntax perfectly
  csharp:     'csharp',
  go:         'go',
  rust:       'rust',
  php:        'php',
  ruby:       'ruby',
  swift:      'swift',
  kotlin:     'kotlin',
  sql:        'sql',
  bash:       'shell',
  yaml:       'yaml',
  markdown:   'markdown',
  plaintext:  'plaintext',
};

/*
Returns the Monaco language ID for a given app language.
Falls back to 'plaintext' for any unknown language.
*/
export const getMonacoLang = (lang) => MONACO_LANG_MAP[lang] ?? 'plaintext';

// vite/client is loaded through tsconfig "types"; this augments its ImportMetaEnv.
// Every VITE_* variable the app reads is declared here so import.meta.env stays typed.
// src/config/env.ts validates the values. Add each variable there and to .env.example too.
interface ImportMetaEnv {
  readonly VITE_APP_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

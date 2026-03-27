/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_SOCKET_URL: string;
  readonly VITE_AI_MODULE3_SUMMARY_API: string;
  readonly VITE_WORD_CLOUD_API: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

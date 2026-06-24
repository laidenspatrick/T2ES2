/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REPORT_SERVICE_URL: string;
  readonly VITE_DEV_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

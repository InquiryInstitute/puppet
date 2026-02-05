/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GIT_COMMIT: string
}

declare module '*.xml?raw' {
  const src: string
  export default src
}

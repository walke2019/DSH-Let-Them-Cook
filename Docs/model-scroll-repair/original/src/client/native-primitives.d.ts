declare module '@deepseek-ai/dsh-client-ui-primitives' {
  import type {ComponentType} from 'react'
  /** Host-provided renderer, also used by the official conversation view. */
  export const MarkdownText: ComponentType<{text:string}>
}

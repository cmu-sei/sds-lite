declare module 'react' {
  export interface HTMLAttributes<Element> {
    id?: string
    ref?: Element | null
  }

  export type DetailedHTMLProps<Attributes, Element> = Attributes & {
    ref?: Element | null
  }

  export namespace JSX {
    interface IntrinsicElements {}
  }
}

declare module 'vue' {
  export interface DefineComponent<Props> {
    new (): { $props: Props }
  }

  export interface GlobalComponents {}
}

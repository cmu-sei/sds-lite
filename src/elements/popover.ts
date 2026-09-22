import {
  FloatingHoverController,
  FloatingPositioner,
} from './floating.js'
import {
  defineCustomElement,
  defaultButtonType,
  directElementChildren,
  ElementConnection,
  ensureId,
  readNumberAttribute,
  reflectBooleanAttribute,
  reflectNumberAttribute,
  reflectStringAttribute,
} from './internals.js'
import type {
  SdsPlacement,
  SdsToggleDetail,
  SdsWidth,
} from '../generated/interface.js'

const HTMLElementBase: typeof HTMLElement =
  typeof HTMLElement === 'undefined'
    ? (class {} as typeof HTMLElement)
    : HTMLElement

export class SdsPopoverElement extends HTMLElementBase {
  static observedAttributes = ['open', 'placement', 'offset']

  private content: HTMLElement | null = null
  private positioner: FloatingPositioner | null = null
  private hoverController: FloatingHoverController | null = null
  private connection = new ElementConnection()

  get open(): boolean {
    return this.hasAttribute('open')
  }

  set open(value: boolean) {
    reflectBooleanAttribute(this, 'open', value)
  }

  get placement(): SdsPlacement {
    return (this.getAttribute('placement') ??
      'block-end-start') as SdsPlacement
  }

  set placement(value: SdsPlacement) {
    reflectStringAttribute(this, 'placement', value)
  }

  get offset(): number {
    return readNumberAttribute(this, 'offset', 9)
  }

  set offset(value: number) {
    reflectNumberAttribute(this, 'offset', value)
  }

  get width(): SdsWidth {
    return (this.getAttribute('width') ?? 'md') as SdsWidth
  }

  set width(value: SdsWidth) {
    reflectStringAttribute(this, 'width', value)
  }

  connectedCallback(): void {
    this.hoverController?.disconnect()
    this.hoverController = null
    this.positioner = null
    this.content = null
    const signal = this.connection.connect(
      this,
      () => this.connectedCallback(),
      { childList: true },
    )

    const children = directElementChildren(this)
    const trigger = children.find(
      (child): child is HTMLButtonElement =>
        child instanceof HTMLButtonElement,
    )
    const requestedContentId = trigger?.getAttribute('popovertarget')
    const remainingChildren = children.filter((child) => child !== trigger)
    const content =
      children.find((child) => child.id === requestedContentId) ??
      remainingChildren.find((child) =>
        child.matches('[popover], .sds-popover-content'),
      ) ??
      (remainingChildren.length === 1 ? remainingChildren[0] : null) ??
      null

    if (!trigger || !content) {
      console.warn(
        '<sds-popover> requires one direct child button and one direct child content element.',
      )
      return
    }

    defaultButtonType(trigger)
    const contentId = ensureId(content, 'sds-popover')
    content.classList.add('sds-popover-content')
    content.setAttribute('popover', content.getAttribute('popover') || 'auto')
    trigger.setAttribute('popovertarget', contentId)
    this.content = content

    this.positioner = new FloatingPositioner(
      trigger,
      content,
      () => this.placement,
      () => this.getAttribute('offset') ?? undefined,
      9,
    )
    this.hoverController = new FloatingHoverController(
      trigger,
      content,
      this.positioner,
      {
        focusOpenDelay: 500,
        hoverOpenDelay: 500,
      },
    )
    this.hoverController.observe(signal)
    this.positioner.observe(signal)
    content.addEventListener('toggle', this.handleToggle, { signal })
    if (this.open) this.show()
  }

  disconnectedCallback(): void {
    this.connection.disconnect()
    this.hoverController?.disconnect()
    this.hoverController = null
    this.positioner = null
    this.content = null
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ): void {
    if (oldValue === newValue || !this.isConnected) return
    if (name === 'open') {
      if (newValue === null) this.hide()
      else this.show()
      return
    }
    if (this.content?.matches(':popover-open')) {
      this.positioner?.reset()
      this.positioner?.position()
    }
  }

  show(): void {
    if (!this.content) {
      this.open = true
      return
    }
    if (!this.content.matches(':popover-open')) {
      this.content.showPopover()
    }
  }

  hide(): void {
    if (!this.content) {
      this.open = false
      return
    }
    if (this.content.matches(':popover-open')) this.content.hidePopover()
  }

  private handleToggle = (): void => {
    const open = this.content?.matches(':popover-open') ?? false
    reflectBooleanAttribute(this, 'open', open)
    this.dispatchEvent(
      new CustomEvent<SdsToggleDetail>('sds-toggle', {
        bubbles: true,
        composed: true,
        detail: { open },
      }),
    )
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sds-popover': SdsPopoverElement
  }

  interface HTMLElementEventMap {
    'sds-toggle': CustomEvent<SdsToggleDetail>
  }
}

export function registerSdsPopover(): void {
  defineCustomElement('sds-popover', SdsPopoverElement)
}

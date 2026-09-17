import {
  FloatingHoverController,
  FloatingPositioner,
} from './floating.js'
import {
  defineCustomElement,
  directElementChildren,
  ensureId,
} from './internals.js'

const HTMLElementBase: typeof HTMLElement =
  typeof HTMLElement === 'undefined'
    ? (class {} as typeof HTMLElement)
    : HTMLElement

export class SdsPopoverElement extends HTMLElementBase {
  private positioner: FloatingPositioner | null = null
  private hoverController: FloatingHoverController | null = null
  private controller: AbortController | null = null
  private observer: MutationObserver | null = null

  connectedCallback(): void {
    this.controller?.abort()
    this.observer?.disconnect()
    this.hoverController?.disconnect()
    this.controller = new AbortController()
    this.observer = new MutationObserver(() => this.connectedCallback())
    this.observer.observe(this, { childList: true })

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
        this,
      )
      return
    }

    const contentId = ensureId(content, 'sds-popover')
    content.classList.add('sds-popover-content')
    content.setAttribute('popover', content.getAttribute('popover') || 'auto')
    trigger.setAttribute('popovertarget', contentId)

    this.positioner = new FloatingPositioner(
      trigger,
      content,
      () => this.dataset.placement ?? 'block-end-start',
      () => this.dataset.offset,
      10,
    )
    this.hoverController = new FloatingHoverController(
      trigger,
      content,
      this.positioner,
      {
        focusOpenDelay: 300,
      },
    )
    this.hoverController.observe(this.controller.signal)
    this.positioner.observe(this.controller.signal)
  }

  disconnectedCallback(): void {
    this.controller?.abort()
    this.observer?.disconnect()
    this.hoverController?.disconnect()
    this.hoverController = null
    this.positioner = null
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sds-popover': SdsPopoverElement
  }
}

export function registerSdsPopover(): void {
  defineCustomElement('sds-popover', SdsPopoverElement)
}

import { FloatingPositioner } from './floating.js'
import { directElementChildren, ensureId } from './internals.js'

const HTMLElementBase: typeof HTMLElement =
  typeof HTMLElement === 'undefined'
    ? (class {} as typeof HTMLElement)
    : HTMLElement

const hoverOpenDelay = 500
const hoverCloseDelay = 250

export class SdsPopoverElement extends HTMLElementBase {
  private trigger: HTMLButtonElement | null = null
  private content: HTMLElement | null = null
  private positioner: FloatingPositioner | null = null
  private controller: AbortController | null = null
  private openTimer: ReturnType<typeof setTimeout> | null = null
  private closeTimer: ReturnType<typeof setTimeout> | null = null
  private pointerInside = false

  connectedCallback(): void {
    this.controller?.abort()
    this.clearTimers()
    this.controller = new AbortController()

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
    content.setAttribute('popover', 'manual')
    trigger.removeAttribute('popovertarget')
    trigger.setAttribute('aria-controls', contentId)
    trigger.setAttribute(
      'aria-expanded',
      String(content.matches(':popover-open')),
    )
    if (!trigger.hasAttribute('aria-haspopup')) {
      trigger.setAttribute('aria-haspopup', 'dialog')
    }

    this.trigger = trigger
    this.content = content
    this.positioner = new FloatingPositioner(
      trigger,
      content,
      () => this.dataset.placement ?? 'bottom-start',
      () => this.dataset.offset,
      10,
    )

    trigger.addEventListener('pointerenter', this.handlePointerEnter, {
      signal: this.controller.signal,
    })
    trigger.addEventListener('pointerleave', this.handlePointerLeave, {
      signal: this.controller.signal,
    })
    content.addEventListener('pointerenter', this.handlePointerEnter, {
      signal: this.controller.signal,
    })
    content.addEventListener('pointerleave', this.handlePointerLeave, {
      signal: this.controller.signal,
    })
    this.addEventListener('focusin', this.handleFocusIn, {
      signal: this.controller.signal,
    })
    this.addEventListener('focusout', this.handleFocusOut, {
      signal: this.controller.signal,
    })
    document.addEventListener('keydown', this.handleKeydown, {
      signal: this.controller.signal,
    })
    document.addEventListener('pointerdown', this.handleDocumentPointerDown, {
      capture: true,
      signal: this.controller.signal,
    })
    content.addEventListener('beforetoggle', this.handleBeforeToggle, {
      signal: this.controller.signal,
    })
    content.addEventListener('toggle', this.handleToggle, {
      signal: this.controller.signal,
    })
    this.positioner.observe(this.controller.signal)
  }

  disconnectedCallback(): void {
    this.controller?.abort()
    this.clearTimers()
    this.positioner = null
  }

  private isOpen(): boolean {
    return this.content?.matches(':popover-open') ?? false
  }

  private clearTimers(): void {
    if (this.openTimer !== null) clearTimeout(this.openTimer)
    if (this.closeTimer !== null) clearTimeout(this.closeTimer)
    this.openTimer = null
    this.closeTimer = null
  }

  private show(): void {
    this.openTimer = null
    if (!this.content || this.isOpen()) return
    this.positioner?.reset()
    this.content.showPopover()
    this.positioner?.position()
  }

  private scheduleOpen(delay: number): void {
    if (this.closeTimer !== null) clearTimeout(this.closeTimer)
    this.closeTimer = null
    if (this.isOpen() || this.openTimer !== null) return
    this.openTimer = setTimeout(() => this.show(), delay)
  }

  private scheduleClose(): void {
    if (this.openTimer !== null) clearTimeout(this.openTimer)
    this.openTimer = null
    if (!this.isOpen() || this.closeTimer !== null) return
    this.closeTimer = setTimeout(() => {
      this.closeTimer = null
      if (
        !this.pointerInside &&
        !this.contains(document.activeElement)
      ) {
        this.content?.hidePopover()
      }
    }, hoverCloseDelay)
  }

  private handlePointerEnter = (): void => {
    this.pointerInside = true
    this.scheduleOpen(hoverOpenDelay)
  }

  private handlePointerLeave = (): void => {
    this.pointerInside = false
    this.scheduleClose()
  }

  private handleFocusIn = (): void => {
    this.scheduleOpen(0)
  }

  private handleFocusOut = (): void => {
    this.scheduleClose()
  }

  private handleKeydown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape' || !this.isOpen()) return
    event.preventDefault()
    this.clearTimers()
    const restoreFocus = this.content?.contains(document.activeElement)
    this.content?.hidePopover()
    if (restoreFocus) this.trigger?.focus()
  }

  private handleDocumentPointerDown = (event: PointerEvent): void => {
    if (
      !this.isOpen() ||
      !(event.target instanceof Node) ||
      this.contains(event.target)
    ) {
      return
    }
    this.clearTimers()
    this.content?.hidePopover()
  }

  private handleBeforeToggle = (event: ToggleEvent): void => {
    if (event.newState === 'open') this.positioner?.reset()
    this.trigger?.setAttribute(
      'aria-expanded',
      String(event.newState === 'open'),
    )
  }

  private handleToggle = (): void => {
    if (this.isOpen()) {
      this.positioner?.position()
    } else {
      this.positioner?.reset()
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sds-popover': SdsPopoverElement
  }
}

export function registerSdsPopover(): void {
  if (
    typeof customElements !== 'undefined' &&
    !customElements.get('sds-popover')
  ) {
    customElements.define('sds-popover', SdsPopoverElement)
  }
}

registerSdsPopover()

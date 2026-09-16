import { FloatingPositioner } from './floating.js'
import { directElementChildren, ensureId } from './internals.js'

const HTMLElementBase: typeof HTMLElement =
  typeof HTMLElement === 'undefined'
    ? (class {} as typeof HTMLElement)
    : HTMLElement

const hoverOpenDelay = 0
const closeDelay = 0

export class SdsTooltipElement extends HTMLElementBase {
  private trigger: HTMLElement | null = null
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
    const content =
      children.find((child) =>
        child.matches('[role="tooltip"], .sds-tooltip-content, [popover]'),
      ) ??
      (children.length === 2 ? children[1] : null) ??
      null
    const trigger = children.find((child) => child !== content) ?? null

    if (!trigger || !content) {
      console.warn(
        '<sds-tooltip> requires one direct child trigger and one direct child text element.',
        this,
      )
      return
    }

    const contentId = ensureId(content, 'sds-tooltip')
    const descriptions = new Set(
      (trigger.getAttribute('aria-describedby') ?? '')
        .split(/\s+/)
        .filter(Boolean),
    )
    descriptions.add(contentId)

    content.classList.add('sds-tooltip-content')
    content.setAttribute('role', 'tooltip')
    content.setAttribute('popover', 'manual')
    trigger.setAttribute('aria-describedby', [...descriptions].join(' '))

    this.trigger = trigger
    this.content = content
    this.positioner = new FloatingPositioner(
      trigger,
      content,
      () => this.dataset.placement ?? 'top',
      () => this.dataset.offset,
      10,
    )

    trigger.addEventListener('pointerenter', this.handlePointerEnter, {
      signal: this.controller.signal,
    })
    trigger.addEventListener('pointerleave', this.handlePointerLeave, {
      signal: this.controller.signal,
    })
    trigger.addEventListener('focusin', this.handleFocusIn, {
      signal: this.controller.signal,
    })
    trigger.addEventListener('focusout', this.handleFocusOut, {
      signal: this.controller.signal,
    })
    document.addEventListener('keydown', this.handleKeydown, {
      signal: this.controller.signal,
    })
    content.addEventListener('pointerenter', this.handlePointerEnter, {
      signal: this.controller.signal,
    })
    content.addEventListener('pointerleave', this.handlePointerLeave, {
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
        !this.trigger?.contains(document.activeElement)
      ) {
        this.content?.hidePopover()
      }
    }, closeDelay)
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
    this.content?.hidePopover()
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
    'sds-tooltip': SdsTooltipElement
  }
}

export function registerSdsTooltip(): void {
  if (
    typeof customElements !== 'undefined' &&
    !customElements.get('sds-tooltip')
  ) {
    customElements.define('sds-tooltip', SdsTooltipElement)
  }
}

registerSdsTooltip()

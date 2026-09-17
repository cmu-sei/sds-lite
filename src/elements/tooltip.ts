import {
  FloatingHoverController,
  FloatingPositioner,
} from './floating.js'
import {
  defineCustomElement,
  directElementChildren,
  ElementConnection,
  ensureId,
} from './internals.js'

const HTMLElementBase: typeof HTMLElement =
  typeof HTMLElement === 'undefined'
    ? (class {} as typeof HTMLElement)
    : HTMLElement

export class SdsTooltipElement extends HTMLElementBase {
  private positioner: FloatingPositioner | null = null
  private hoverController: FloatingHoverController | null = null
  private connection = new ElementConnection()

  connectedCallback(): void {
    this.hoverController?.disconnect()
    const signal = this.connection.connect(
      this,
      () => this.connectedCallback(),
      { childList: true },
    )

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

    this.positioner = new FloatingPositioner(
      trigger,
      content,
      () => this.dataset.placement ?? 'block-start',
      () => this.dataset.offset,
      6,
    )
    this.hoverController = new FloatingHoverController(
      trigger,
      content,
      this.positioner,
      {
        closeDelay: 0,
        hoverOpenDelay: 0,
      },
    )
    this.hoverController.observe(signal)
    this.positioner.observe(signal)
  }

  disconnectedCallback(): void {
    this.connection.disconnect()
    this.hoverController?.disconnect()
    this.hoverController = null
    this.positioner = null
  }
}
declare global {
  interface HTMLElementTagNameMap {
    'sds-tooltip': SdsTooltipElement
  }
}

export function registerSdsTooltip(): void {
  defineCustomElement('sds-tooltip', SdsTooltipElement)
}

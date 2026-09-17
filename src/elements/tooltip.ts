import {
  FloatingHoverController,
  FloatingPositioner,
} from './floating.js'
import {
  defineCustomElement,
  directElementChildren,
  ElementConnection,
  ensureId,
  readNumberAttribute,
  reflectNumberAttribute,
  reflectStringAttribute,
} from './internals.js'
import type { SdsPlacement } from '../generated/interface.js'

const HTMLElementBase: typeof HTMLElement =
  typeof HTMLElement === 'undefined'
    ? (class {} as typeof HTMLElement)
    : HTMLElement

export class SdsTooltipElement extends HTMLElementBase {
  static observedAttributes = ['placement', 'offset']

  private content: HTMLElement | null = null
  private positioner: FloatingPositioner | null = null
  private hoverController: FloatingHoverController | null = null
  private connection = new ElementConnection()

  get placement(): SdsPlacement {
    return (this.getAttribute('placement') ?? 'block-start') as SdsPlacement
  }

  set placement(value: SdsPlacement) {
    reflectStringAttribute(this, 'placement', value)
  }

  get offset(): number {
    return readNumberAttribute(this, 'offset', 6)
  }

  set offset(value: number) {
    reflectNumberAttribute(this, 'offset', value)
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
    this.content = content

    this.positioner = new FloatingPositioner(
      trigger,
      content,
      () => this.placement,
      () => this.getAttribute('offset') ?? undefined,
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
    this.content = null
  }

  attributeChangedCallback(
    _name: string,
    oldValue: string | null,
    newValue: string | null,
  ): void {
    if (
      oldValue !== newValue &&
      this.isConnected &&
      this.content?.matches(':popover-open')
    ) {
      this.positioner?.reset()
      this.positioner?.position()
    }
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

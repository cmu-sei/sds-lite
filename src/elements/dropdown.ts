import { FloatingPositioner } from './floating.js'
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

export class SdsDropdownElement extends HTMLElementBase {
  static observedAttributes = ['open', 'placement', 'offset']

  private trigger: HTMLButtonElement | null = null
  private menu: HTMLElement | null = null
  private items: HTMLElement[] = []
  private positioner: FloatingPositioner | null = null
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
    return readNumberAttribute(this, 'offset', 5)
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

  get hideCaret(): boolean {
    return this.hasAttribute('hide-caret')
  }

  set hideCaret(value: boolean) {
    reflectBooleanAttribute(this, 'hide-caret', value)
  }

  connectedCallback(): void {
    this.positioner = null
    this.trigger = null
    this.menu = null
    this.items = []
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
    const requestedMenuId = trigger?.getAttribute('popovertarget')
    const remainingChildren = children.filter((child) => child !== trigger)
    const menu =
      children.find((child) => child.id === requestedMenuId) ??
      remainingChildren.find((child) =>
        child.matches('menu, [popover], .sds-dropdown-menu'),
      ) ??
      (remainingChildren.length === 1 ? remainingChildren[0] : null) ??
      null

    if (!trigger || !menu) {
      console.warn(
        '<sds-dropdown> requires one direct child button and one direct child menu or popover.',
      )
      return
    }

    defaultButtonType(trigger)
    const menuId = ensureId(menu, 'sds-dropdown')
    menu.classList.add('sds-dropdown-menu')
    menu.setAttribute('popover', menu.getAttribute('popover') || 'auto')
    trigger.setAttribute('popovertarget', menuId)
    trigger.setAttribute('aria-controls', menuId)
    trigger.setAttribute(
      'aria-expanded',
      String(menu.matches(':popover-open')),
    )
    if (!trigger.hasAttribute('aria-haspopup')) {
      trigger.setAttribute('aria-haspopup', 'menu')
    }

    menu.setAttribute('role', 'menu')
    if (!menu.hasAttribute('aria-orientation')) {
      menu.setAttribute('aria-orientation', 'vertical')
    }

    this.trigger = trigger
    this.menu = menu
    this.positioner = new FloatingPositioner(
      trigger,
      menu,
      () => this.placement,
      () => this.getAttribute('offset') ?? undefined,
    )
    this.collectItems()

    trigger.addEventListener('keydown', this.handleTriggerKeydown, {
      signal,
    })
    menu.addEventListener('beforetoggle', this.handleBeforeToggle, {
      signal,
    })
    menu.addEventListener('toggle', this.handleToggle, {
      signal,
    })
    menu.addEventListener('keydown', this.handleMenuKeydown, {
      signal,
    })
    menu.addEventListener('click', this.handleMenuClick, {
      signal,
    })
    this.positioner.observe(signal)
    if (this.open) this.show()
  }

  disconnectedCallback(): void {
    this.connection.disconnect()
    this.positioner = null
    this.trigger = null
    this.menu = null
    this.items = []
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
    if (this.isSurfaceOpen()) {
      this.positioner?.reset()
      this.positioner?.position()
    }
  }

  show(): void {
    if (!this.menu) {
      this.open = true
      return
    }
    if (this.isSurfaceOpen()) return

    this.collectItems()
    this.positioner?.reset()
    this.menu.showPopover()
    this.positioner?.position()
  }

  hide(): void {
    if (!this.menu) {
      this.open = false
      return
    }
    if (!this.isSurfaceOpen()) return
    this.menu.hidePopover()
  }

  private isSurfaceOpen(): boolean {
    return this.menu?.matches(':popover-open') ?? false
  }

  private collectItems(): void {
    if (!this.menu) {
      this.items = []
      return
    }

    for (const item of this.menu.querySelectorAll(':scope > li')) {
      if (!item.hasAttribute('role')) item.setAttribute('role', 'none')
    }

    this.items = Array.from(
      this.menu.querySelectorAll<HTMLElement>(
        'button, a[href], [role="menuitem"]',
      ),
    )
      .filter((item) => !item.closest('[role="menuitem"] [role="menuitem"]'))
      .map((item) => {
        item.setAttribute('role', 'menuitem')
        item.tabIndex = -1
        return item
      })
      .filter(
        (item) =>
          (!(item instanceof HTMLButtonElement) || !item.disabled),
      )
  }

  private showAndFocus(focusIndex = 0): void {
    this.show()
    this.items[focusIndex]?.focus()
  }

  private hideAndRestoreFocus(): void {
    this.hide()
    this.trigger?.focus()
  }

  private handleToggle = (): void => {
    const open = this.isSurfaceOpen()
    reflectBooleanAttribute(this, 'open', open)
    if (open) {
      this.positioner?.position()
    } else {
      this.positioner?.reset()
    }
    this.dispatchEvent(
      new CustomEvent<SdsToggleDetail>('sds-toggle', {
        bubbles: true,
        composed: true,
        detail: { open },
      }),
    )
  }

  private handleBeforeToggle = (event: ToggleEvent): void => {
    if (event.newState === 'open') {
      this.collectItems()
      this.positioner?.reset()
    }
    this.trigger?.setAttribute(
      'aria-expanded',
      String(event.newState === 'open'),
    )
  }

  private handleTriggerKeydown = (event: KeyboardEvent): void => {
    const focusIndex =
      event.key === 'ArrowUp' ? this.items.length - 1 : 0
    const opensMenu =
      event.key === 'ArrowDown' ||
      event.key === 'ArrowUp' ||
      event.key === 'Enter' ||
      event.key === ' '

    if (!opensMenu) return

    event.preventDefault()
    if (this.isSurfaceOpen()) {
      this.items[focusIndex]?.focus()
    } else {
      this.showAndFocus(focusIndex)
    }
  }

  private handleMenuKeydown = (event: KeyboardEvent): void => {
    this.collectItems()
    const currentIndex = this.items.findIndex(
      (item) => item === document.activeElement,
    )
    let nextIndex: number | null = null

    if (event.key === 'ArrowDown') {
      nextIndex = (currentIndex + 1) % this.items.length
    } else if (event.key === 'ArrowUp') {
      nextIndex = (currentIndex - 1 + this.items.length) % this.items.length
    } else if (event.key === 'Home') {
      nextIndex = 0
    } else if (event.key === 'End') {
      nextIndex = this.items.length - 1
    } else if (event.key === 'Escape') {
      event.preventDefault()
      this.hideAndRestoreFocus()
      return
    }

    if (nextIndex === null || this.items.length === 0) return
    event.preventDefault()
    this.items[nextIndex].focus()
  }

  private handleMenuClick = (event: MouseEvent): void => {
    if (!(event.target instanceof Element)) return
    const item = event.target.closest<HTMLElement>('[role="menuitem"]')
    if (!item) return
    if (
      item.getAttribute('aria-disabled') === 'true' ||
      (item instanceof HTMLButtonElement && item.disabled)
    ) {
      event.preventDefault()
      return
    }
    this.hide()
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sds-dropdown': SdsDropdownElement
  }

  interface HTMLElementEventMap {
    'sds-toggle': CustomEvent<SdsToggleDetail>
  }
}

export function registerSdsDropdown(): void {
  defineCustomElement('sds-dropdown', SdsDropdownElement)
}

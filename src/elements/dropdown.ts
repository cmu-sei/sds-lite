import { FloatingPositioner } from './floating.js'
import {
  defineCustomElement,
  directElementChildren,
  ensureId,
} from './internals.js'

const HTMLElementBase: typeof HTMLElement =
  typeof HTMLElement === 'undefined'
    ? (class {} as typeof HTMLElement)
    : HTMLElement

export class SdsDropdownElement extends HTMLElementBase {
  private trigger: HTMLButtonElement | null = null
  private menu: HTMLElement | null = null
  private items: HTMLElement[] = []
  private positioner: FloatingPositioner | null = null
  private controller: AbortController | null = null
  private observer: MutationObserver | null = null

  connectedCallback(): void {
    this.controller?.abort()
    this.observer?.disconnect()
    this.controller = new AbortController()
    this.observer = new MutationObserver(() => this.connectedCallback())
    this.observer.observe(this, { childList: true })

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
        this,
      )
      return
    }

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
      () => this.dataset.placement ?? 'block-end-start',
      () => this.dataset.offset,
    )
    this.collectItems()

    trigger.addEventListener('keydown', this.handleTriggerKeydown, {
      signal: this.controller.signal,
    })
    menu.addEventListener('beforetoggle', this.handleBeforeToggle, {
      signal: this.controller.signal,
    })
    menu.addEventListener('toggle', this.handleToggle, {
      signal: this.controller.signal,
    })
    menu.addEventListener('keydown', this.handleMenuKeydown, {
      signal: this.controller.signal,
    })
    menu.addEventListener('click', this.handleMenuClick, {
      signal: this.controller.signal,
    })
    this.positioner.observe(this.controller.signal)
  }

  disconnectedCallback(): void {
    this.controller?.abort()
    this.observer?.disconnect()
    this.positioner = null
  }

  private isOpen(): boolean {
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
          item.getAttribute('aria-disabled') !== 'true' &&
          (!(item instanceof HTMLButtonElement) || !item.disabled),
      )
  }

  private open(focusIndex = 0): void {
    if (!this.menu || this.isOpen()) return

    this.collectItems()
    this.positioner?.reset()
    this.menu.showPopover()
    this.positioner?.position()
    this.items[focusIndex]?.focus()
  }

  private close(restoreFocus = false): void {
    if (!this.menu || !this.isOpen()) return

    this.menu.hidePopover()
    if (restoreFocus) this.trigger?.focus()
  }

  private handleToggle = (): void => {
    if (this.isOpen()) {
      this.positioner?.position()
    } else {
      this.positioner?.reset()
    }
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
    if (this.isOpen()) {
      this.items[focusIndex]?.focus()
    } else {
      this.open(focusIndex)
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
      this.close(true)
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
    this.close()
  }

}

declare global {
  interface HTMLElementTagNameMap {
    'sds-dropdown': SdsDropdownElement
  }
}

export function registerSdsDropdown(): void {
  defineCustomElement('sds-dropdown', SdsDropdownElement)
}

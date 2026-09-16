const HTMLElementBase: typeof HTMLElement =
  typeof HTMLElement === 'undefined'
    ? (class {} as typeof HTMLElement)
    : HTMLElement

export class SdsDropdownElement extends HTMLElementBase {
  private trigger: HTMLButtonElement | null = null
  private menu: HTMLElement | null = null
  private items: HTMLElement[] = []
  private controller: AbortController | null = null

  connectedCallback(): void {
    this.controller?.abort()
    this.controller = new AbortController()

    const trigger = Array.from(this.children).find(
      (child): child is HTMLButtonElement =>
        child instanceof HTMLButtonElement &&
        child.hasAttribute('popovertarget'),
    )
    const menuId = trigger?.getAttribute('popovertarget')
    const menu = menuId
      ? Array.from(this.children).find(
          (child): child is HTMLElement =>
            child instanceof HTMLElement && child.id === menuId,
        )
      : null

    if (
      !trigger ||
      !menu ||
      !menu.hasAttribute('popover') ||
      trigger.getAttribute('aria-controls') !== menu.id
    ) {
      console.warn(
        '<sds-dropdown> requires an authored popovertarget, matching menu id, popover, and aria-controls.',
        this,
      )
      return
    }

    this.trigger = trigger
    this.menu = menu
    this.items =
      this.dataset.mode === 'popover'
        ? []
        : Array.from(
            menu.querySelectorAll<HTMLElement>(
              '[role="menuitem"]:not([aria-disabled="true"])',
            ),
          ).filter(
            (item) =>
              !(item instanceof HTMLButtonElement) || !item.disabled,
          )

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
    window.addEventListener('resize', this.positionMenu, {
      signal: this.controller.signal,
    })
    window.addEventListener('scroll', this.positionMenu, {
      capture: true,
      signal: this.controller.signal,
    })
  }

  disconnectedCallback(): void {
    this.controller?.abort()
  }

  private isOpen(): boolean {
    return this.menu?.matches(':popover-open') ?? false
  }

  private open(focusIndex = 0): void {
    if (!this.menu || this.isOpen()) return

    this.menu.showPopover()
    this.positionMenu()
    this.items[focusIndex]?.focus()
  }

  private close(restoreFocus = false): void {
    if (!this.menu || !this.isOpen()) return

    this.menu.hidePopover()
    if (restoreFocus) this.trigger?.focus()
  }

  private handleToggle = (): void => {
    if (this.isOpen()) this.positionMenu()
  }

  private handleBeforeToggle = (event: ToggleEvent): void => {
    this.trigger?.setAttribute(
      'aria-expanded',
      String(event.newState === 'open'),
    )
  }

  private handleTriggerKeydown = (event: KeyboardEvent): void => {
    if (this.dataset.mode === 'popover') return

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
    if (event.target.closest('[role="menuitem"]')) this.close()
  }

  private positionMenu = (): void => {
    if (!this.trigger || !this.menu || !this.isOpen()) return

    const triggerRect = this.trigger.getBoundingClientRect()
    const menuWidth = this.menu.offsetWidth
    const menuHeight = this.menu.offsetHeight
    const rawOffset = this.dataset.offset
    const requestedOffset =
      rawOffset === undefined || rawOffset.trim() === ''
        ? Number.NaN
        : Number(rawOffset)
    const offset =
      Number.isFinite(requestedOffset) && requestedOffset >= 0
        ? requestedOffset
        : 5
    const placement = this.dataset.placement ?? 'bottom-start'
    const alignEnd = placement.endsWith('-end')
    const placeAbove = placement.startsWith('top')
    const requestedLeft = alignEnd
      ? triggerRect.right - menuWidth
      : triggerRect.left
    const requestedTop = placeAbove
      ? triggerRect.top - menuHeight - offset
      : triggerRect.bottom + offset
    const left = Math.min(requestedLeft, window.innerWidth - menuWidth - 8)
    const top = Math.min(requestedTop, window.innerHeight - menuHeight - 8)

    this.menu.style.top = `${Math.max(8, top)}px`
    this.menu.style.left = `${Math.max(8, left)}px`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sds-dropdown': SdsDropdownElement
  }
}

export function registerSdsDropdown(): void {
  if (
    typeof customElements !== 'undefined' &&
    !customElements.get('sds-dropdown')
  ) {
    customElements.define('sds-dropdown', SdsDropdownElement)
  }
}

registerSdsDropdown()

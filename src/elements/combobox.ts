import { FloatingPositioner } from './floating.js'
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

export interface SdsComboboxSelectDetail {
  option: HTMLLIElement
  value: string
}

export class SdsComboboxElement extends HTMLElementBase {
  private input: HTMLInputElement | null = null
  private list: HTMLUListElement | null = null
  private emptyStatus: HTMLOutputElement | null = null
  private options: HTMLLIElement[] = []
  private activeOption: HTMLLIElement | null = null
  private suppressOpen = false
  // Keep the last search's matches visible after selection replaces the query.
  private matchQuery: string | null = null
  private selecting = false
  private connection = new ElementConnection()
  private optionObserver: MutationObserver | null = null
  private inputObserver: MutationObserver | null = null
  private positioner: FloatingPositioner | null = null
  private emptyPositioner: FloatingPositioner | null = null

  connectedCallback(): void {
    this.positioner = null
    this.emptyPositioner = null
    this.optionObserver?.disconnect()
    this.inputObserver?.disconnect()
    this.input = null
    this.list = null
    this.emptyStatus = null
    this.options = []
    this.activeOption = null
    this.suppressOpen = false
    this.matchQuery = null
    const signal = this.connection.connect(
      this,
      () => this.connectedCallback(),
      { childList: true },
    )

    const children = directElementChildren(this)
    const input = children.find(
      (child): child is HTMLInputElement =>
        child instanceof HTMLInputElement &&
        (child.type === 'text' || child.type === 'search'),
    )
    const list = children.find(
      (child): child is HTMLUListElement =>
        child instanceof HTMLUListElement,
    )
    const emptyStatus = children.find(
      (child): child is HTMLOutputElement =>
        child instanceof HTMLOutputElement,
    )
    if (
      !input ||
      !list ||
      children.length !== (emptyStatus ? 3 : 2) ||
      directElementChildren(list).some(
        (child) => !(child instanceof HTMLLIElement),
      )
    ) {
      console.warn(
        '<sds-combobox> requires a direct child text or search input, a direct child ul with li options, and optionally one output for empty results.',
      )
      return
    }
    if (
      !input.labels?.length &&
      !input.hasAttribute('aria-label') &&
      !input.hasAttribute('aria-labelledby')
    ) {
      console.warn('<sds-combobox> requires an accessible name on its input.')
    }

    ensureId(input, 'sds-combobox-input')
    const listId = ensureId(list, 'sds-combobox-list')
    input.setAttribute('role', 'combobox')
    input.setAttribute('aria-autocomplete', 'list')
    input.setAttribute('aria-controls', listId)
    input.setAttribute('aria-expanded', 'false')
    input.removeAttribute('aria-activedescendant')
    list.classList.add('sds-combobox-list')
    list.setAttribute('role', 'listbox')
    list.setAttribute('popover', 'manual')
    list.hidden = true

    this.input = input
    this.list = list
    this.emptyStatus = emptyStatus ?? null
    this.positioner = new FloatingPositioner(
      input,
      list,
      () => 'block-end-start',
      () => undefined,
    )
    if (emptyStatus) {
      this.emptyPositioner = new FloatingPositioner(
        input,
        emptyStatus,
        () => 'block-end-start',
        () => undefined,
      )
    }
    this.refreshOptions()
    input.addEventListener('focus', this.handleFocus, { signal })
    input.addEventListener('input', this.handleInput, { signal })
    input.addEventListener('compositionend', this.handleCompositionEnd, {
      signal,
    })
    input.addEventListener('keydown', this.handleKeydown, { signal })
    input.addEventListener('blur', this.handleBlur, { signal })
    list.addEventListener('mousedown', this.handleMouseDown, { signal })
    list.addEventListener('click', this.handleClick, { signal })
    input.form?.addEventListener('reset', this.handleFormReset, { signal })
    window.addEventListener('resize', this.handleReposition, { signal })
    window.addEventListener('scroll', this.handleReposition, {
      capture: true,
      signal,
    })

    this.optionObserver = new MutationObserver(() => {
      this.refreshOptions()
      if (!this.suppressOpen && document.activeElement === this.input) {
        this.updateMatches()
      }
    })
    this.optionObserver.observe(list, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['aria-disabled', 'aria-busy'],
    })
    this.inputObserver = new MutationObserver(() => {
      if (input.disabled || input.readOnly) {
        this.close()
        this.clearEmptyStatus()
      }
    })
    this.inputObserver.observe(input, {
      attributes: true,
      attributeFilter: ['disabled', 'readonly'],
    })
  }

  disconnectedCallback(): void {
    this.close()
    this.clearEmptyStatus()
    this.connection.disconnect()
    this.optionObserver?.disconnect()
    this.inputObserver?.disconnect()
    this.optionObserver = null
    this.inputObserver = null
    this.input = null
    this.list = null
    this.emptyStatus = null
    this.positioner = null
    this.emptyPositioner = null
    this.options = []
    this.activeOption = null
    this.suppressOpen = false
    this.matchQuery = null
  }

  private refreshOptions(): void {
    if (!this.list) return
    this.options = directElementChildren(this.list).filter(
      (child): child is HTMLLIElement => child instanceof HTMLLIElement,
    )
    for (const option of this.options) {
      ensureId(option, 'sds-combobox-option')
      option.setAttribute('role', 'option')
      if (!option.hasAttribute('aria-selected')) {
        option.setAttribute('aria-selected', 'false')
      }
    }
    if (this.activeOption && !this.options.includes(this.activeOption)) {
      this.setActive(null)
    }
  }

  private selectableOptions(): HTMLLIElement[] {
    return this.options.filter(
      (option) => !option.hidden && option.getAttribute('aria-disabled') !== 'true',
    )
  }

  private setActive(option: HTMLLIElement | null): void {
    if (this.activeOption && this.activeOption !== option) {
      this.activeOption.setAttribute('aria-selected', 'false')
    }
    this.activeOption = option
    if (option) {
      option.setAttribute('aria-selected', 'true')
      this.input?.setAttribute('aria-activedescendant', option.id)
      option.scrollIntoView?.({ block: 'nearest' })
    } else {
      this.input?.removeAttribute('aria-activedescendant')
    }
  }

  private close(): void {
    if (!this.list || !this.input) return
    if (this.list.matches(':popover-open')) this.list.hidePopover()
    this.list.hidden = true
    this.input.setAttribute('aria-expanded', 'false')
    this.setActive(null)
  }

  private clearEmptyStatus(): void {
    if (this.emptyStatus) this.emptyStatus.textContent = ''
    this.emptyPositioner?.reset()
  }

  private updateEmptyStatus(): void {
    if (!this.emptyStatus || !this.input || !this.list) return
    const empty =
      !this.suppressOpen &&
      !this.input.disabled &&
      !this.input.readOnly &&
      document.activeElement === this.input &&
      this.input.value.trim() !== '' &&
      this.list.getAttribute('aria-busy') !== 'true' &&
      this.options.every((option) => option.hidden)
    const message = empty
      ? this.emptyStatus.getAttribute('data-empty-message')?.trim() || 'No results found.'
      : ''
    if (!message) {
      this.clearEmptyStatus()
      return
    }
    if (this.emptyStatus.textContent !== message) {
      this.emptyStatus.textContent = message
    }
    this.emptyStatus.style.minWidth = `${this.input.getBoundingClientRect().width}px`
    this.emptyPositioner?.position()
  }

  private updateMatches(): void {
    if (!this.input || !this.list) return
    if (this.getAttribute('filter') !== 'manual') {
      const query = (this.matchQuery ?? this.input.value).trim().toLocaleLowerCase()
      for (const option of this.options) {
        option.hidden = !option.textContent?.toLocaleLowerCase().includes(query)
      }
    }
    if (this.emptyStatus) queueMicrotask(() => this.updateEmptyStatus())
    if (
      this.activeOption &&
      !this.selectableOptions().includes(this.activeOption)
    ) {
      this.setActive(null)
    }
    const open =
      !this.suppressOpen &&
      !this.input.disabled &&
      !this.input.readOnly &&
      this.selectableOptions().length > 0 &&
      document.activeElement === this.input
    if (!open) {
      this.close()
      return
    }
    this.list.style.minWidth = `${this.input.getBoundingClientRect().width}px`
    if (!this.list.matches(':popover-open')) {
      this.list.hidden = false
      this.positioner?.reset()
      this.list.showPopover()
    }
    this.positioner?.position()
    this.input.setAttribute('aria-expanded', 'true')
  }

  private select(option: HTMLLIElement): void {
    if (
      !this.input ||
      this.input.disabled ||
      this.input.readOnly ||
      !this.selectableOptions().includes(option)
    ) return
    const label = option.getAttribute('data-label')
    if (label !== null && !label.trim()) {
      console.warn('<sds-combobox> option data-label must be nonempty.')
      return
    }
    const displayValue = label?.trim() ?? option.textContent?.trim() ?? ''
    const value = option.getAttribute('data-sds-value') ?? displayValue
    const keepOpen = this.hasAttribute('keep-open')
    if (keepOpen) this.matchQuery ??= this.input.value
    this.input.value = displayValue
    if (!keepOpen) {
      this.suppressOpen = true
      this.close()
    } else {
      this.setActive(null)
    }
    this.selecting = true
    try {
      this.input.focus()
      this.input.dispatchEvent(new Event('input', { bubbles: true }))
      this.input.dispatchEvent(new Event('change', { bubbles: true }))
      this.dispatchEvent(new CustomEvent<SdsComboboxSelectDetail>('sds-select', {
        bubbles: true,
        composed: true,
        detail: { option, value },
      }))
    } finally {
      this.selecting = false
    }
    if (keepOpen) {
      this.refreshOptions()
      this.updateMatches()
    }
  }

  private handleFocus = (): void => {
    if (this.selecting) return
    this.suppressOpen = false
    this.matchQuery = null
    this.refreshOptions()
    this.updateMatches()
  }

  private handleInput = (event: Event): void => {
    if (this.selecting || (event instanceof InputEvent && event.isComposing)) return
    this.suppressOpen = false
    this.matchQuery = null
    this.refreshOptions()
    this.setActive(null)
    this.updateMatches()
  }

  private handleCompositionEnd = (): void => {
    this.suppressOpen = false
    this.matchQuery = null
    this.refreshOptions()
    this.updateMatches()
  }

  private handleKeydown = (event: KeyboardEvent): void => {
    if (
      event.isComposing ||
      !this.input ||
      !this.list ||
      this.input.disabled ||
      this.input.readOnly
    ) return
    if (event.key === 'Escape') {
      if (!this.list.hidden || this.emptyStatus?.textContent) {
        event.preventDefault()
        this.suppressOpen = true
        this.close()
        this.clearEmptyStatus()
      }
      return
    }
    if (event.key === 'Enter' && !this.list.hidden && this.activeOption) {
      event.preventDefault()
      this.select(this.activeOption)
      return
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    this.suppressOpen = false
    this.refreshOptions()
    if (this.list.hidden) this.updateMatches()
    const options = this.selectableOptions()
    if (!options.length) return
    event.preventDefault()
    const index = this.activeOption
      ? options.indexOf(this.activeOption)
      : -1
    this.setActive(options[
      event.key === 'ArrowDown'
        ? (index + 1) % options.length
        : (index < 0
            ? options.length - 1
            : (index - 1 + options.length) % options.length)
    ])
  }

  private handleFormReset = (): void => {
    this.suppressOpen = true
    this.matchQuery = null
    this.close()
    this.clearEmptyStatus()
  }

  private handleReposition = (): void => {
    if (this.list?.matches(':popover-open')) this.positioner?.position()
    if (this.emptyStatus?.textContent) this.emptyPositioner?.position()
  }

  private handleBlur = (): void => {
    this.close()
    this.clearEmptyStatus()
  }

  private handleMouseDown = (event: MouseEvent): void => {
    if (
      event.target instanceof Element &&
      this.list?.contains(event.target.closest('[role="option"]'))
    ) event.preventDefault()
  }

  private handleClick = (event: MouseEvent): void => {
    if (!(event.target instanceof Element)) return
    const option = event.target.closest<HTMLLIElement>('[role="option"]')
    if (option && this.list?.contains(option)) this.select(option)
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sds-combobox': SdsComboboxElement
  }

  interface HTMLElementEventMap {
    'sds-select': CustomEvent<SdsComboboxSelectDetail>
  }
}

export function registerSdsCombobox(): void {
  defineCustomElement('sds-combobox', SdsComboboxElement)
}

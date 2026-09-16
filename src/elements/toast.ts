const DEFAULT_DURATION = 5000
const HTMLElementBase: typeof HTMLElement =
  typeof HTMLElement === 'undefined'
    ? (class {} as typeof HTMLElement)
    : HTMLElement

export type SdsToastCloseReason = 'dismiss' | 'programmatic' | 'timeout'

export class SdsToastElement extends HTMLElementBase {
  static observedAttributes = ['open']

  private hideTimer: number | null = null

  get open(): boolean {
    return this.hasAttribute('open')
  }

  set open(value: boolean) {
    this.toggleAttribute('open', value)
  }

  connectedCallback(): void {
    if (
      !this.hasAttribute('role') ||
      this.getAttribute('aria-atomic') !== 'true'
    ) {
      console.warn(
        '<sds-toast> requires an authored role and aria-atomic="true" for SSR accessibility.',
        this,
      )
    }

    this.addEventListener('click', this.handleClick)
    this.addEventListener('focusin', this.pauseAutoHide)
    this.addEventListener('focusout', this.handleFocusOut)
    this.addEventListener('pointerenter', this.pauseAutoHide)
    this.addEventListener('pointerleave', this.resumeAutoHide)

    if (this.open) this.scheduleAutoHide()
  }

  disconnectedCallback(): void {
    this.clearAutoHide()
    this.removeEventListener('click', this.handleClick)
    this.removeEventListener('focusin', this.pauseAutoHide)
    this.removeEventListener('focusout', this.handleFocusOut)
    this.removeEventListener('pointerenter', this.pauseAutoHide)
    this.removeEventListener('pointerleave', this.resumeAutoHide)
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ): void {
    if (
      name !== 'open' ||
      oldValue === newValue ||
      !this.isConnected
    ) {
      return
    }

    if (newValue === null) this.clearAutoHide()
    else this.scheduleAutoHide()
  }

  show(): void {
    if (this.open) {
      this.scheduleAutoHide()
      return
    }

    this.open = true
    this.dispatchEvent(
      new CustomEvent('sds-open', { bubbles: true, composed: true }),
    )
  }

  close(reason: SdsToastCloseReason = 'programmatic'): void {
    if (!this.open) return

    this.open = false
    this.dispatchEvent(
      new CustomEvent('sds-close', {
        bubbles: true,
        composed: true,
        detail: { reason },
      }),
    )
  }

  private scheduleAutoHide(): void {
    this.clearAutoHide()
    if (!this.open || this.hasAttribute('data-persistent')) return

    const requestedDuration = Number(this.dataset.duration)
    const duration =
      Number.isFinite(requestedDuration) && requestedDuration > 0
        ? requestedDuration
        : DEFAULT_DURATION

    this.hideTimer = window.setTimeout(() => this.close('timeout'), duration)
  }

  private clearAutoHide(): void {
    if (this.hideTimer === null) return
    window.clearTimeout(this.hideTimer)
    this.hideTimer = null
  }

  private handleClick = (event: MouseEvent): void => {
    if (!(event.target instanceof Element)) return
    if (event.target.closest('[data-toast-close]')) this.close('dismiss')
  }

  private pauseAutoHide = (): void => {
    this.clearAutoHide()
  }

  private resumeAutoHide = (): void => {
    if (!this.matches(':hover') && !this.contains(document.activeElement)) {
      this.scheduleAutoHide()
    }
  }

  private handleFocusOut = (event: FocusEvent): void => {
    if (
      !(event.relatedTarget instanceof Node) ||
      !this.contains(event.relatedTarget)
    ) {
      this.resumeAutoHide()
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sds-toast': SdsToastElement
  }
}

let triggersRegistered = false

function registerToastTriggers(): void {
  if (triggersRegistered || typeof document === 'undefined') return

  triggersRegistered = true
  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return

    const trigger = event.target.closest<HTMLElement>('[data-toast-open]')
    const toastId = trigger?.dataset.toastOpen
    const toast = toastId ? document.getElementById(toastId) : null

    if (toast instanceof SdsToastElement) toast.show()
  })
}

export function registerSdsToast(): void {
  if (
    typeof customElements !== 'undefined' &&
    !customElements.get('sds-toast')
  ) {
    customElements.define('sds-toast', SdsToastElement)
  }
  registerToastTriggers()
}

registerSdsToast()

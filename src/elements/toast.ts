import {
  defineCustomElement,
  readNumberAttribute,
  reflectBooleanAttribute,
  reflectNumberAttribute,
  reflectStringAttribute,
} from './internals.js'
import type { SdsTone } from '../generated/interface.js'

const DEFAULT_DURATION = 5000
const REMOVE_DELAY = 250
const HTMLElementBase: typeof HTMLElement =
  typeof HTMLElement === 'undefined'
    ? (class {} as typeof HTMLElement)
    : HTMLElement

export type SdsToastCloseReason = 'dismiss' | 'programmatic' | 'timeout'
export type SdsToastTone = SdsTone

export interface SdsNotifyOptions {
  container?: HTMLElement
  title?: string
  tone?: SdsToastTone
  duration?: number
  persistent?: boolean
  urgent?: boolean
}

export class SdsToastElement extends HTMLElementBase {
  static observedAttributes = ['open', 'duration', 'persistent']

  private hideTimer: number | null = null

  get open(): boolean {
    return this.hasAttribute('open')
  }

  set open(value: boolean) {
    reflectBooleanAttribute(this, 'open', value)
  }

  get tone(): SdsTone {
    return (this.getAttribute('tone') ?? 'info') as SdsTone
  }

  set tone(value: SdsTone) {
    reflectStringAttribute(this, 'tone', value)
  }

  get duration(): number {
    const duration = readNumberAttribute(this, 'duration', DEFAULT_DURATION)
    return duration > 0 ? duration : DEFAULT_DURATION
  }

  set duration(value: number) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new RangeError('duration must be a positive finite number.')
    }
    reflectNumberAttribute(this, 'duration', value)
  }

  get persistent(): boolean {
    return this.hasAttribute('persistent')
  }

  set persistent(value: boolean) {
    reflectBooleanAttribute(this, 'persistent', value)
  }

  connectedCallback(): void {
    if (!this.hasAttribute('role')) this.setAttribute('role', 'status')
    if (!this.hasAttribute('aria-atomic')) {
      this.setAttribute('aria-atomic', 'true')
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
      oldValue === newValue ||
      !this.isConnected
    ) {
      return
    }

    if (name === 'open' && newValue === null) this.clearAutoHide()
    else if (this.open) this.scheduleAutoHide()
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
    if (!this.open || this.persistent) return

    this.hideTimer = window.setTimeout(
      () => this.close('timeout'),
      this.duration,
    )
  }

  private clearAutoHide(): void {
    if (this.hideTimer === null) return
    window.clearTimeout(this.hideTimer)
    this.hideTimer = null
  }

  private handleClick = (event: MouseEvent): void => {
    if (!(event.target instanceof Element)) return
    if (event.target.closest('[data-sds-toast-close]')) this.close('dismiss')
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

  interface HTMLElementEventMap {
    'sds-open': CustomEvent<void>
    'sds-close': CustomEvent<{ reason: SdsToastCloseReason }>
  }
}

let triggersRegistered = false

function registerToastTriggers(): void {
  if (triggersRegistered || typeof document === 'undefined') return

  triggersRegistered = true
  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return

    const trigger = event.target.closest<HTMLElement>('[data-sds-toast-open]')
    const toastId = trigger?.getAttribute('data-sds-toast-open')
    const toast = toastId ? document.getElementById(toastId) : null

    if (toast instanceof SdsToastElement) toast.show()
  })
}

export function registerSdsToast(): void {
  defineCustomElement('sds-toast', SdsToastElement)
  registerToastTriggers()
}

export function notify(
  message: string,
  options: SdsNotifyOptions = {},
): SdsToastElement {
  if (typeof document === 'undefined') {
    throw new Error('notify() can only be called in a browser.')
  }

  if (
    options.duration !== undefined &&
    (!Number.isFinite(options.duration) || options.duration <= 0)
  ) {
    throw new RangeError('notify() duration must be a positive number.')
  }

  registerSdsToast()

  const scope = options.container ?? document
  const containerIsToaster =
    options.container?.matches('.sds-toaster, sds-toaster') ?? false
  let toaster =
    containerIsToaster
      ? options.container
      : scope.querySelector<HTMLElement>('.sds-toaster, sds-toaster')
  if (!toaster) {
    toaster = document.createElement('section')
    toaster.className = 'sds-toaster'
    toaster.setAttribute('aria-label', 'Notifications')
    const root =
      options.container ??
      document.querySelector<HTMLElement>('[data-sds-root]')
    if (!root) toaster.dataset.sdsRoot = ''
    const toastHost = root ?? document.body
    toastHost.append(toaster)
  }
  if (
    toaster.localName === 'div' &&
    !toaster.hasAttribute('role')
  ) {
    toaster.setAttribute('role', 'region')
  }
  if (
    !toaster.hasAttribute('aria-label') &&
    !toaster.hasAttribute('aria-labelledby')
  ) {
    toaster.setAttribute('aria-label', 'Notifications')
  }

  const toast = document.createElement('sds-toast')
  toast.tone = options.tone ?? 'info'
  toast.setAttribute('role', options.urgent ? 'alert' : 'status')
  toast.setAttribute('aria-atomic', 'true')
  if (options.duration !== undefined) {
    toast.duration = options.duration
  }
  toast.persistent = options.persistent ?? false

  const title = document.createElement('strong')
  title.textContent = options.title ?? 'Notification'
  const body = document.createElement('span')
  body.textContent = message
  const closeButton = document.createElement('button')
  closeButton.type = 'button'
  closeButton.setAttribute('data-sds-shape', 'icon')
  closeButton.setAttribute('data-sds-toast-close', '')
  closeButton.setAttribute('aria-label', 'Dismiss notification')
  closeButton.textContent = '\u00d7'

  toast.append(title, body, closeButton)
  toast.addEventListener(
    'sds-close',
    () => window.setTimeout(() => toast.remove(), REMOVE_DELAY),
    { once: true },
  )
  toaster.append(toast)
  toast.show()
  return toast
}

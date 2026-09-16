const OPEN_EVENT = 'sds-open'
const CLOSE_EVENT = 'sds-close'
const CANCEL_EVENT = 'sds-cancel'

let registered = false

function findDialog(trigger: Element): HTMLDialogElement | null {
  const targetId = trigger.getAttribute('commandfor')

  if (targetId) {
    const target = document.getElementById(targetId)
    return target instanceof HTMLDialogElement &&
      target.matches('.sds-dialog, .sds-panel')
      ? target
      : null
  }

  return trigger.closest<HTMLDialogElement>(
    'dialog.sds-dialog, dialog.sds-panel',
  )
}

function openDialog(dialog: HTMLDialogElement, modal: boolean): void {
  if (dialog.open) return

  if (modal) dialog.showModal()
  else dialog.show()

  dialog.dispatchEvent(
    new CustomEvent(OPEN_EVENT, { bubbles: true, composed: true }),
  )
}

function handleClick(event: MouseEvent): void {
  if (!(event.target instanceof Element)) return

  const trigger = event.target.closest<HTMLElement>(
    '[commandfor]',
  )

  if (trigger) {
    const dialog = findDialog(trigger)
    if (!dialog) return

    const command = trigger.getAttribute('command')

    if (
      command === 'show-modal' ||
      command === 'close' ||
      command === 'request-close'
    ) {
      event.preventDefault()
    }
    if (command === 'show-modal') openDialog(dialog, true)
    if (command === 'show-modal') openDialog(dialog, true)
    else if (command === 'close') dialog.close(trigger.dataset.returnValue)
    else if (command === 'request-close') {
      const requestClose = Reflect.get(dialog, 'requestClose')
      if (typeof requestClose === 'function') {
        requestClose.call(dialog, trigger.dataset.returnValue)
      } else {
        const cancelEvent = new Event('cancel', { cancelable: true })
        if (dialog.dispatchEvent(cancelEvent)) {
          dialog.close(trigger.dataset.returnValue)
        }
      }
    }
    return
  }

  const dialog = event.target.closest<HTMLDialogElement>(
    'dialog.sds-dialog[open], dialog.sds-panel[open]',
  )
  if (!dialog || event.target !== dialog) return

  const rect = dialog.getBoundingClientRect()
  const outsideSurface =
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom

  if (outsideSurface && dialog.getAttribute('closedby') === 'any') {
    dialog.close()
  }
}

function handleClose(event: Event): void {
  const dialog = event.target
  if (
    !(dialog instanceof HTMLDialogElement) ||
    !dialog.matches('.sds-dialog, .sds-panel')
  ) {
    return
  }

  dialog.dispatchEvent(
    new CustomEvent(CLOSE_EVENT, {
      bubbles: true,
      composed: true,
      detail: { returnValue: dialog.returnValue },
    }),
  )
}

function handleCancel(event: Event): void {
  const dialog = event.target
  if (
    !(dialog instanceof HTMLDialogElement) ||
    !dialog.matches('.sds-dialog, .sds-panel')
  ) {
    return
  }

  const cancelEvent = new CustomEvent(CANCEL_EVENT, {
    bubbles: true,
    cancelable: true,
    composed: true,
  })

  if (!dialog.dispatchEvent(cancelEvent)) event.preventDefault()
}

export function registerSdsDialog(): void {
  if (registered || typeof document === 'undefined') return

  registered = true
  document.addEventListener('click', handleClick)
  document.addEventListener('close', handleClose, true)
  document.addEventListener('cancel', handleCancel, true)
}

registerSdsDialog()

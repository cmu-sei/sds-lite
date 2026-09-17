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
    else if (command === 'close') {
      dialog.close(trigger.getAttribute('data-sds-return-value') ?? '')
    }
    else if (command === 'request-close') {
      const requestClose = Reflect.get(dialog, 'requestClose')
      if (typeof requestClose === 'function') {
        requestClose.call(
          dialog,
          trigger.getAttribute('data-sds-return-value') ?? '',
        )
      } else {
        const cancelEvent = new Event('cancel', { cancelable: true })
        if (dialog.dispatchEvent(cancelEvent)) {
          dialog.close(trigger.getAttribute('data-sds-return-value') ?? '')
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

export function registerSdsDialog(): void {
  if (registered || typeof document === 'undefined') return

  registered = true
  document.addEventListener('click', handleClick)
}

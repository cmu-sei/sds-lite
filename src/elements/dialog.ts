let registered = false

type PanelSide = 'bottom' | 'left' | 'right'

interface PanelDrag {
  distance: number
  dragging: boolean
  frame: number | null
  handle: HTMLElement
  lastDistance: number
  lastTime: number
  panel: HTMLDialogElement
  pointerId: number
  side: PanelSide
  startCrossCoordinate: number
  startCoordinate: number
  velocity: number
}

const dragStartDistance = 6
const velocityProjectionTime = 180
let activeDrag: PanelDrag | null = null
const originalPanelStyles = new WeakMap<
  HTMLDialogElement,
  {
    backdropOpacity: string
    handleCursor: string
    transform: string
    transitionDuration: string
    transitionTimingFunction: string
  }
>()

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

function panelSide(panel: HTMLDialogElement): PanelSide {
  const side = panel.dataset.sdsSide
  return side === 'bottom' || side === 'left' ? side : 'right'
}

function primaryCoordinate(event: PointerEvent, side: PanelSide): number {
  if (side === 'bottom') return event.clientY
  if (side === 'left') return -event.clientX
  return event.clientX
}

function crossCoordinate(event: PointerEvent, side: PanelSide): number {
  return side === 'bottom' ? event.clientX : event.clientY
}

function panelSize(panel: HTMLDialogElement, side: PanelSide): number {
  const rect = panel.getBoundingClientRect()
  return side === 'bottom' ? rect.height : rect.width
}

function panelTransform(side: PanelSide, distance: number): string {
  if (side === 'bottom') return `translate3d(0, ${distance}px, 0)`
  const offset = side === 'left' ? -distance : distance
  return `translate3d(${offset}px, 0, 0)`
}

function resetPanelDrag(panel: HTMLDialogElement): void {
  const originalStyles = originalPanelStyles.get(panel)
  if (!originalStyles) return

  const handle = Array.from(panel.children).find((child) =>
    child.classList.contains('_sds-panel-handle'),
  )
  if (handle instanceof HTMLElement) {
    handle.style.cursor = originalStyles.handleCursor
  }
  panel.style.transform = originalStyles.transform
  panel.style.transitionDuration = originalStyles.transitionDuration
  panel.style.transitionTimingFunction =
    originalStyles.transitionTimingFunction
  panel.style.setProperty(
    '--sds-panel-backdrop-opacity',
    originalStyles.backdropOpacity,
  )
  originalPanelStyles.delete(panel)
}

function applyPanelDrag(drag: PanelDrag): void {
  drag.frame = null
  const size = panelSize(drag.panel, drag.side)
  const distance = Math.min(drag.distance, size)
  const progress = size > 0 ? distance / size : 0

  drag.panel.style.transform = panelTransform(drag.side, distance)
  drag.panel.style.setProperty(
    '--sds-panel-backdrop-opacity',
    String(1 - progress),
  )
}

function settlePanel(
  drag: PanelDrag,
  destination: 'close' | 'open',
): void {
  const { panel } = drag
  const view = panel.ownerDocument.defaultView
  if (!view) {
    resetPanelDrag(panel)
    return
  }

  panel.style.transitionDuration = 'var(--sds-duration-normal)'
  panel.style.transitionTimingFunction =
    destination === 'close'
      ? 'var(--sds-easing-exit)'
      : 'var(--sds-easing-enter)'

  const finish = (): void => {
    view.clearTimeout(timeout)
    panel.removeEventListener('transitionend', handleTransitionEnd)
    if (destination === 'close' && panel.open) panel.close()
    resetPanelDrag(panel)
  }
  const handleTransitionEnd = (event: TransitionEvent): void => {
    if (event.target === panel && event.propertyName === 'transform') finish()
  }
  const timeout = view.setTimeout(finish, 250)

  panel.addEventListener('transitionend', handleTransitionEnd)
  if (destination === 'close') {
    const size = panelSize(panel, drag.side)
    panel.style.transform = panelTransform(drag.side, size)
    panel.style.setProperty('--sds-panel-backdrop-opacity', '0')
  } else {
    panel.style.transform = panelTransform(drag.side, 0)
    panel.style.setProperty('--sds-panel-backdrop-opacity', '1')
  }
}

function releasePointer(drag: PanelDrag): void {
  if (drag.handle.hasPointerCapture(drag.pointerId)) {
    drag.handle.releasePointerCapture(drag.pointerId)
  }
}

function handlePointerDown(event: PointerEvent): void {
  if (
    !event.isPrimary ||
    event.button !== 0 ||
    !(event.target instanceof Element)
  ) {
    return
  }

  const handle = event.target.closest<HTMLElement>('._sds-panel-handle')
  const panel = handle?.closest<HTMLDialogElement>('dialog.sds-panel[open]')
  if (
    !handle ||
    !panel ||
    handle.parentElement !== panel ||
    originalPanelStyles.has(panel)
  ) {
    return
  }

  const side = panelSide(panel)
  originalPanelStyles.set(panel, {
    backdropOpacity: panel.style.getPropertyValue(
      '--sds-panel-backdrop-opacity',
    ),
    handleCursor: handle.style.cursor,
    transform: panel.style.transform,
    transitionDuration: panel.style.transitionDuration,
    transitionTimingFunction: panel.style.transitionTimingFunction,
  })
  activeDrag = {
    distance: 0,
    dragging: false,
    frame: null,
    handle,
    lastDistance: 0,
    lastTime: event.timeStamp,
    panel,
    pointerId: event.pointerId,
    side,
    startCrossCoordinate: crossCoordinate(event, side),
    startCoordinate: primaryCoordinate(event, side),
    velocity: 0,
  }
  handle.setPointerCapture(event.pointerId)
}

function handlePointerMove(event: PointerEvent): void {
  const drag = activeDrag
  if (!drag || event.pointerId !== drag.pointerId) return

  const distance = Math.max(
    0,
    primaryCoordinate(event, drag.side) - drag.startCoordinate,
  )
  const crossDistance = Math.abs(
    crossCoordinate(event, drag.side) - drag.startCrossCoordinate,
  )

  if (!drag.dragging) {
    if (
      distance < dragStartDistance ||
      distance < crossDistance * 1.15
    ) {
      return
    }
    drag.dragging = true
    drag.panel.style.transitionDuration = '0s'
    drag.handle.style.cursor = 'grabbing'
  }

  event.preventDefault()
  const elapsed = event.timeStamp - drag.lastTime
  if (elapsed > 0) {
    const instantaneousVelocity = (distance - drag.lastDistance) / elapsed
    drag.velocity = drag.velocity * 0.7 + instantaneousVelocity * 0.3
  }
  drag.distance = distance
  drag.lastDistance = distance
  drag.lastTime = event.timeStamp

  if (drag.frame === null) {
    const view = drag.panel.ownerDocument.defaultView
    drag.frame = view?.requestAnimationFrame(() => applyPanelDrag(drag)) ?? null
  }
}

function finishPointerDrag(event: PointerEvent, cancelled: boolean): void {
  const drag = activeDrag
  if (!drag || event.pointerId !== drag.pointerId) return

  activeDrag = null
  releasePointer(drag)
  if (!drag.dragging) {
    resetPanelDrag(drag.panel)
    return
  }

  const view = drag.panel.ownerDocument.defaultView
  if (drag.frame !== null && view) {
    view.cancelAnimationFrame(drag.frame)
    applyPanelDrag(drag)
  }

  const size = panelSize(drag.panel, drag.side)
  const releaseVelocity =
    event.timeStamp - drag.lastTime > 80 ? 0 : Math.max(0, drag.velocity)
  const projectedDistance =
    drag.distance + releaseVelocity * velocityProjectionTime
  const shouldClose =
    !cancelled && drag.distance > 0 && projectedDistance >= size * 0.45

  if (!shouldClose) {
    settlePanel(drag, 'open')
    return
  }

  const EventConstructor = drag.panel.ownerDocument.defaultView?.Event
  const canClose =
    EventConstructor &&
    drag.panel.dispatchEvent(
      new EventConstructor('cancel', { cancelable: true }),
    )
  settlePanel(drag, canClose ? 'close' : 'open')
}

function enhancePanel(panel: HTMLDialogElement): void {
  const existingHandle = Array.from(panel.children).find((child) =>
    child.classList.contains('_sds-panel-handle'),
  )
  if (existingHandle) return

  const handle = panel.ownerDocument.createElement('div')
  handle.className = '_sds-panel-handle'
  handle.setAttribute('aria-hidden', 'true')
  panel.prepend(handle)
}

function enhancePanels(root: ParentNode): void {
  if (root instanceof HTMLDialogElement && root.matches('.sds-panel')) {
    enhancePanel(root)
  }
  for (const panel of root.querySelectorAll<HTMLDialogElement>(
    'dialog.sds-panel',
  )) {
    enhancePanel(panel)
  }
}

function handleClick(event: MouseEvent): void {
  if (!(event.target instanceof Element)) return

  const trigger = event.target.closest<HTMLElement>(
    '[commandfor], dialog.sds-dialog [command], dialog.sds-panel [command]',
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
  document.addEventListener('pointerdown', handlePointerDown)
  document.addEventListener('pointermove', handlePointerMove)
  document.addEventListener('pointerup', (event) =>
    finishPointerDrag(event, false),
  )
  document.addEventListener('pointercancel', (event) =>
    finishPointerDrag(event, true),
  )
  document.addEventListener('lostpointercapture', (event) =>
    finishPointerDrag(event, true),
  )
  document.addEventListener(
    'close',
    (event) => {
      if (
        event.target instanceof HTMLDialogElement &&
        event.target.matches('.sds-panel')
      ) {
        if (activeDrag?.panel === event.target) {
          releasePointer(activeDrag)
          const view = event.target.ownerDocument.defaultView
          if (activeDrag.frame !== null && view) {
            view.cancelAnimationFrame(activeDrag.frame)
          }
          activeDrag = null
        }
        resetPanelDrag(event.target)
      }
    },
    true,
  )

  enhancePanels(document)
  const MutationObserverConstructor = document.defaultView?.MutationObserver
  if (!MutationObserverConstructor) return

  const observer = new MutationObserverConstructor((records) => {
    for (const record of records) {
      if (
        record.type === 'attributes' &&
        record.target instanceof HTMLDialogElement &&
        record.target.matches('.sds-panel')
      ) {
        enhancePanel(record.target)
      }
      for (const node of record.addedNodes) {
        if (node instanceof Element) enhancePanels(node)
      }
    }
  })
  observer.observe(document.documentElement, {
    attributeFilter: ['class'],
    attributes: true,
    childList: true,
    subtree: true,
  })
}

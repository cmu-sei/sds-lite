export type FloatingSide = 'top' | 'right' | 'bottom' | 'left'
export type FloatingAlignment = 'start' | 'center' | 'end'
export type FloatingPlacement =
  | FloatingSide
  | `${FloatingSide}-start`
  | `${FloatingSide}-end`

export interface FloatingRect {
  top: number
  right: number
  bottom: number
  left: number
  width: number
  height: number
}

export interface FloatingSize {
  width: number
  height: number
}

export interface FloatingPositionOptions {
  anchor: FloatingRect
  surface: FloatingSize
  viewport: FloatingSize
  preferredPlacement: string
  previousPlacement: FloatingPlacement | null
  offset: number
}

export interface FloatingPosition {
  top: number
  left: number
  side: FloatingSide
  placement: FloatingPlacement
}

const sides: FloatingSide[] = ['top', 'right', 'bottom', 'left']
const oppositeSide: Record<FloatingSide, FloatingSide> = {
  top: 'bottom',
  right: 'left',
  bottom: 'top',
  left: 'right',
}

function parsePlacement(
  value: string,
  fallback: FloatingPlacement,
): { side: FloatingSide; alignment: FloatingAlignment } {
  const [requestedSide, requestedAlignment] = value.split('-')
  const side = sides.includes(requestedSide as FloatingSide)
    ? (requestedSide as FloatingSide)
    : parsePlacement(fallback, 'bottom-start').side
  const alignment =
    requestedAlignment === 'start' || requestedAlignment === 'end'
      ? requestedAlignment
      : 'center'
  return { side, alignment }
}

function formatPlacement(
  side: FloatingSide,
  alignment: FloatingAlignment,
): FloatingPlacement {
  return alignment === 'center' ? side : `${side}-${alignment}`
}

function overflow(start: number, size: number, viewportSize: number): number {
  return Math.max(0, -start) + Math.max(0, start + size - viewportSize)
}

function coordinates(
  anchor: FloatingRect,
  surface: FloatingSize,
  side: FloatingSide,
  alignment: FloatingAlignment,
  offset: number,
): { top: number; left: number } {
  const horizontalAlignment = {
    start: anchor.left,
    center: anchor.left + (anchor.width - surface.width) / 2,
    end: anchor.right - surface.width,
  }
  const verticalAlignment = {
    start: anchor.top,
    center: anchor.top + (anchor.height - surface.height) / 2,
    end: anchor.bottom - surface.height,
  }

  if (side === 'top') {
    return {
      top: anchor.top - surface.height - offset,
      left: horizontalAlignment[alignment],
    }
  }
  if (side === 'bottom') {
    return {
      top: anchor.bottom + offset,
      left: horizontalAlignment[alignment],
    }
  }
  if (side === 'left') {
    return {
      top: verticalAlignment[alignment],
      left: anchor.left - surface.width - offset,
    }
  }
  return {
    top: verticalAlignment[alignment],
    left: anchor.right + offset,
  }
}

function primaryOverflow(
  position: { top: number; left: number },
  surface: FloatingSize,
  viewport: FloatingSize,
  side: FloatingSide,
): number {
  return side === 'top' || side === 'bottom'
    ? overflow(position.top, surface.height, viewport.height)
    : overflow(position.left, surface.width, viewport.width)
}

function crossOverflow(
  position: { top: number; left: number },
  surface: FloatingSize,
  viewport: FloatingSize,
  side: FloatingSide,
): number {
  return side === 'top' || side === 'bottom'
    ? overflow(position.left, surface.width, viewport.width)
    : overflow(position.top, surface.height, viewport.height)
}

function leastOverflow<T>(
  choices: T[],
  getOverflow: (choice: T) => number,
): T {
  return choices.reduce((best, choice) =>
    getOverflow(choice) < getOverflow(best) ? choice : best,
  )
}

export function computeFloatingPosition({
  anchor,
  surface,
  viewport,
  preferredPlacement,
  previousPlacement,
  offset,
}: FloatingPositionOptions): FloatingPosition {
  const preferred = parsePlacement(preferredPlacement, 'bottom-start')
  const previous = previousPlacement
    ? parsePlacement(previousPlacement, 'bottom-start')
    : null
  const startingSide = previous?.side ?? preferred.side
  const sideChoices = [startingSide, oppositeSide[startingSide]]
  const getSideOverflow = (side: FloatingSide): number =>
    primaryOverflow(
      coordinates(anchor, surface, side, preferred.alignment, offset),
      surface,
      viewport,
      side,
    )
  const side =
    previous && getSideOverflow(startingSide) === 0
      ? startingSide
      : leastOverflow(sideChoices, getSideOverflow)

  const startingAlignment = previous?.alignment ?? preferred.alignment
  const alignmentChoices: FloatingAlignment[] =
    startingAlignment === 'center'
      ? ['center', 'start', 'end']
      : [
          startingAlignment,
          startingAlignment === 'start' ? 'end' : 'start',
        ]
  const getAlignmentOverflow = (alignment: FloatingAlignment): number =>
    crossOverflow(
      coordinates(anchor, surface, side, alignment, offset),
      surface,
      viewport,
      side,
    )
  const alignment =
    previous && getAlignmentOverflow(startingAlignment) === 0
      ? startingAlignment
      : leastOverflow(alignmentChoices, getAlignmentOverflow)
  const position = coordinates(anchor, surface, side, alignment, offset)

  return {
    ...position,
    side,
    placement: formatPlacement(side, alignment),
  }
}

function requestedOffset(
  value: string | undefined,
  fallback: number,
): number {
  if (value === undefined || value.trim() === '') return fallback
  const offset = Number(value)
  return Number.isFinite(offset) && offset >= 0 ? offset : fallback
}

export class FloatingPositioner {
  private previousPlacement: FloatingPlacement | null = null
  private preferredPlacement = ''
  private anchor: HTMLElement
  private surface: HTMLElement
  private getPlacement: () => string
  private getOffset: () => string | undefined
  private defaultOffset: number

  constructor(
    anchor: HTMLElement,
    surface: HTMLElement,
    getPlacement: () => string,
    getOffset: () => string | undefined,
    defaultOffset = 5,
  ) {
    this.anchor = anchor
    this.surface = surface
    this.getPlacement = getPlacement
    this.getOffset = getOffset
    this.defaultOffset = defaultOffset
  }

  observe(signal: AbortSignal): void {
    window.addEventListener('resize', this.position, { signal })
    window.addEventListener('scroll', this.position, {
      capture: true,
      signal,
    })
  }

  reset(): void {
    this.previousPlacement = null
    this.preferredPlacement = ''
  }

  position = (): void => {
    const preferredPlacement = this.getPlacement()
    if (preferredPlacement !== this.preferredPlacement) {
      this.previousPlacement = null
      this.preferredPlacement = preferredPlacement
    }

    const anchor = this.anchor.getBoundingClientRect()
    const position = computeFloatingPosition({
      anchor,
      surface: {
        width: this.surface.offsetWidth,
        height: this.surface.offsetHeight,
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      preferredPlacement,
      previousPlacement: this.previousPlacement,
      offset: requestedOffset(this.getOffset(), this.defaultOffset),
    })

    this.previousPlacement = position.placement
    this.surface.style.left = `${position.left}px`
    this.surface.style.top = `${position.top}px`
    this.surface.setAttribute('data-side', position.side)
    const arrowPadding = 12
    const arrowX = Math.min(
      Math.max(
        anchor.left + anchor.width / 2 - position.left,
        arrowPadding,
      ),
      Math.max(arrowPadding, this.surface.offsetWidth - arrowPadding),
    )
    const arrowY = Math.min(
      Math.max(
        anchor.top + anchor.height / 2 - position.top,
        arrowPadding,
      ),
      Math.max(arrowPadding, this.surface.offsetHeight - arrowPadding),
    )
    this.surface.style.setProperty(
      '--sds-floating-arrow-x',
      `${arrowX}px`,
    )
    this.surface.style.setProperty(
      '--sds-floating-arrow-y',
      `${arrowY}px`,
    )
  }
}

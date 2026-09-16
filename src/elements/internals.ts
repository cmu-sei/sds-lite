let generatedId = 0

export function ensureId(element: HTMLElement, prefix: string): string {
  if (element.id) return element.id

  let id: string
  do {
    generatedId += 1
    id = `${prefix}-${generatedId}`
  } while (document.getElementById(id))

  element.id = id
  return id
}

export function directElementChildren(element: Element): HTMLElement[] {
  return Array.from(element.children).filter(
    (child): child is HTMLElement => child instanceof HTMLElement,
  )
}

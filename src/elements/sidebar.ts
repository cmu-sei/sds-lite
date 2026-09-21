let registered = false
const cleanupTimers = new WeakMap<HTMLElement, number>()

function clearClosingState(sidebar: HTMLElement): void {
  const timer = cleanupTimers.get(sidebar)
  if (timer !== undefined) window.clearTimeout(timer)
  cleanupTimers.delete(sidebar)
  sidebar.removeAttribute('sds-closing')
}

export function registerSdsSidebar(): void {
  if (registered || typeof document === 'undefined') return
  registered = true

  document.addEventListener(
    'beforetoggle',
    (event) => {
      if (
        !(event instanceof ToggleEvent) ||
        event.oldState !== 'open' ||
        event.newState !== 'closed' ||
        !(event.target instanceof HTMLElement) ||
        !event.target.matches('.sds-sidebar[popover]')
      ) {
        return
      }

      const sidebar = event.target
      clearClosingState(sidebar)
      sidebar.setAttribute('sds-closing', '')
      cleanupTimers.set(
        sidebar,
        window.setTimeout(() => clearClosingState(sidebar), 500),
      )
    },
    true,
  )

  document.addEventListener(
    'transitionend',
    (event) => {
      if (
        event.propertyName === 'transform' &&
        event.target instanceof HTMLElement &&
        event.target.matches('.sds-sidebar[sds-closing]')
      ) {
        clearClosingState(event.target)
      }
    },
    true,
  )
}

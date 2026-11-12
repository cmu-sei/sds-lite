let initialized = false
let frame = 0
const codeDialogs = new WeakMap<HTMLElement, HTMLDialogElement>()
const copyTimers = new WeakMap<HTMLButtonElement, number>()
const copyLabels = new WeakMap<HTMLButtonElement, { label: string | null; tooltipLabel: string }>()
const sortableTables = new WeakSet<HTMLTableElement>()
const tableCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

function setupSortableTables(): void {
  for (const table of document.querySelectorAll<HTMLTableElement>('.sds-app[data-sds-variant="documentation"] .sds-prose table')) {
    if (sortableTables.has(table)) continue
    const headers = [...(table.tHead?.rows[0]?.cells ?? [])]
    const bodies = [...table.tBodies]
    if (!headers.length || !bodies.length || headers.some(header => header.colSpan !== 1 || header.rowSpan !== 1 || header.querySelector('a, button, input, select')) || bodies.some(body => [...body.rows].some(row => row.cells.length !== headers.length || [...row.cells].some(cell => cell.colSpan !== 1 || cell.rowSpan !== 1)))) continue
    sortableTables.add(table)
    table.classList.add('sds-table')
    const icon = table.querySelector<HTMLTemplateElement>('template[data-sds-sort-icon]')?.content.firstElementChild
    const buttons = headers.map((header, index) => {
      const label = header.textContent?.trim() || `Column ${index + 1}`
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'sds-button'
      button.dataset.sdsVariant = 'text'
      button.setAttribute('aria-label', `Sort by ${label}`)
      button.append(...header.childNodes)
      if (icon) button.append(icon.cloneNode(true))
      else {
        const arrow = document.createElement('span')
        arrow.dataset.sdsSortArrow = ''
        arrow.setAttribute('aria-hidden', 'true')
        arrow.textContent = '\u2191'
        button.append(arrow)
      }
      header.append(button)
      header.setAttribute('aria-sort', 'none')
      button.addEventListener('click', () => {
        const ascending = header.getAttribute('aria-sort') !== 'ascending'
        for (const candidate of headers) candidate.setAttribute('aria-sort', 'none')
        header.setAttribute('aria-sort', ascending ? 'ascending' : 'descending')
        for (const body of bodies) {
          const rows = [...body.rows]
          rows.sort((left, right) => {
            const leftText = left.cells[index]?.textContent?.trim() ?? ''
            const rightText = right.cells[index]?.textContent?.trim() ?? ''
            const numeric = leftText !== '' && rightText !== '' && Number.isFinite(Number(leftText)) && Number.isFinite(Number(rightText))
            const comparison = numeric ? Number(leftText) - Number(rightText) : tableCollator.compare(leftText, rightText)
            return ascending ? comparison : -comparison
          })
          body.append(...rows)
        }
      })
      return button
    })
    for (const button of buttons) button.hidden = false
  }
}

function colorRoot(button: Element): HTMLElement {
  return button.closest<HTMLElement>('[data-sds-root]') ?? document.documentElement
}

function schemeStorageKey(root: HTMLElement): string | null {
  if (root === document.body || root === document.documentElement) return 'sds-color-scheme'
  return root.id ? `sds-color-scheme:${root.id}` : null
}

function isDark(root: HTMLElement): boolean {
  const scheme = root.dataset.sdsColorScheme
  return scheme === 'dark' || (scheme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
}

function updateControls(): void {
  for (const button of document.querySelectorAll<HTMLButtonElement>('button[data-sds-action]')) {
    const action = button.dataset.sdsAction
    if (action === 'toggle-color-scheme') {
      const dark = isDark(colorRoot(button))
      button.setAttribute('aria-pressed', String(dark))
      button.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode')
      button.title = button.getAttribute('aria-label')!
    } else if (action === 'toggle-fullscreen') {
      const active = Boolean(document.fullscreenElement)
      button.disabled = !document.fullscreenEnabled
      button.setAttribute('aria-pressed', String(active))
      button.setAttribute('aria-label', active ? 'Exit fullscreen' : 'Enter fullscreen')
      button.title = button.getAttribute('aria-label')!
    } else if (button.closest('.sds-code-block')) {
      button.hidden = false
    }
  }
}

function updateTocs(): void {
  frame = 0
  for (const toc of document.querySelectorAll<HTMLElement>('.sds-app-toc')) {
    const shell = toc.closest<HTMLElement>('.sds-app')
    if (shell?.dataset.sdsVariant !== 'documentation') continue
    const links = [...toc.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')]
    const entries = links.flatMap(link => {
      try {
        const heading = document.getElementById(decodeURIComponent(link.hash.slice(1)))
        return heading?.closest('.sds-app') === shell && /^H[2-6]$/.test(heading.tagName) ? [{ link, heading }] : []
      } catch {
        return []
      }
    })
    const header = shell.querySelector<HTMLElement>(':scope > .sds-app-header')
    const offset = Math.max(0, header?.getBoundingClientRect().bottom ?? 0) + 32
    let active: HTMLElement | undefined = entries[0]?.heading
    for (const { heading } of entries) {
      if (heading.getBoundingClientRect().top <= offset) active = heading
    }
    if (scrollY > 0 && Math.ceil(scrollY + innerHeight) >= document.documentElement.scrollHeight - 2) {
      active = entries.at(-1)?.heading
    }
    for (const { link, heading } of entries) {
      if (heading === active) link.setAttribute('aria-current', 'location')
      else link.removeAttribute('aria-current')
    }
  }
}

function setupTocs(): void {
  for (const toc of document.querySelectorAll<HTMLElement>('.sds-app-toc')) {
    const heading = toc.querySelector<HTMLElement>(':scope > strong')
    const oldIcon = heading?.querySelector(':scope > svg')
    if (heading && !oldIcon?.hasAttribute('data-sds-toc-icon')) {
      const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      icon.setAttribute('aria-hidden', 'true')
      icon.setAttribute('viewBox', '0 0 24 24')
      icon.setAttribute('fill', 'none')
      icon.setAttribute('stroke', 'currentColor')
      icon.setAttribute('stroke-width', '2')
      icon.setAttribute('stroke-linecap', 'round')
      icon.setAttribute('stroke-linejoin', 'round')
      icon.setAttribute('data-sds-toc-icon', '')
      for (const pathData of ['M3 5h.01', 'M3 12h.01', 'M3 19h.01', 'M8 5h13', 'M8 12h13', 'M8 19h13']) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        path.setAttribute('d', pathData)
        icon.append(path)
      }
      oldIcon?.replaceWith(icon)
      if (!oldIcon) heading.prepend(icon)
    }
    for (const link of [...toc.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')]) {
      try {
        const target = document.getElementById(decodeURIComponent(link.hash.slice(1)))
        if (!target || target.closest('.sds-app') !== toc.closest('.sds-app') || !/^H[2-6]$/.test(target.tagName)) link.closest('li')?.remove()
      } catch {
        link.closest('li')?.remove()
      }
    }
    for (const list of [...toc.querySelectorAll('ul')].reverse()) {
      if (!list.querySelector(':scope > li')) list.remove()
    }
  }
}

function scheduleTocs(): void {
  if (!frame) frame = requestAnimationFrame(updateTocs)
}

function codeStatus(block: HTMLElement, message: string, failure = false): void {
  const output = block.querySelector<HTMLOutputElement>(':scope > output')
  if (!output) return
  output.textContent = message
  output.classList.toggle('sds-sr-only', !failure)
}

function updateCodeTooltip(button: HTMLButtonElement): void {
  const tooltip = button.parentElement
  if (!tooltip?.matches('sds-tooltip')) return
  const content = [...tooltip.children].find(child => child !== button)
  const label = button.dataset.sdsTooltipLabel || button.getAttribute('aria-label') || 'Code action'
  if (content && content.textContent !== label) content.textContent = label
}

function hideCodeTooltip(button: HTMLButtonElement): void {
  button.parentElement?.querySelector<HTMLElement>(':scope > [role="tooltip"]')?.hidePopover()
}

function setCopySuccessIcon(button: HTMLButtonElement, copied: boolean): void {
  const existing = button.querySelector('[data-sds-copy-check]')
  const copyIcon = button.querySelector<SVGElement>('[data-sds-copy-icon]')
  if (!copied) {
    existing?.remove()
    copyIcon?.removeAttribute('hidden')
    button.removeAttribute('data-sds-copied')
    return
  }
  if (existing) return
  copyIcon?.setAttribute('hidden', '')
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  icon.setAttribute('aria-hidden', 'true')
  icon.setAttribute('viewBox', '0 0 24 24')
  icon.setAttribute('fill', 'none')
  icon.setAttribute('stroke', 'currentColor')
  icon.setAttribute('stroke-width', '2')
  icon.setAttribute('stroke-linecap', 'round')
  icon.setAttribute('stroke-linejoin', 'round')
  icon.setAttribute('data-sds-copy-check', '')
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('d', 'M20 6 9 17l-5-5')
  icon.append(path)
  button.append(icon)
  button.setAttribute('data-sds-copied', '')
}

function setupCodeTooltips(): void {
  for (const button of document.querySelectorAll<HTMLButtonElement>('.sds-code-block > header > nav > button[data-sds-action], .sds-code-block > header > nav > sds-tooltip > button[data-sds-action]')) {
    const label = button.dataset.sdsTooltipLabel || button.title || button.getAttribute('aria-label') || 'Code action'
    button.dataset.sdsTooltipLabel = label
    button.removeAttribute('title')
    if (button.dataset.sdsAction === 'copy-code') {
      button.querySelector<SVGElement>('svg:not([data-sds-copy-check])')?.setAttribute('data-sds-copy-icon', '')
    }
    if (button.parentElement?.matches('sds-tooltip')) {
      button.parentElement.querySelector(':scope > [role="tooltip"]')?.classList.add('sds-code-tooltip-content')
      updateCodeTooltip(button)
      continue
    }
    const tooltip = document.createElement('sds-tooltip')
    tooltip.setAttribute('size', 'auto')
    const content = document.createElement('span')
    content.className = 'sds-code-tooltip-content'
    content.textContent = label
    const parent = button.parentElement
    const next = button.nextSibling
    if (!parent) continue
    tooltip.append(button, content)
    parent.insertBefore(tooltip, next)
  }
  for (const badge of document.querySelectorAll<HTMLElement>('.sds-code-block > header > .sds-badge[aria-label]')) {
    const label = badge.getAttribute('aria-label') || 'Code quality'
    badge.removeAttribute('title')
    if (badge.parentElement?.matches('sds-tooltip')) continue
    const tooltip = document.createElement('sds-tooltip')
    tooltip.setAttribute('size', 'auto')
    const content = document.createElement('span')
    content.className = 'sds-code-tooltip-content'
    content.textContent = label
    const parent = badge.parentElement
    const next = badge.nextSibling
    if (!parent) continue
    tooltip.append(badge, content)
    parent.insertBefore(tooltip, next)
  }
}

function setupNavigationBackButtons(): void {
  for (const button of document.querySelectorAll<HTMLButtonElement>('.sds-navigation-panel button[data-sds-action="navigation-back"]')) {
    if (button.querySelector('[data-sds-navigation-back-label]')) continue
    const text = [...button.childNodes].find(node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim())
    if (!text) continue
    const label = document.createElement('span')
    label.dataset.sdsNavigationBackLabel = ''
    label.textContent = text.textContent?.trim() ?? ''
    text.replaceWith(label)
  }
}

function setupNavigationOverviewLinks(): void {
  const overviewLinks = [...document.querySelectorAll<HTMLAnchorElement>('.sds-app-header .site-primary-overview > a')]
  for (const panel of document.querySelectorAll<HTMLDetailsElement>('.sds-sidebar .sds-navigation-panel')) {
    const heading = panel.querySelector<HTMLElement>(':scope > div > strong')
    if (!heading) continue
    const title = heading.textContent?.trim()
    const target = overviewLinks.find(link => link.textContent?.trim() === title)
    if (!target) continue
    const link = document.createElement('a')
    link.href = target.href
    link.dataset.sdsNavigationOverview = ''
    link.textContent = title ?? ''
    if (target.hasAttribute('aria-current')) link.setAttribute('aria-current', target.getAttribute('aria-current')!)
    heading.replaceWith(link)
  }
}

function setupPrimaryOverviewLinks(): void {
  for (const item of document.querySelectorAll<HTMLElement>('.sds-app-header .sds-dropdown-menu > li.site-primary-overview')) {
    const link = item.querySelector<HTMLAnchorElement>(':scope > a')
    if (!link) continue
    link.dataset.sdsVariant = 'cta'
    const target = new URL(link.href, document.baseURI)
    if (target.origin === location.origin && target.pathname === location.pathname) {
      link.setAttribute('aria-current', 'page')
    } else {
      link.removeAttribute('aria-current')
    }
    if (item.querySelector(':scope > hr.sds-dropdown-divider')) continue
    const divider = document.createElement('hr')
    divider.className = 'sds-dropdown-divider'
    item.append(divider)
  }
}

function removeFooterAcknowledgment(): void {
  document.querySelector<HTMLElement>('.sds-app-footer > p[data-sds-margin="none"]')?.remove()
}

function toggleCodeFullscreen(block: HTMLElement, button: HTMLButtonElement): void {
  const existing = codeDialogs.get(block)
  if (existing) {
    existing.close()
    return
  }
  const placeholder = document.createElement('div')
  placeholder.className = '_sds-code-placeholder'
  placeholder.style.blockSize = `${block.getBoundingClientRect().height}px`
  const style = getComputedStyle(block)
  placeholder.style.marginBlockStart = style.marginBlockStart
  placeholder.style.marginBlockEnd = style.marginBlockEnd
  placeholder.setAttribute('aria-hidden', 'true')
  block.before(placeholder)
  const dialog = document.createElement('dialog')
  dialog.className = 'sds-dialog'
  dialog.setAttribute('aria-label', block.querySelector('header strong')?.textContent || 'Code example fullscreen')
  const previousLabel = button.getAttribute('aria-label')
  const previousTooltipLabel = button.getAttribute('data-sds-tooltip-label')
  const previousOverflow = document.documentElement.style.overflow
  dialog.addEventListener('close', () => {
    block.removeAttribute('data-sds-code-fullscreen')
    placeholder.replaceWith(block)
    dialog.remove()
    codeDialogs.delete(block)
    document.documentElement.style.overflow = previousOverflow
    button.setAttribute('aria-pressed', 'false')
    if (previousLabel === null) button.removeAttribute('aria-label')
    else button.setAttribute('aria-label', previousLabel)
    if (previousTooltipLabel === null) button.removeAttribute('data-sds-tooltip-label')
    else button.setAttribute('data-sds-tooltip-label', previousTooltipLabel)
    updateCodeTooltip(button)
    button.focus({ preventScroll: true })
  }, { once: true })
  placeholder.after(dialog)
  dialog.append(block)
  block.setAttribute('data-sds-code-fullscreen', '')
  codeDialogs.set(block, dialog)
  button.setAttribute('aria-pressed', 'true')
  button.setAttribute('aria-label', 'Exit fullscreen')
  button.dataset.sdsTooltipLabel = 'Exit fullscreen'
  updateCodeTooltip(button)
  document.documentElement.style.overflow = 'hidden'
  dialog.showModal()
  button.focus()
  hideCodeTooltip(button)
}

async function returnNavigationPanel(panel: HTMLDetailsElement): Promise<void> {
  if (panel.hasAttribute('data-sds-leaving')) return
  panel.setAttribute('data-sds-leaving', '')
  const content = panel.querySelector<HTMLElement>(':scope > div')
  await Promise.allSettled((content?.getAnimations() ?? []).map(animation => animation.finished))
  if (!panel.hasAttribute('data-sds-leaving')) return
  panel.removeAttribute('data-sds-leaving')
  panel.open = false
  const parent = panel.closest('ul')
  parent?.setAttribute('data-sds-returning', '')
  if (panel.closest('.sds-sidebar')?.matches(':popover-open')) {
    panel.querySelector<HTMLElement>(':scope > summary')?.focus({ preventScroll: true })
  }
  await Promise.allSettled((parent?.getAnimations() ?? []).map(animation => animation.finished))
  parent?.removeAttribute('data-sds-returning')
}

async function handleAction(event: MouseEvent): Promise<void> {
  if (!(event.target instanceof Element)) return
  const sidebar = event.target.closest<HTMLAnchorElement>('.sds-sidebar a[href]')?.closest<HTMLElement>('.sds-sidebar[popover]:popover-open')
  if (sidebar && matchMedia('(width < 64rem)').matches) sidebar.hidePopover()
  for (const disclosure of document.querySelectorAll<HTMLDetailsElement>('.sds-app-navigation details[open]:not(.sds-navigation-panel)')) {
    if (!disclosure.contains(event.target)) disclosure.open = false
  }
  const button = event.target.closest<HTMLButtonElement>('button[data-sds-action]')
  if (!button || button.disabled || event.defaultPrevented) return
  const action = button.dataset.sdsAction
  if (action !== 'copy-code' && button.closest('.sds-code-block')) {
    hideCodeTooltip(button)
  }
  if (action === 'navigation-back') {
    const panel = button.closest<HTMLDetailsElement>('.sds-sidebar .sds-navigation-panel')
    if (panel) await returnNavigationPanel(panel)
    return
  }
  if (action === 'toggle-color-scheme') {
    const root = colorRoot(button)
    root.dataset.sdsColorScheme = isDark(root) ? 'light' : 'dark'
    const key = schemeStorageKey(root)
    if (key) {
      try { localStorage.setItem(key, root.dataset.sdsColorScheme) } catch {}
    }
    updateControls()
    return
  }
  if (action === 'toggle-fullscreen') {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await document.documentElement.requestFullscreen()
    } catch {}
    updateControls()
    return
  }
  const block = button.closest<HTMLElement>('.sds-code-block')
  if (!block) return
  if (action === 'toggle-code-fullscreen') {
    toggleCodeFullscreen(block, button)
  } else if (action === 'toggle-complete-code') {
    const complete = button.getAttribute('aria-pressed') !== 'true'
    button.setAttribute('aria-pressed', String(complete))
    for (const slot of block.querySelectorAll<HTMLElement>('[data-sds-code-slot]')) {
      slot.hidden = slot.dataset.sdsCodeSlot !== (complete ? 'complete' : 'default')
    }
    codeStatus(block, '')
  } else if (action === 'copy-code') {
    const code = [...block.querySelectorAll<HTMLElement>('[data-sds-code-slot]:not([hidden]) pre code')]
    const text = code.length ? code.map(element => element.textContent).join('\n') : block.querySelector('pre code')?.textContent
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      if (!button.isConnected) return
      if (!copyLabels.has(button)) {
        copyLabels.set(button, {
          label: button.getAttribute('aria-label'),
          tooltipLabel: button.dataset.sdsTooltipLabel || button.getAttribute('aria-label') || 'Copy to clipboard',
        })
      }
      const original = copyLabels.get(button)!
      button.setAttribute('aria-label', 'Copied')
      button.dataset.sdsTooltipLabel = 'Copied'
      setCopySuccessIcon(button, true)
      updateCodeTooltip(button)
      codeStatus(block, 'Code copied.')
      clearTimeout(copyTimers.get(button))
      copyTimers.set(button, window.setTimeout(() => {
        if (original.label === null) button.removeAttribute('aria-label')
        else button.setAttribute('aria-label', original.label)
        button.dataset.sdsTooltipLabel = original.tooltipLabel
        setCopySuccessIcon(button, false)
        updateCodeTooltip(button)
        copyLabels.delete(button)
        copyTimers.delete(button)
        codeStatus(block, '')
      }, 2000))
    } catch {
      codeStatus(block, 'Copy failed. Select the code and copy it manually.', true)
    }
  }
}

export function setupSdsDocumentation(): void {
  if (initialized || typeof document === 'undefined') return
  if (!document.body) {
    document.addEventListener('DOMContentLoaded', setupSdsDocumentation, { once: true })
    return
  }
  initialized = true
  const roots = new Set([...document.querySelectorAll<HTMLButtonElement>('button[data-sds-action="toggle-color-scheme"]')].map(colorRoot))
  for (const root of roots) {
    const key = schemeStorageKey(root)
    if (!key || root.dataset.sdsColorScheme !== 'system') continue
    try {
      const saved = localStorage.getItem(key)
      if (saved === 'light' || saved === 'dark') root.dataset.sdsColorScheme = saved
    } catch {}
  }
  document.addEventListener('click', event => { void handleAction(event) })
  document.addEventListener('toggle', event => {
    const target = event.target
    if (!(target instanceof HTMLElement)) return
    if (target instanceof HTMLDetailsElement && target.matches('.sds-sidebar .sds-navigation-panel')) {
      if (target.open) target.querySelector<HTMLElement>('[data-sds-action="navigation-back"]')?.focus({ preventScroll: true })
      else for (const panel of target.querySelectorAll<HTMLDetailsElement>('.sds-navigation-panel[open]')) panel.open = false
    } else if (target.matches('.sds-sidebar[popover]') && 'newState' in event && event.newState === 'closed') {
      for (const panel of target.querySelectorAll<HTMLDetailsElement>('.sds-navigation-panel[open]')) {
        panel.removeAttribute('data-sds-leaving')
        panel.open = false
      }
      for (const parent of target.querySelectorAll('[data-sds-returning]')) parent.removeAttribute('data-sds-returning')
    }
  }, true)
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return
    const codeDialog = document.querySelector<HTMLDialogElement>('dialog.sds-dialog:modal:has(> .sds-code-block)')
    if (codeDialog) {
      event.preventDefault()
      codeDialog.close()
      return
    }
    if (event.defaultPrevented || document.querySelector('dialog:modal')) return
    const disclosure = [...document.querySelectorAll<HTMLDetailsElement>('.sds-app-navigation details[open]')].at(-1)
    if (!disclosure) return
    event.preventDefault()
    const sidebar = disclosure.closest<HTMLElement>('.sds-sidebar[popover]:popover-open')
    if (disclosure.matches('.sds-navigation-panel') && sidebar && matchMedia('(width < 64rem)').matches) {
      sidebar.hidePopover()
      return
    }
    disclosure.open = false
    disclosure.querySelector<HTMLElement>(':scope > summary')?.focus()
  })
  document.addEventListener('fullscreenchange', updateControls)
  window.addEventListener('scroll', scheduleTocs, { passive: true })
  window.addEventListener('resize', scheduleTocs)
  window.addEventListener('hashchange', scheduleTocs)
  window.addEventListener('pageshow', scheduleTocs)
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateControls)
  new MutationObserver(() => { setupSortableTables(); setupCodeTooltips(); setupNavigationBackButtons(); setupPrimaryOverviewLinks(); setupNavigationOverviewLinks(); setupTocs(); removeFooterAcknowledgment(); updateControls(); scheduleTocs() }).observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-sds-root', 'data-sds-color-scheme'],
  })
  setupSortableTables()
  setupCodeTooltips()
  setupNavigationBackButtons()
  setupPrimaryOverviewLinks()
  setupNavigationOverviewLinks()
  setupTocs()
  removeFooterAcknowledgment()
  updateControls()
  scheduleTocs()
}

setupSdsDocumentation()
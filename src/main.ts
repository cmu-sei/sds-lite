import './style.css'
import './brand.css'
import { setupSds, type SdsComboboxSelectDetail } from './sds.ts'

setupSds()

const teamInput = document.querySelector<HTMLInputElement>('#remote-combobox')
const teamOptions = document.querySelector<HTMLUListElement>('#team-options')
const teams = ['Accessibility', 'Engineering', 'Research']
teamInput?.addEventListener('input', () => {
  if (!teamOptions) return
  const matches = teams.filter((team) =>
    team.toLowerCase().includes(teamInput.value.toLowerCase()),
  )
  teamOptions.replaceChildren(...matches.map((team) => {
    const option = document.createElement('li')
    option.textContent = team
    return option
  }))
})

const records = new Map([
  ['p-atlas', { id: 'p-atlas', name: 'Atlas', team: 'Research', owner: 'Avery' }],
  ['p-orion', { id: 'p-orion', name: 'Orion', team: 'Operations', owner: 'Blair' }],
  ['p-vega', { id: 'p-vega', name: 'Vega', team: 'Engineering', owner: 'Casey' }],
])
const recordPicker = document.querySelector('sds-combobox#record-picker')
const recordInput = document.querySelector<HTMLInputElement>('#record-combobox')
const recordId = document.querySelector<HTMLInputElement>('#record-id')
const recordSelection = document.querySelector<HTMLElement>('#record-selection')

recordInput?.addEventListener('input', () => {
  if (recordId) recordId.value = ''
  if (recordSelection) recordSelection.textContent = ''
})
recordPicker?.addEventListener('sds-select', (event) => {
  const { option, value } = (event as CustomEvent<SdsComboboxSelectDetail>).detail
  const record = records.get(value)
  if (!record) {
    console.error('The selected project record is missing.', option)
    return
  }
  if (recordId) recordId.value = record.id
  if (recordSelection) {
    recordSelection.textContent = `${record.name}: ${record.team}, owner ${record.owner} (ID ${record.id})`
  }
  if (recordInput) recordInput.value = ''
})
document.querySelector<HTMLFormElement>('#record-form')?.addEventListener('reset', () => {
  if (recordId) recordId.value = ''
  if (recordSelection) recordSelection.textContent = ''
})

const topicPicker = document.querySelector('sds-combobox#topic-picker')
const topicInput = document.querySelector<HTMLInputElement>('#topic-combobox')
const topicTags = document.querySelector<HTMLElement>('#topic-tags')
const topicStatus = document.querySelector<HTMLElement>('#topic-status')

topicPicker?.addEventListener('sds-select', (event) => {
  const { option } = (event as CustomEvent<{ option: HTMLLIElement }>).detail
  const label = option.textContent?.trim() ?? ''
  option.setAttribute('aria-disabled', 'true')

  const tag = document.createElement('button')
  tag.type = 'button'
  tag.className = 'sds-tag'
  tag.dataset.sdsTone = 'danger'
  tag.setAttribute('aria-label', `Remove ${label}`)
  const text = document.createElement('span')
  text.className = 'sds-tag-label'
  text.textContent = label
  const icon = document.createElement('span')
  icon.className = 'sds-tag-action'
  icon.dataset.sdsTone = 'danger'
  icon.setAttribute('aria-hidden', 'true')
  icon.textContent = '×'
  tag.addEventListener('click', () => {
    option.removeAttribute('aria-disabled')
    tag.remove()
    if (topicStatus) topicStatus.textContent = `${label} removed.`
  })
  tag.append(text, icon)
  topicTags?.append(tag)
  if (topicInput) topicInput.value = ''
  if (topicStatus) topicStatus.textContent = `${label} added.`
})

const root = document.querySelector<HTMLElement>('[data-sds-root]')
const themeSelect = document.querySelector<HTMLSelectElement>('#theme')
const colorSchemeSelect =
  document.querySelector<HTMLSelectElement>('#color-scheme')

themeSelect?.addEventListener('change', () => {
  root?.setAttribute('data-sds-theme', themeSelect.value)
})

colorSchemeSelect?.addEventListener('change', () => {
  root?.setAttribute('data-sds-color-scheme', colorSchemeSelect.value)
})

const layoutExamples = document.getElementById('layout-examples')
if (layoutExamples) {
  layoutExamples.firstElementChild?.remove()
  document.getElementById('layouts')?.append(layoutExamples)
}

for (const button of document.querySelectorAll<HTMLElement>('[data-copy-source]')) {
  const source = document.getElementById(button.dataset.copySource ?? '')
  const target = document.getElementById(button.dataset.copyTarget ?? '')
  const code = target?.querySelector('code')
  if (source && code) code.textContent = source.outerHTML
}

const addCopyExample = (example: HTMLElement, name: string, fullPage = false) => {
  const clone = example.cloneNode(true) as HTMLElement
  for (const element of [clone, ...clone.querySelectorAll<HTMLElement>('*')]) {
    element.removeAttribute('data-copy-layout')
    element.removeAttribute('data-copy-example')
  }

  if (fullPage) {
    const variant = clone.dataset.sdsVariant
    const content = clone.querySelector<HTMLElement>(`#${variant}-page-content`)
    if (content) content.id = 'page-content'
    for (const link of clone.querySelectorAll<HTMLAnchorElement>('a[href="#composition"]')) {
      link.setAttribute('href', '#page-content')
    }
    const main = clone.querySelector('.sds-app-main, .sds-brochure-main')
    if (main) {
      const semanticMain = document.createElement('main')
      for (const attribute of main.attributes) semanticMain.setAttribute(attribute.name, attribute.value)
      semanticMain.append(...main.childNodes)
      main.replaceWith(semanticMain)
    }
  }
  for (const control of clone.querySelectorAll('[data-copy-target]')) {
    const targetId = control.getAttribute('data-copy-target')
    if (targetId) clone.querySelector(`#${CSS.escape(targetId)}`)?.remove()
    control.remove()
  }

  const details = document.createElement('details')
  details.className = 'sds-disclosure'
  const summary = document.createElement('summary')
  summary.textContent = `${name} HTML`
  const pre = document.createElement('pre')
  pre.id = `copy-example-${document.querySelectorAll('[id^="copy-example-"]').length + 1}`
  pre.tabIndex = 0
  const code = document.createElement('code')
  const markup = clone.outerHTML
  const setup = document.getElementById('cdn-install')?.textContent ?? ''
  const brand = setup.match(/href="([^"]+\/sds\.css)"/)?.[1].replace('/sds.css', '/brand.css')
  code.textContent = fullPage
    ? `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>${name}</title>\n${setup}\n${brand ? `<link rel="stylesheet" href="${brand}">` : ''}\n</head>\n<body class="sds-document" data-sds-root data-sds-theme="${clone.dataset.sdsTheme}">\n${markup}\n</body>\n</html>`
    : markup
  pre.append(code)
  const prose = document.createElement('div')
  prose.className = 'sds-prose'
  prose.append(pre)
  details.append(summary, prose)
  const actions = document.createElement('div')
  actions.className = 'sds-cluster'
  actions.dataset.sdsGap = 'sm'
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'sds-button'
  button.dataset.copyTarget = pre.id
  button.textContent = fullPage ? `Copy ${name.toLowerCase()} page` : `Copy ${name.toLowerCase()} markup`
  actions.append(button)
  if (fullPage) {
    const layoutDetails = document.createElement('details')
    layoutDetails.className = 'sds-disclosure'
    const layoutSummary = document.createElement('summary')
    layoutSummary.textContent = `${name} layout HTML`
    const layoutPre = document.createElement('pre')
    layoutPre.id = `${pre.id}-layout`
    layoutPre.tabIndex = 0
    const layoutCode = document.createElement('code')
    layoutCode.textContent = markup
    layoutPre.append(layoutCode)
    const layoutProse = document.createElement('div')
    layoutProse.className = 'sds-prose'
    layoutProse.append(layoutPre)
    layoutDetails.append(layoutSummary, layoutProse)
    const layoutButton = document.createElement('button')
    layoutButton.type = 'button'
    layoutButton.className = 'sds-button'
    layoutButton.dataset.sdsVariant = 'outlined'
    layoutButton.dataset.copyTarget = layoutPre.id
    layoutButton.textContent = `Copy ${name.toLowerCase()} layout`
    actions.append(layoutButton)
    const patterns = document.createElement('a')
    patterns.className = 'sds-button'
    patterns.dataset.sdsVariant = 'text'
    patterns.href = '#patterns'
    patterns.textContent = 'Page patterns'
    actions.append(patterns)
    const preview = example.closest('details')
    summary.textContent = `${name} page HTML`
    const heading = document.createElement('div')
    heading.className = 'sds-cluster'
    heading.dataset.sdsGap = 'sm'
    const title = document.createElement('h3')
    title.className = 'sds-text-h3'
    title.textContent = name
    const theme = document.createElement('span')
    theme.className = 'sds-badge'
    theme.textContent = clone.dataset.sdsTheme === 'plaid' ? 'Plaid' : 'Forge'
    heading.append(title, theme)
    preview?.before(heading, actions, details, layoutDetails)
  } else {
    const tools = document.createElement('header')
    tools.className = 'sds-section-header'
    tools.dataset.exampleTools = ''
    const label = document.createElement('strong')
    label.className = 'sds-card-label'
    label.textContent = `${name} ${example.hasAttribute('data-copy-example') ? 'pattern' : 'recipe'}`
    button.dataset.sdsDensity = 'compact'
    button.dataset.sdsVariant = 'outlined'
    tools.append(label, actions)
    details.dataset.exampleSource = ''
    example.before(tools, details)
  }
}

for (const layout of document.querySelectorAll<HTMLElement>('[data-copy-layout]')) {
  addCopyExample(layout, layout.dataset.copyLayout ?? 'Layout', true)
}
for (const pattern of document.querySelectorAll<HTMLElement>('[data-copy-example]')) {
  addCopyExample(pattern, pattern.closest<HTMLElement>('[data-pattern]')?.dataset.pattern ?? 'Pattern')
}
for (const recipe of document.querySelectorAll<HTMLElement>(
  '#composition > article, #forms > article, #content > article, #prose > article, #navigation > article, #loading > article, #actions > article, #feedback > article, #structure > article',
)) {
  addCopyExample(recipe, recipe.querySelector('h3, h4')?.textContent?.trim() ?? 'Recipe')
}

const sectionNavigation = document.querySelector<HTMLElement>(
  '.sds-sidebar > nav',
)
const sectionScroller = document.querySelector<HTMLElement>('.sds-app-body')
const sectionLinks = Array.from(
  sectionNavigation?.querySelectorAll<HTMLAnchorElement>('a[href^="#"]') ?? [],
).flatMap((link) => {
  const section = document.getElementById(link.hash.slice(1))
  return section ? [{ link, section }] : []
})

if (sectionNavigation && sectionScroller && sectionLinks.length > 0) {
  const setCurrentSection = (current: HTMLElement) => {
    for (const { link, section } of sectionLinks) {
      if (section === current) link.setAttribute('aria-current', 'location')
      else link.removeAttribute('aria-current')
    }
  }
  const initialSection =
    sectionLinks.find(({ link }) => link.hash === window.location.hash)?.section ??
    sectionLinks[0].section
  const visibleSections = new Set<HTMLElement>()

  setCurrentSection(initialSection)

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!(entry.target instanceof HTMLElement)) continue
        if (entry.isIntersecting) visibleSections.add(entry.target)
        else visibleSections.delete(entry.target)
      }

      const current = [...visibleSections].sort(
        (first, second) =>
          first.getBoundingClientRect().top - second.getBoundingClientRect().top,
      )[0]
      if (current) setCurrentSection(current)
    },
    { root: sectionScroller, rootMargin: '-12% 0px -75% 0px' },
  )

  for (const { section } of sectionLinks) sectionObserver.observe(section)
}

const copyStatus = document.querySelector<HTMLElement>('#copy-status')

for (const button of document.querySelectorAll<HTMLButtonElement>(
  '[data-copy-target]',
)) {
  button.addEventListener('click', async () => {
    const targetId = button.dataset.copyTarget
    const target = targetId ? document.getElementById(targetId) : null

    if (!target) {
      const message = `Copy target "${targetId ?? ''}" was not found.`
      copyStatus && (copyStatus.textContent = message)
      console.error(message)
      return
    }

    const originalLabel = button.textContent

    try {
      await navigator.clipboard.writeText(target.textContent ?? '')
      button.textContent = 'Copied'
      copyStatus && (copyStatus.textContent = 'Example copied to clipboard.')
    } catch (error) {
      button.textContent = 'Copy failed'
      copyStatus &&
        (copyStatus.textContent =
          'The browser could not copy the example to the clipboard.')
      console.error('Could not copy the SDS Lite example.', error)
    }

    window.setTimeout(() => {
      button.textContent = originalLabel
    }, 2000)
  })
}

for (const button of document.querySelectorAll<HTMLButtonElement>(
  '[data-sds-callout-close]',
)) {
  button.addEventListener('click', () => {
    const callout = button.closest<HTMLElement>('.sds-callout')
    if (!callout) {
      console.error('Callout close control is not inside an SDS callout.')
      return
    }
    callout.hidden = true
  })
}

document.addEventListener('submit', (event) => event.preventDefault())

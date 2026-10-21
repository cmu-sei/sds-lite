import './style.css'
import './brand.css'
import { setupSds, type SdsComboboxSelectDetail } from './sds.ts'
import { setupSelectionExample } from '../docs/examples/selection.js'
import { setupTableSelectionExample } from '../docs/examples/table-selection.js'
import { setupMultipleSelectionExample } from '../docs/examples/multiple-selection.js'
import { setupInputActionsExample } from '../docs/examples/input-actions.js'
import { setupDateRangeExample } from '../docs/examples/date-range.js'
import { setupFileUploadExample } from '../docs/examples/file-upload.js'
import selectionSource from '../docs/examples/selection.js?raw'
import tableSource from '../docs/examples/table-selection.js?raw'
import multipleSource from '../docs/examples/multiple-selection.js?raw'
import inputSource from '../docs/examples/input-actions.js?raw'
import dateSource from '../docs/examples/date-range.js?raw'
import uploadSource from '../docs/examples/file-upload.js?raw'

setupSds()
setupSelectionExample()
setupTableSelectionExample()
setupMultipleSelectionExample()
setupInputActionsExample()
setupDateRangeExample()
setupFileUploadExample()

const recipeSources: Record<string, string> = {
  selection: selectionSource,
  'table-selection': tableSource,
  'multiple-selection': multipleSource,
  'input-actions': inputSource,
  'date-range': dateSource,
  'file-upload': uploadSource,
}

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

const exampleEntries: {
  element: HTMLElement
  title: string
  kind: string
  section: HTMLElement
  terms: string
}[] = []

const addCopyExample = (example: HTMLElement, name: string, fullPage = false) => {
  const scriptName = example.dataset.recipeScript
  const script = scriptName ? recipeSources[scriptName] : undefined
  if (scriptName && !script) throw new Error(`Unknown example script: ${scriptName}`)
  const originalHeading = !fullPage && !example.hasAttribute('data-copy-example')
    ? example.querySelector<HTMLHeadingElement>('h3, h4')
    : null
  if (originalHeading) originalHeading.dataset.sdsSize = 'sm'
  const clone = example.cloneNode(true) as HTMLElement
  for (const element of [clone, ...clone.querySelectorAll<HTMLElement>('*')]) {
    element.removeAttribute('data-copy-layout')
    element.removeAttribute('data-copy-example')
    element.removeAttribute('data-recipe-script')
    element.removeAttribute('data-search-terms')
  }

  if (fullPage) {
    const variant = clone.dataset.sdsVariant
    const content = clone.querySelector<HTMLElement>(`#${variant}-page-content`)
    if (content) content.id = 'page-content'
    for (const link of clone.querySelectorAll<HTMLAnchorElement>('a[href="#composition"]')) {
      link.setAttribute('href', '#page-content')
    }
    const main = clone.querySelector('.sds-app-main')
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
  details.dataset.exampleSource = ''
  details.dataset.sourceLabel = `${name} HTML`
  const summary = document.createElement('summary')
  summary.textContent = script ? 'View HTML + JavaScript' : 'View HTML'
  const pre = document.createElement('pre')
  pre.id = `copy-example-${document.querySelectorAll('[id^="copy-example-"]').length + 1}`
  pre.tabIndex = 0
  const code = document.createElement('code')
  const markup = clone.outerHTML
  const setup = document.getElementById('cdn-install')?.textContent ?? ''
  const brand = setup.match(/href="([^"]+\/sds\.css)"/)?.[1].replace('/sds.css', '/brand.css')
  code.textContent = fullPage
    ? `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>${name}</title>\n${setup}\n${brand ? `<link rel="stylesheet" href="${brand}">` : ''}\n</head>\n<body class="sds-document" data-sds-root data-sds-theme="${clone.dataset.sdsTheme}">\n${markup}\n</body>\n</html>`
    : `${markup}${script ? `\n<script type="module">\n${script}\n</script>` : ''}`
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
  button.dataset.sdsDensity = 'compact'
  button.dataset.sdsVariant = 'outlined'
  button.dataset.copyTarget = pre.id
  button.textContent = script ? 'Copy HTML + JS' : fullPage ? 'Copy page' : 'Copy HTML'
  button.setAttribute('aria-label', fullPage ? `Copy ${name.toLowerCase()} page`
    : script ? `Copy ${name.toLowerCase()} HTML + JavaScript` : `Copy ${name.toLowerCase()} markup`)
  actions.append(button)
  const tools = document.createElement('header')
  tools.className = 'sds-section-header'
  tools.dataset.exampleTools = ''
  tools.tabIndex = -1
  const heading = document.createElement('div')
  heading.className = 'sds-stack'
  heading.dataset.sdsGap = 'xs'
  const kind = fullPage ? 'Page starter' : example.hasAttribute('data-copy-example')
    ? 'Page pattern' : script ? 'Application recipe' : 'Component example'
  const label = document.createElement('p')
  label.className = 'sds-eyebrow'
  label.textContent = fullPage ? `${kind} / ${clone.dataset.sdsTheme === 'plaid' ? 'Plaid' : 'Forge'}` : kind
  const title = originalHeading ?? document.createElement('h3')
  originalHeading?.replaceWith(document.createComment('playground example heading'))
  if (!originalHeading) {
    title.className = 'sds-text-h3'
    title.dataset.sdsSize = 'sm'
    title.textContent = name
  }
  heading.append(label, title)
  tools.append(heading, actions)
  let container: HTMLElement
  if (fullPage) {
    const layoutDetails = document.createElement('details')
    layoutDetails.className = 'sds-disclosure'
    const layoutSummary = document.createElement('summary')
    layoutSummary.textContent = 'View layout HTML'
    layoutDetails.dataset.sourceLabel = `${name} layout HTML`
    layoutDetails.dataset.exampleSource = ''
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
    layoutButton.dataset.sdsDensity = 'compact'
    layoutButton.dataset.copyTarget = layoutPre.id
    layoutButton.textContent = 'Copy layout'
    layoutButton.setAttribute('aria-label', `Copy ${name.toLowerCase()} layout`)
    actions.append(layoutButton)
    const preview = example.closest('details')
    if (!preview) throw new Error(`Missing preview disclosure for ${name}.`)
    summary.textContent = 'View page HTML'
    details.dataset.sourceLabel = `${name} page HTML`
    container = document.createElement('article')
    container.className = 'sds-card sds-stack'
    container.dataset.sdsGap = 'lg'
    container.dataset.sdsPadding = 'md'
    container.id = `page-starter-${clone.dataset.sdsVariant}`
    preview.before(container)
    container.append(tools, preview, details, layoutDetails)
  } else {
    const preview = document.createElement('div')
    preview.className = 'sds-stack'
    preview.dataset.examplePreview = ''
    if (example.hasAttribute('data-copy-example')) {
      const pattern = example.closest<HTMLElement>('[data-pattern]')
      if (!pattern) throw new Error(`Missing pattern container for ${name}.`)
      container = pattern
      container.classList.add('sds-card')
      preview.append(example)
    } else {
      container = example
      preview.append(...example.childNodes)
    }
    container.replaceChildren(tools, preview, details)
  }
  container.dataset.exampleContainer = ''
  const section = container.closest<HTMLElement>('main#top > .sds-page > section')
  if (!section) throw new Error(`Missing catalog section for ${name}.`)
  exampleEntries.push({
    element: container,
    title: name,
    kind,
    section,
    terms: `${name} ${example.dataset.searchTerms ?? ''} ${kind}`.toLocaleLowerCase(),
  })
}

const catalogElements = Array.from(document.querySelectorAll<HTMLElement>(
  'main#top > .sds-page > section[id], main#top > .sds-page > section[id] > article',
))
for (const [index, element] of catalogElements.entries()) {
  if (!element.id) element.id = `catalog-recipe-${index}`
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

const catalogSections = catalogElements.filter(element => element.matches('section'))
for (const section of catalogSections) {
  const examples = exampleEntries.filter(entry => entry.section === section)
  if (examples.length < 2) continue
  const index = document.createElement('nav')
  index.className = 'sds-stack'
  index.dataset.sdsGap = 'sm'
  index.setAttribute('aria-label', `${section.querySelector('h2')?.textContent?.trim() ?? section.id} examples`)
  index.dataset.exampleIndex = ''
  const label = document.createElement('p')
  label.className = 'sds-eyebrow'
  label.textContent = 'Examples'
  const links = document.createElement('div')
  links.className = 'sds-cluster'
  links.dataset.sdsGap = 'sm'
  for (const entry of examples) {
    const link = document.createElement('a')
    link.className = 'sds-button'
    link.dataset.sdsVariant = 'outlined'
    link.dataset.sdsTone = 'neutral'
    link.dataset.sdsDensity = 'compact'
    link.href = `#${entry.element.id}`
    link.textContent = entry.title
    links.append(link)
  }
  index.append(label, links)
  section.querySelector(':scope > .sds-section-header')?.after(index)
}

const aliases: Record<string, string> = {
  actions: 'buttons links icon button',
  forms: 'input checkbox radio switch select textarea validation',
  navigation: 'accordion disclosure breadcrumb pagination tabs menu dropdown',
  structure: 'drawer sheet panel modal dialog tooltip popover',
  loading: 'skeleton spinner progress empty state no results',
  composition: 'grid stack cluster responsive layout spacing',
}
const searchEntries = [
  ...catalogSections.map(element => ({
    element,
    title: element.querySelector('h2')?.textContent?.trim() ?? element.id,
    kind: 'Section',
    section: element,
    terms: `${element.querySelector('h2')?.textContent ?? ''} ${aliases[element.id] ?? ''}`.toLocaleLowerCase(),
  })),
  ...exampleEntries,
]
const playgroundSearch = document.querySelector<HTMLInputElement>('#playground-search')
const searchResults = document.querySelector<HTMLUListElement>('#playground-results')
const searchStatus = document.querySelector<HTMLElement>('#playground-search-status')
if (!playgroundSearch || !searchResults || !searchStatus) throw new Error('Missing playground search controls.')
playgroundSearch.addEventListener('input', () => {
  const query = playgroundSearch.value.trim().toLocaleLowerCase()
  const matches = query ? searchEntries.filter(entry => query.split(/\s+/).every(word => entry.terms.includes(word))) : []
  searchResults.replaceChildren(...matches.map(entry => {
    const item = document.createElement('li')
    item.className = 'sds-list-item'
    const link = document.createElement('a')
    link.className = 'sds-link'
    link.href = `#${entry.element.id}`
    link.textContent = entry.title
    const title = document.createElement('h3')
    title.append(link)
    const context = document.createElement('p')
    context.textContent = `${entry.kind} / ${entry.section.querySelector('h2')?.textContent ?? ''}`
    item.append(title, context)
    return item
  }))
  searchResults.hidden = !query
  searchStatus.textContent = query ? `${matches.length} matching components or recipes.` : ''
})

function revealCatalogTarget() {
  const entry = searchEntries.find(entry => `#${entry.element.id}` === window.location.hash)
  if (!entry) return
  for (let parent = entry.element.parentElement; parent; parent = parent.parentElement) {
    if (parent instanceof HTMLDetailsElement) parent.open = true
  }
  entry.element.scrollIntoView({ block: 'start', behavior: 'instant' })
  const appHeader = document.querySelector('body > .sds-app > .sds-app-header')
  const overlap = (appHeader?.getBoundingClientRect().bottom ?? 0) - entry.element.getBoundingClientRect().top
  if (overlap > 0) window.scrollBy({ top: -overlap, behavior: 'instant' })
  entry.element.querySelector<HTMLElement>(':scope > [data-example-tools]')?.focus({ preventScroll: true })
}
window.addEventListener('hashchange', revealCatalogTarget)
if (window.location.hash) revealCatalogTarget()

const sectionNavigation = document.querySelector<HTMLElement>(
  '.sds-sidebar > nav',
)
const sectionLinks = Array.from(
  sectionNavigation?.querySelectorAll<HTMLAnchorElement>('a[href^="#"]') ?? [],
).flatMap((link) => {
  const section = document.getElementById(link.hash.slice(1))
  return section ? [{ link, section }] : []
})

if (sectionNavigation && sectionLinks.length > 0) {
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
    { rootMargin: '-12% 0px -75% 0px' },
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
      const source = target.closest('details')
      if (source) source.open = true
      const focusTarget = source?.querySelector('summary') ?? target
      focusTarget.focus()
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

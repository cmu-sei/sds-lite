import './style.css'
import './brand.css'
import { setupSds } from './sds.ts'

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
  const { option } = (event as CustomEvent<{ option: HTMLLIElement }>).detail
  const record = records.get(option.dataset.projectId ?? '')
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

import './style.css'
import './brand.css'
import { defineSds } from './sds.ts'

defineSds()

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

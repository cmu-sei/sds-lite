import './style.css'
import './brand.css'
import './demo.css'
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

document.addEventListener('submit', (event) => event.preventDefault())

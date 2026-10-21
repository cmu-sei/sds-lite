const initializedForms = new WeakSet()

export function setupInputActionsExample() {
  const form = document.querySelector('#input-actions-example')
  if (!form) throw new Error('Missing input actions example form.')
  if (initializedForms.has(form)) return
  const password = form.querySelector('input[type="password"]')
  const reveal = form.querySelector('[data-reveal]')
  const search = form.querySelector('input[type="search"]')
  const status = form.querySelector('[role="status"]')

  reveal.addEventListener('click', () => {
    const visible = password.type === 'password'
    password.type = visible ? 'text' : 'password'
    reveal.setAttribute('aria-pressed', String(visible))
  })
  form.querySelector('[data-clear]').addEventListener('click', () => {
    search.value = ''
    search.dispatchEvent(new Event('input', { bubbles: true }))
    search.focus()
    status.textContent = 'Search cleared.'
  })
  form.querySelector('[data-copy-value]').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(form.querySelector('input[readonly]').value)
      status.textContent = 'Project URL copied.'
    } catch (error) {
      status.textContent = 'Copy failed. Select the project URL and copy it manually.'
      console.error('Could not copy the project URL.', error)
    }
  })
  form.addEventListener('reset', event => setTimeout(() => {
    if (event.defaultPrevented) return
    password.type = 'password'
    reveal.setAttribute('aria-pressed', 'false')
    status.textContent = ''
  }, 0))
  form.addEventListener('submit', event => {
    event.preventDefault()
    status.textContent = `Search: ${new FormData(form).get('query')}. Password ${password.value ? 'provided' : 'not provided'}.`
  })
  initializedForms.add(form)
}

if (typeof document !== 'undefined' && document.querySelector('#input-actions-example')) {
  setupInputActionsExample()
}

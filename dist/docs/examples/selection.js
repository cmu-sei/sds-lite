const initializedForms = new WeakSet()

export function setupSelectionExample() {
  const form = document.querySelector('#selection-example')
  if (!form) throw new Error('Missing selection example form.')
  if (initializedForms.has(form)) return
  const status = form.querySelector('[role="status"]')
  for (const button of form.querySelectorAll('button[aria-pressed]')) {
    button.addEventListener('click', () => {
      const pressed = button.getAttribute('aria-pressed') !== 'true'
      button.setAttribute('aria-pressed', String(pressed))
      status.textContent = `${button.textContent.trim()}: ${pressed ? 'on' : 'off'}.`
    })
  }
  form.addEventListener('reset', event => setTimeout(() => {
    if (event.defaultPrevented) return
    for (const button of form.querySelectorAll('button[aria-pressed]')) {
      button.setAttribute('aria-pressed', 'false')
    }
    status.textContent = 'Initial choices restored.'
  }, 0))
  form.addEventListener('submit', event => {
    event.preventDefault()
    status.textContent = `Submitted choices: ${JSON.stringify([...new FormData(form)])}`
  })
  initializedForms.add(form)
}

if (typeof document !== 'undefined' && document.querySelector('#selection-example')) {
  setupSelectionExample()
}

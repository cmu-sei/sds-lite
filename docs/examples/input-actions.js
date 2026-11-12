const initializedForms = new WeakSet()

export function setupInputActionsExample() {
  const form = document.querySelector('#input-actions-example')
  if (!form) throw new Error('Missing input actions example form.')
  if (initializedForms.has(form)) return
  const password = form.querySelector('input[type="password"]')
  const reveal = form.querySelector('[data-reveal]')
  const search = form.querySelector('input[type="search"]')
  const status = form.querySelector('[role="status"]')
  const copy = form.querySelector('[data-copy-value]')
  const copyIcon = copy.firstElementChild.cloneNode(true)
  let copyTimer
  let copyVersion = 0
  const resetCopy = () => {
    clearTimeout(copyTimer)
    copyVersion += 1
    copy.setAttribute('aria-label', 'Copy URL')
    copy.replaceChildren(copyIcon.cloneNode(true))
  }

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
  copy.addEventListener('click', async () => {
    resetCopy()
    const version = copyVersion
    try {
      await navigator.clipboard.writeText(form.querySelector('input[readonly]').value)
      if (version !== copyVersion) return
      copy.setAttribute('aria-label', 'Copied URL')
      const check = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      check.setAttribute('d', 'M5 12l4 4L19 6')
      check.setAttribute('fill', 'none')
      check.setAttribute('stroke', 'currentColor')
      check.setAttribute('stroke-width', '2')
      copy.querySelector('svg').replaceChildren(check)
      status.textContent = 'Project URL copied.'
      copyTimer = setTimeout(resetCopy, 2000)
    } catch (error) {
      if (version !== copyVersion) return
      status.textContent = 'Copy failed. Select the project URL and copy it manually.'
      console.error('Could not copy the project URL.', error)
    }
  })
  form.addEventListener('reset', event => setTimeout(() => {
    if (event.defaultPrevented) return
    password.type = 'password'
    reveal.setAttribute('aria-pressed', 'false')
    resetCopy()
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

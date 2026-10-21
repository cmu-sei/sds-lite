const initializedForms = new WeakSet()

export function setupMultipleSelectionExample() {
  const form = document.querySelector('#multiple-selection-example')
  if (!form) throw new Error('Missing multiple selection example form.')
  if (initializedForms.has(form)) return
  const picker = form.querySelector('sds-combobox')
  const query = picker.querySelector('input')
  const options = [...picker.querySelectorAll('li')]
  const tags = form.querySelector('[data-selected-topics]')
  const status = form.querySelector('p[role="status"]')
  const initial = [...tags.querySelectorAll('input[type="hidden"]')].map(input => input.value)
  const selected = new Set(initial)

  function render() {
    tags.replaceChildren()
    for (const option of options) {
      const value = option.dataset.sdsValue
      if (!selected.has(value)) {
        option.removeAttribute('aria-disabled')
        continue
      }
      option.setAttribute('aria-disabled', 'true')
      const hidden = document.createElement('input')
      hidden.type = 'hidden'
      hidden.name = 'topic'
      hidden.value = value
      const tag = document.createElement('button')
      tag.type = 'button'
      tag.className = 'sds-tag'
      tag.textContent = `${option.textContent.trim()} \u00d7`
      tag.setAttribute('aria-label', `Remove ${option.textContent.trim()}`)
      tag.addEventListener('click', () => {
        const buttons = [...tags.querySelectorAll('button')]
        const index = buttons.indexOf(tag)
        selected.delete(value)
        render()
        const remaining = tags.querySelectorAll('button')
        ;(remaining[Math.min(index, remaining.length - 1)] ?? query).focus()
        status.textContent = `${option.textContent.trim()} removed. ${selected.size} selected.`
      })
      tags.append(hidden, tag)
    }
    query.setCustomValidity(selected.size ? '' : 'Choose at least one topic.')
  }

  picker.addEventListener('sds-select', event => {
    selected.add(event.detail.value)
    render()
    queueMicrotask(() => {
      query.value = ''
      query.dispatchEvent(new Event('input', { bubbles: true }))
    })
    status.textContent = `${selected.size} topics selected.`
  })
  form.addEventListener('reset', event => setTimeout(() => {
    if (event.defaultPrevented) return
    selected.clear()
    initial.forEach(value => selected.add(value))
    render()
    query.dispatchEvent(new Event('input', { bubbles: true }))
    status.textContent = 'Initial selections restored.'
  }, 0))
  form.addEventListener('submit', event => {
    event.preventDefault()
    status.textContent = `Submitted topic IDs: ${JSON.stringify(new FormData(form).getAll('topic'))}`
  })
  render()
  initializedForms.add(form)
}

if (typeof document !== 'undefined' && document.querySelector('#multiple-selection-example')) {
  setupMultipleSelectionExample()
}

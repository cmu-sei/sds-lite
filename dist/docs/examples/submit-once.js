const initializedForms = new WeakMap()

export function setupSubmitOnce(form) {
  if (initializedForms.has(form)) return initializedForms.get(form)
  let pending = false
  let button
  let spinner
  let buttonBusy
  const formBusy = form.getAttribute('aria-busy')
  const restore = (element, value) => {
    if (value === null) element.removeAttribute('aria-busy')
    else element.setAttribute('aria-busy', value)
  }
  const reset = () => {
    pending = false
    spinner?.remove()
    spinner = undefined
    if (button) restore(button, buttonBusy)
    button = undefined
    restore(form, formBusy)
  }
  form.addEventListener('submit', event => {
    if ((event.submitter?.getAttribute('formmethod') ?? form.method) === 'dialog') return
    if (pending) {
      event.preventDefault()
      event.stopImmediatePropagation()
      return
    }
    if (event.defaultPrevented) return
    pending = true
    queueMicrotask(() => {
      if (event.defaultPrevented) {
        reset()
        return
      }
      if (!pending) return
      form.setAttribute('aria-busy', 'true')
      if (event.submitter?.tagName !== 'BUTTON') return
      button = event.submitter
      buttonBusy = button.getAttribute('aria-busy')
      button.setAttribute('aria-busy', 'true')
      spinner = form.ownerDocument.createElement('span')
      spinner.className = 'sds-spinner'
      spinner.setAttribute('data-sds-size', 'sm')
      spinner.setAttribute('aria-hidden', 'true')
      button.prepend(spinner)
    })
  }, { capture: true })
  form.ownerDocument.defaultView.addEventListener('pageshow', reset)
  initializedForms.set(form, reset)
  return reset
}
const initializedForms = new WeakSet()

export function setupFileUploadExample() {
  const form = document.querySelector('#file-upload-example')
  if (!form) throw new Error('Missing file upload example form.')
  if (initializedForms.has(form)) return
  const input = form.querySelector('input[type="file"]')
  const list = form.querySelector('ul')
  const status = form.querySelector('[role="status"]')
  const entries = new Set()
  const maxBytes = 10 * 1024 * 1024
  const sizeFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 })

  function validateQueue() {
    input.setCustomValidity([...entries].some(entry => !entry.invalid) ? '' : 'Choose at least one PDF smaller than 10 MB.')
  }

  function updateActions(entry) {
    const focused = document.activeElement
    entry.retry.disabled = Boolean(entry.request) || entry.invalid || entry.complete
    entry.cancel.disabled = !entry.request
    entry.retry.hidden = Boolean(entry.request) || entry.invalid || entry.complete
    entry.cancel.hidden = !entry.request
    if ((focused === entry.retry || focused === entry.cancel) && focused.hidden) {
      const next = entry.request ? entry.cancel : entry.complete || entry.invalid ? entry.remove : entry.retry
      next.focus()
    }
  }

  function send(entry) {
    if (entry.invalid || entry.request || entry.complete) return
    const request = new XMLHttpRequest()
    entry.request = request
    entry.message.textContent = 'Uploading'
    entry.progress.hidden = false
    entry.progress.removeAttribute('value')
    updateActions(entry)
    request.open('POST', form.action)
    request.timeout = 60_000
    request.upload.addEventListener('progress', event => {
      if (event.lengthComputable) {
        entry.progress.max = event.total
        entry.progress.value = event.loaded
      }
    })
    function settle(message, complete = false) {
      entry.request = null
      entry.complete = complete
      entry.message.textContent = message
      entry.progress.hidden = true
      entry.retry.textContent = 'Retry'
      entry.retry.setAttribute('aria-label', `Retry ${entry.file.name}`)
      updateActions(entry)
      if (entries.has(entry)) status.textContent = `${entry.file.name}: ${message}`
    }
    request.addEventListener('load', () => {
      if (request.status >= 200 && request.status < 300) settle('Uploaded', true)
      else settle(`Upload failed (HTTP ${request.status}). Retry when the server is ready.`)
    })
    request.addEventListener('error', () => settle('Network error. Check your connection and retry.'))
    request.addEventListener('timeout', () => settle('Upload timed out. Retry.'))
    request.addEventListener('abort', () => settle('Upload cancelled. You can retry.'))
    const body = new FormData()
    body.append('attachment', entry.file, entry.file.name)
    request.send(body)
  }

  input.addEventListener('change', () => {
    for (const file of input.files) {
      if ([...entries].some(entry => entry.file.name === file.name && entry.file.size === file.size && entry.file.lastModified === file.lastModified)) continue
      const row = document.createElement('li')
      row.className = 'sds-file-item'
      const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      icon.setAttribute('viewBox', '0 0 24 24')
      icon.setAttribute('aria-hidden', 'true')
      icon.innerHTML = '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8Zm0 0v5h5M9 13h6m-6 4h6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>'
      const details = document.createElement('div')
      details.className = 'sds-file-details'
      const title = document.createElement('strong')
      title.textContent = file.name
      const metadata = document.createElement('small')
      const size = document.createElement('span')
      size.textContent = file.size < 1024
        ? `${file.size} B`
        : file.size < 1024 * 1024
          ? `${sizeFormat.format(file.size / 1024)} KB`
          : `${sizeFormat.format(file.size / (1024 * 1024))} MB`
      const message = document.createElement('span')
      const progress = document.createElement('progress')
      progress.className = 'sds-progress'
      progress.hidden = true
      progress.setAttribute('aria-label', `Upload progress for ${file.name}`)
      const actions = document.createElement('div')
      actions.className = 'sds-action-group'
      const button = (label, action) => {
        const control = document.createElement('button')
        control.type = 'button'
        control.className = 'sds-button'
        control.dataset.sdsVariant = 'text'
        control.dataset.sdsSize = 'sm'
        control.textContent = label
        control.setAttribute('aria-label', `${label} ${file.name}`)
        control.addEventListener('click', action)
        actions.append(control)
        return control
      }
      const invalid = file.size >= maxBytes || !file.name.toLowerCase().endsWith('.pdf')
      const entry = { file, invalid, complete: false, request: null, message, progress, retry: null, cancel: null, remove: null }
      entry.retry = button('Upload', () => send(entry))
      entry.cancel = button('Cancel', () => entry.request?.abort())
      entry.remove = button('Remove', () => {
        entries.delete(entry)
        entry.request?.abort()
        row.remove()
        input.focus()
        validateQueue()
        status.textContent = `${file.name} removed.`
      })
      entry.remove.dataset.sdsTone = 'danger'
      updateActions(entry)
      message.textContent = invalid ? 'Choose a PDF smaller than 10 MB.' : 'Ready to upload'
      metadata.append(size, message)
      details.append(title, metadata, progress)
      row.append(icon, details, actions)
      entries.add(entry)
      list.append(row)
    }
    input.value = ''
    validateQueue()
    status.textContent = `${entries.size} files listed.`
  })
  form.addEventListener('formdata', event => {
    event.formData.delete(input.name)
    for (const entry of entries) {
      if (!entry.invalid) event.formData.append(input.name, entry.file, entry.file.name)
    }
  })
  form.addEventListener('submit', event => {
    event.preventDefault()
    for (const entry of entries) send(entry)
  })
  form.addEventListener('reset', event => setTimeout(() => {
    if (event.defaultPrevented) return
    const pending = [...entries]
    entries.clear()
    for (const entry of pending) entry.request?.abort()
    list.replaceChildren()
    status.textContent = 'File queue cleared.'
    validateQueue()
  }, 0))
  validateQueue()
  initializedForms.add(form)
}

if (typeof document !== 'undefined' && document.querySelector('#file-upload-example')) {
  setupFileUploadExample()
}

const initializedForms = new WeakSet()

export function setupDateRangeExample() {
  const form = document.querySelector('#date-range-example')
  if (!form) throw new Error('Missing date range example form.')
  if (initializedForms.has(form)) return
  const start = form.querySelector('[name="start"]')
  const end = form.querySelector('[name="end"]')
  const error = form.querySelector('[data-date-error]')
  const status = form.querySelector('[role="status"]')

  function validateRange() {
    const invalid = Boolean(start.value && end.value && end.valueAsNumber < start.valueAsNumber)
    end.min = start.value
    end.setCustomValidity(invalid ? 'End date must be on or after start date.' : '')
    end.setAttribute('aria-invalid', String(invalid))
    error.textContent = invalid ? 'End date must be on or after start date.' : ''
  }

  function calendarDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  start.addEventListener('input', validateRange)
  end.addEventListener('input', validateRange)
  form.querySelector('[data-last-week]').addEventListener('click', () => {
    const today = new Date()
    const first = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6)
    start.value = calendarDate(first)
    end.value = calendarDate(today)
    validateRange()
    status.textContent = 'Selected the last 7 calendar days, including today.'
  })
  form.addEventListener('reset', event => setTimeout(() => {
    if (event.defaultPrevented) return
    validateRange()
    status.textContent = ''
  }, 0))
  form.addEventListener('submit', event => {
    event.preventDefault()
    validateRange()
    if (!form.reportValidity()) return
    const values = new FormData(form)
    status.textContent = `Reporting period: ${values.get('start')} through ${values.get('end')} (inclusive).`
  })
  validateRange()
  initializedForms.add(form)
}

if (typeof document !== 'undefined' && document.querySelector('#date-range-example')) {
  setupDateRangeExample()
}

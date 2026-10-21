const initializedForms = new WeakSet()

export function setupTableSelectionExample() {
  const form = document.querySelector('#table-selection-example')
  if (!form) throw new Error('Missing table selection example form.')
  if (initializedForms.has(form)) return
  const search = form.querySelector('input[type="search"]')
  const assigneeFilter = form.querySelector('[data-assignee-filter]')
  const statusFilter = form.querySelector('[data-status-filter]')
  const pageSize = form.querySelector('[data-page-size]')
  const all = form.querySelector('[data-select-all]')
  const selectionBar = form.querySelector('.sds-table-selection')
  const status = form.querySelector('[data-table-status]')
  const announcement = form.querySelector('[data-table-announcement]')
  const body = form.querySelector('tbody')
  const pagination = form.querySelector('.sds-pagination ul')
  const dialog = form.querySelector('dialog')
  let dialogTrigger = null
  const selected = new Set()
  const descriptions = [
    'Implement responsive navigation', 'Refactor authentication module',
    'Optimize image loading', 'Add accessibility features',
    'Integrate third-party API', 'Update user profile page',
    'Fix mobile layout issues', 'Implement dark mode',
    'Set up CI/CD pipeline', 'Improve form validation',
    'Review keyboard navigation', 'Document component patterns',
    'Add project search', 'Update notification preferences',
    'Improve empty states', 'Test file upload errors',
    'Review table pagination', 'Add account settings',
    'Audit color contrast', 'Update onboarding flow',
    'Improve loading feedback', 'Review error messages',
    'Test date range filters', 'Document deployment process',
    'Prepare release checklist',
  ]
  const people = ['Jamie Carter', 'Morgan Lee', 'Riley Thompson', '', 'Casey Martinez', 'Jordan Kim', 'Alex Patel', 'Samira Hassan', 'Chris Walker', 'Jamie Carter']
  const initial = descriptions.map((description, index) => ({
    id: `SDS-${101 + index}`,
    description,
    assignee: people[index % people.length],
    status: ['open', 'submitted', 'approved'][index % 3],
  }))
  let tasks = initial.map(task => ({ ...task }))
  let pageNumber = 1
  let scope = 'all'
  let ascending = true
  let visible = []

  function node(tag, className = '', text = '') {
    const element = document.createElement(tag)
    element.className = className
    element.textContent = text
    return element
  }

  function filteredTasks() {
    const query = search.value.trim().toLocaleLowerCase()
    return tasks.filter(task =>
      `${task.id} ${task.description} ${task.assignee || 'Unassigned'} ${task.status}`.toLocaleLowerCase().includes(query) &&
      (scope !== 'mine' || task.assignee === 'Jamie Carter') &&
      (scope !== 'unassigned' || !task.assignee) &&
      (assigneeFilter.value === 'all' || task.assignee === assigneeFilter.value) &&
      (statusFilter.value === 'all' || task.status === statusFilter.value),
    ).sort((a, b) => a.id.localeCompare(b.id) * (ascending ? 1 : -1))
  }

  function updateSelection() {
    all.checked = visible.length > 0 && selected.size === visible.length
    all.indeterminate = selected.size > 0 && selected.size < visible.length
    all.disabled = visible.length === 0
    selectionBar.hidden = selected.size === 0
    form.querySelector('[data-selected-count]').textContent = `${selected.size} selected`
    for (const checkbox of body.querySelectorAll('input[type="checkbox"]')) {
      checkbox.checked = selected.has(checkbox.value)
    }
    const total = filteredTasks().length
    const first = total ? (pageNumber - 1) * Number(pageSize.value) + 1 : 0
    const last = first ? first + visible.length - 1 : 0
    status.textContent = `Showing ${first}-${last} of ${total}${selected.size ? `. ${selected.size} selected` : ''}`
  }

  function render() {
    const filtered = filteredTasks()
    const limit = Number(pageSize.value)
    const pages = Math.max(1, Math.ceil(filtered.length / limit))
    pageNumber = Math.min(pageNumber, pages)
    visible = filtered.slice((pageNumber - 1) * limit, pageNumber * limit)
    const visibleIds = new Set(visible.map(task => task.id))
    for (const id of selected) {
      if (!visibleIds.has(id)) selected.delete(id)
    }
    body.replaceChildren(...visible.map(task => {
      const row = document.createElement('tr')
      const choose = node('td')
      const checkbox = node('input', 'sds-checkbox')
      checkbox.type = 'checkbox'
      checkbox.name = 'task[]'
      checkbox.value = task.id
      checkbox.setAttribute('aria-label', `Select ${task.id}`)
      choose.append(checkbox)
      const name = node('th')
      name.scope = 'row'
      const details = node('button', 'sds-button', task.id)
      details.type = 'button'
      details.dataset.sdsVariant = 'text'
      details.dataset.sdsDensity = 'compact'
      details.addEventListener('click', () => {
        dialog.querySelector('[data-task-description]').textContent = `${task.id}: ${task.description}`
        dialog.querySelector('[data-task-assignee]').textContent = `Assignee: ${task.assignee || 'Unassigned'}`
        dialog.querySelector('[data-task-status]').textContent = `Status: ${task.status}`
        dialogTrigger = details
        dialog.showModal()
      })
      name.append(details)
      const owner = node('td')
      const person = node('div', 'sds-cluster')
      person.dataset.sdsGap = 'sm'
      const initials = task.assignee ? task.assignee.split(' ').map(part => part[0]).join('') : '?'
      const avatar = node('span', 'sds-avatar', initials)
      avatar.dataset.sdsSize = 'sm'
      avatar.setAttribute('aria-hidden', 'true')
      person.append(avatar, node('span', '', task.assignee || 'Unassigned'))
      owner.append(person)
      const state = node('td')
      const labels = node('div', 'sds-stack')
      labels.dataset.sdsGap = 'xs'
      const badge = node('span', 'sds-badge', task.status.toUpperCase())
      badge.dataset.sdsVariant = 'light-border'
      badge.dataset.sdsTone = { open: 'warning', submitted: 'info', approved: 'success' }[task.status]
      const badgeLine = node('div')
      badgeLine.append(badge)
      const detail = node('small', '', { open: 'Open', submitted: 'Testing', approved: 'Recently updated' }[task.status])
      labels.append(badgeLine, detail)
      state.append(labels)
      const actions = node('td')
      const menu = document.createElement('sds-dropdown')
      menu.setAttribute('hide-caret', '')
      menu.setAttribute('width', 'sm')
      const trigger = node('button', 'sds-button', '\u22ef')
      trigger.type = 'button'
      trigger.dataset.sdsShape = 'icon'
      trigger.dataset.taskMenu = task.id
      trigger.setAttribute('aria-label', `Actions for ${task.id}`)
      const commands = document.createElement('menu')
      for (const [label, key, value] of [['Mark approved', 'status', 'approved'], ['Assign to me', 'assignee', 'Jamie Carter']]) {
        const item = document.createElement('li')
        const button = node('button', 'sds-button', label)
        button.type = 'button'
        button.disabled = task[key] === value
        button.addEventListener('click', () => {
          task[key] = value
          selected.clear()
          render()
          const next = form.querySelector(`[data-task-menu="${task.id}"]`)
          ;(next ?? search).focus()
          announcement.textContent = `${task.id}: ${label.toLowerCase()}. Changes are local to this example.`
        })
        item.append(button)
        commands.append(item)
      }
      menu.append(trigger, commands)
      actions.append(menu)
      row.append(choose, name, node('td', '', task.description), owner, state, actions)
      return row
    }))
    if (!visible.length) {
      const row = document.createElement('tr')
      const empty = node('td', '', 'No tasks match these filters.')
      empty.colSpan = 6
      row.append(empty)
      body.append(row)
    }
    const pageButton = (label, target, text, disabled = false) => {
      const item = document.createElement('li')
      const button = node('button', '', text)
      button.type = 'button'
      button.disabled = disabled
      button.setAttribute('aria-label', label)
      if (text === '\u2039' || text === '\u203a') {
        const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
        icon.setAttribute('viewBox', '0 0 8 13')
        icon.setAttribute('aria-hidden', 'true')
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        path.setAttribute('d', text === '\u2039'
          ? 'M7.35 1.13 2.73 6.75l4.62 4.65-1.23 1.23L.87 7.38a.86.86 0 0 1 0-1.23L6.12.9l1.23 1.23Z'
          : 'm.62 1.13 1.23-1.23 5.25 5.25a.86.86 0 0 1 0 1.23l-5.25 5.25-1.23-1.23 4.62-4.65L.62 1.13Z')
        icon.append(path)
        button.replaceChildren(icon)
      }
      if (target === pageNumber && /^\d+$/.test(text)) button.setAttribute('aria-current', 'page')
      button.addEventListener('click', () => {
        pageNumber = target
        selected.clear()
        render()
        pagination.querySelector('[aria-current="page"]')?.focus()
      })
      item.append(button)
      return item
    }
    pagination.replaceChildren(
      pageButton('Previous task page', pageNumber - 1, '\u2039', pageNumber === 1),
      ...Array.from({ length: pages }, (_, index) => pageButton(`Task page ${index + 1}`, index + 1, String(index + 1))),
      pageButton('Next task page', pageNumber + 1, '\u203a', pageNumber === pages),
    )
    form.querySelector('th[aria-sort]').setAttribute('aria-sort', ascending ? 'ascending' : 'descending')
    updateSelection()
  }

  function filter() {
    pageNumber = 1
    selected.clear()
    render()
  }

  function exportTasks(records) {
    const csvValue = value => `"${String(value).replace(/^[=+\-@\t\r]/, "'$&").replaceAll('"', '""')}"`
    const csv = [['Task', 'Description', 'Assignee', 'Status'], ...records.map(task => [task.id, task.description, task.assignee || 'Unassigned', task.status])]
      .map(row => row.map(csvValue).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'project-tasks.csv'
    document.body.append(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    announcement.textContent = `Exported ${records.length} tasks.`
  }

  search.addEventListener('input', filter)
  assigneeFilter.addEventListener('change', filter)
  statusFilter.addEventListener('change', filter)
  pageSize.addEventListener('change', filter)
  for (const button of form.querySelectorAll('[data-task-scope]')) {
    button.addEventListener('click', () => {
      scope = scope === button.dataset.taskScope ? 'all' : button.dataset.taskScope
      for (const control of form.querySelectorAll('[data-task-scope]')) {
        control.setAttribute('aria-pressed', String(control.dataset.taskScope === scope))
      }
      assigneeFilter.value = 'all'
      filter()
    })
  }
  all.addEventListener('change', () => {
    for (const task of visible) {
      if (all.checked) selected.add(task.id)
      else selected.delete(task.id)
    }
    updateSelection()
  })
  body.addEventListener('change', event => {
    if (!event.target.matches('input[type="checkbox"]')) return
    if (event.target.checked) selected.add(event.target.value)
    else selected.delete(event.target.value)
    updateSelection()
  })
  form.querySelector('[data-clear-selection]').addEventListener('click', () => {
    selected.clear()
    updateSelection()
    all.focus()
  })
  form.querySelector('[data-bulk-action]').addEventListener('click', () => {
    const count = selected.size
    for (const task of tasks) {
      if (selected.has(task.id)) task.status = 'approved'
    }
    selected.clear()
    render()
    ;(all.disabled ? search : all).focus()
    announcement.textContent = `${count} tasks marked approved. Changes are local to this example.`
  })
  for (const button of form.querySelectorAll('[data-sort], [data-sort-order]')) {
    button.addEventListener('click', () => {
      ascending = !ascending
      filter()
    })
  }
  form.querySelector('[data-export-selected]').addEventListener('click', () => exportTasks(tasks.filter(task => selected.has(task.id))))
  form.querySelector('[data-export-results]').addEventListener('click', () => exportTasks(filteredTasks()))
  form.querySelector('[data-close-task]').addEventListener('click', () => dialog.close())
  dialog.addEventListener('close', () => {
    dialogTrigger?.focus()
    dialogTrigger = null
  })
  form.addEventListener('reset', event => setTimeout(() => {
    if (event.defaultPrevented) return
    tasks = initial.map(task => ({ ...task }))
    scope = 'all'
    ascending = true
    for (const button of form.querySelectorAll('[data-task-scope]')) button.setAttribute('aria-pressed', 'false')
    filter()
    search.focus()
    announcement.textContent = 'Initial tasks and filters restored.'
  }, 0))
  form.addEventListener('submit', event => {
    event.preventDefault()
    filter()
  })
  render()
  initializedForms.add(form)
}

if (typeof document !== 'undefined' && document.querySelector('#table-selection-example')) {
  setupTableSelectionExample()
}

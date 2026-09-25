#!/usr/bin/env node

import { readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SOURCES = new Set([
  'legacy-sds',
  'bootstrap',
  'uswds',
  'material',
  'web-awesome',
  'spectrum',
])

const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
])

const COMPONENT_BUTTONS = {
  'legacy-sds': new Set(['sdsbutton', 'sds-button']),
  material: new Set([
    'md-elevated-button',
    'md-filled-button',
    'md-filled-tonal-button',
    'md-outlined-button',
    'md-text-button',
  ]),
  'web-awesome': new Set(['wa-button']),
  spectrum: new Set(['sp-button']),
}

const COMPONENT_FIELDS = {
  'legacy-sds': new Map([
    ['sdsinput', 'input'],
    ['sds-input', 'input'],
    ['sdstextarea', 'textarea'],
    ['sds-textarea', 'textarea'],
  ]),
  material: new Map([
    ['md-filled-text-field', 'input'],
    ['md-outlined-text-field', 'input'],
  ]),
  'web-awesome': new Map([
    ['wa-input', 'input'],
    ['wa-textarea', 'textarea'],
  ]),
  spectrum: new Map([['sp-textfield', 'input']]),
}

function usage() {
  return `Usage: node scripts/migrate.mjs --from <source> [--write] <file...>

Sources:
  legacy-sds, bootstrap, uswds, material, web-awesome, spectrum

The default is a dry run that prints transformed file contents. --write
updates changed files in place. Dynamic or unsupported markup is left intact
and reported on stderr.`
}

function parseArguments(argv) {
  let from
  let write = false
  let help = false
  let positionalOnly = false
  const files = []

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (positionalOnly) {
      files.push(argument)
    } else if (argument === '--') {
      positionalOnly = true
    } else if (argument === '--write') {
      if (write) throw new Error('--write was provided more than once')
      write = true
    } else if (argument === '--help' || argument === '-h') {
      help = true
    } else if (argument === '--from') {
      if (from) throw new Error('--from was provided more than once')
      from = argv[index + 1]
      index += 1
      if (!from || from.startsWith('-')) {
        throw new Error('--from requires a source name')
      }
    } else if (argument.startsWith('--from=')) {
      if (from) throw new Error('--from was provided more than once')
      from = argument.slice('--from='.length)
      if (!from) throw new Error('--from requires a source name')
    } else if (argument.startsWith('-')) {
      throw new Error(`unknown flag: ${argument}`)
    } else {
      files.push(argument)
    }
  }

  if (help) return { help: true, files, from, write }
  if (!from) throw new Error('missing required --from <source>')
  if (!SOURCES.has(from)) {
    throw new Error(
      `unknown source "${from}"; expected one of: ${[...SOURCES].join(', ')}`,
    )
  }
  if (files.length === 0) throw new Error('provide at least one file path')
  return { help: false, files, from, write }
}

function lineAt(source, index) {
  let line = 1
  for (let cursor = 0; cursor < index; cursor += 1) {
    if (source.charCodeAt(cursor) === 10) line += 1
  }
  return line
}

function warning(message, line) {
  return { line, message }
}

function findTagEnd(source, start) {
  let quote = ''
  let braces = 0
  for (let index = start; index < source.length; index += 1) {
    const character = source[index]
    if (quote) {
      if (character === '\\') {
        index += 1
      } else if (character === quote) {
        quote = ''
      }
      continue
    }
    if (character === '"' || character === "'" || character === '`') {
      quote = character
    } else if (character === '{') {
      braces += 1
    } else if (character === '}' && braces > 0) {
      braces -= 1
    } else if (character === '>' && braces === 0) {
      return index
    }
  }
  return -1
}

function walkMarkup(source, visit) {
  let output = ''
  let cursor = 0
  const stack = []

  while (cursor < source.length) {
    const start = source.indexOf('<', cursor)
    if (start < 0) {
      output += source.slice(cursor)
      break
    }
    output += source.slice(cursor, start)

    if (source.startsWith('<!--', start)) {
      const commentEnd = source.indexOf('-->', start + 4)
      const end = commentEnd < 0 ? source.length : commentEnd + 3
      output += source.slice(start, end)
      cursor = end
      continue
    }

    const end = findTagEnd(source, start + 1)
    if (end < 0) {
      output += source.slice(start)
      break
    }

    const raw = source.slice(start, end + 1)
    if (/^<\s*[!?]/.test(raw)) {
      output += raw
      cursor = end + 1
      continue
    }

    const closing = raw.match(/^<\s*\/\s*([A-Za-z][\w:.-]*)[^>]*>$/)
    if (closing) {
      const sourceName = closing[1].toLowerCase()
      let entryIndex = stack.length - 1
      while (entryIndex >= 0 && stack[entryIndex].sourceName !== sourceName) {
        entryIndex -= 1
      }
      if (entryIndex >= 0) {
        const entry = stack[entryIndex]
        stack.length = entryIndex
        output +=
          entry.closeRaw === undefined
            ? raw
            : typeof entry.closeRaw === 'function'
              ? entry.closeRaw(raw)
              : entry.closeRaw
      } else {
        output += raw
      }
      cursor = end + 1
      continue
    }

    const opening = raw.match(/^<\s*([A-Za-z][\w:.-]*)/)
    if (!opening) {
      output += raw
      cursor = end + 1
      continue
    }

    const name = opening[1]
    const nameEnd = opening[0].length
    const selfClosing = /\/\s*>$/.test(raw)
    const suffixLength = selfClosing
      ? raw.length - raw.lastIndexOf('/')
      : 1
    const attributesSource = raw.slice(nameEnd, raw.length - suffixLength)
    const result =
      visit({
        attributesSource,
        context: stack.map((entry) => entry.sourceName),
        index: start,
        line: lineAt(source, start),
        name,
        raw,
        selfClosing,
      }) ?? {}

    output += result.raw ?? raw
    const lowerName = name.toLowerCase()
    if (!selfClosing && !VOID_ELEMENTS.has(lowerName)) {
      stack.push({
        sourceName: lowerName,
        closeRaw: result.closeRaw,
      })
    }
    cursor = end + 1
  }

  return output
}

function readBalanced(source, start, open, close) {
  let depth = 0
  let quote = ''
  for (let index = start; index < source.length; index += 1) {
    const character = source[index]
    if (quote) {
      if (character === '\\') index += 1
      else if (character === quote) quote = ''
      continue
    }
    if (character === '"' || character === "'" || character === '`') {
      quote = character
    } else if (character === open) {
      depth += 1
    } else if (character === close) {
      depth -= 1
      if (depth === 0) return index + 1
    }
  }
  return source.length
}

function parseAttributes(source) {
  const attributes = []
  let cursor = 0

  while (cursor < source.length) {
    while (/\s/.test(source[cursor] ?? '')) cursor += 1
    if (cursor >= source.length) break
    const start = cursor

    if (source[cursor] === '{') {
      cursor = readBalanced(source, cursor, '{', '}')
      attributes.push({
        dynamic: true,
        name: null,
        raw: source.slice(start, cursor),
        value: null,
      })
      continue
    }

    while (
      cursor < source.length &&
      !/[\s=]/.test(source[cursor]) &&
      source[cursor] !== '>'
    ) {
      cursor += 1
    }
    const name = source.slice(start, cursor)
    while (/\s/.test(source[cursor] ?? '')) cursor += 1

    let value = null
    let dynamic = name.startsWith(':') || name.startsWith('v-bind')
    if (source[cursor] === '=') {
      cursor += 1
      while (/\s/.test(source[cursor] ?? '')) cursor += 1
      if (source[cursor] === '"' || source[cursor] === "'") {
        const quote = source[cursor]
        const valueStart = ++cursor
        while (cursor < source.length && source[cursor] !== quote) cursor += 1
        value = source.slice(valueStart, cursor)
        cursor += Number(cursor < source.length)
      } else if (source[cursor] === '{') {
        const valueStart = cursor
        cursor = readBalanced(source, cursor, '{', '}')
        value = source.slice(valueStart, cursor)
        dynamic = true
      } else {
        const valueStart = cursor
        while (cursor < source.length && !/\s/.test(source[cursor])) cursor += 1
        value = source.slice(valueStart, cursor)
        dynamic ||= value.includes('{{')
      }
    }

    attributes.push({
      dynamic,
      name,
      raw: source.slice(start, cursor),
      value,
    })
  }

  return attributes
}

function normalizedName(attribute) {
  return attribute.name?.toLowerCase() ?? ''
}

function findAttribute(attributes, name) {
  const lowerName = name.toLowerCase()
  return attributes.find(
    (attribute) => normalizedName(attribute) === lowerName,
  )
}

function removeAttribute(attributes, name) {
  const lowerName = name.toLowerCase()
  const index = attributes.findIndex(
    (attribute) => normalizedName(attribute) === lowerName,
  )
  if (index >= 0) attributes.splice(index, 1)
}

function setAttribute(attributes, name, value = null) {
  const existing = findAttribute(attributes, name)
  const next = { dynamic: false, name, raw: null, value }
  if (existing) Object.assign(existing, next)
  else attributes.push(next)
}

function renameAttribute(attribute, name) {
  attribute.name = name
  attribute.raw = null
}

function staticValue(attribute) {
  return attribute && !attribute.dynamic ? attribute.value : undefined
}

function isTruthyAttribute(attribute) {
  if (!attribute) return false
  if (attribute.dynamic) return null
  if (attribute.value === null || attribute.value === '') return true
  return !['false', '0'].includes(attribute.value.toLowerCase())
}

function renderAttribute(attribute) {
  if (attribute.raw !== null) return attribute.raw.trim()
  if (attribute.value === null) return attribute.name
  return `${attribute.name}="${attribute.value.replaceAll('"', '&quot;')}"`
}

function renderTag(name, attributes, selfClosing = false) {
  const rendered = attributes.map(renderAttribute).filter(Boolean).join(' ')
  return `<${name}${rendered ? ` ${rendered}` : ''}${selfClosing ? ' /' : ''}>`
}

function classAttribute(attributes) {
  return (
    findAttribute(attributes, 'class') ??
    findAttribute(attributes, 'classname')
  )
}

function replaceClasses(attributes, remove, add, preferClassName = false) {
  let attribute = classAttribute(attributes)
  if (!attribute) {
    attribute = {
      dynamic: false,
      name: preferClassName ? 'className' : 'class',
      raw: null,
      value: '',
    }
    attributes.push(attribute)
  }
  if (attribute.dynamic) return false
  const classes = (attribute.value ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .filter((className) => !remove.has(className))
  for (const className of add) {
    if (!classes.includes(className)) classes.push(className)
  }
  attribute.value = classes.join(' ')
  attribute.raw = null
  if (!attribute.value) removeAttribute(attributes, attribute.name)
  return true
}

function hasUnsafeBinding(attributes, names) {
  return attributes.some((attribute) => {
    if (!attribute.name) return true
    const name = normalizedName(attribute)
    if (name === 'v-bind') return true
    const plainName = name
      .replace(/^v-bind:/, '')
      .replace(/^:/, '')
      .replace(/^\[/, '')
      .replace(/\]$/, '')
    return attribute.dynamic && names.has(plainName)
  })
}

function applyOptions(attributes, options) {
  if (options.variant) {
    setAttribute(attributes, 'data-sds-variant', options.variant)
  }
  if (options.tone) setAttribute(attributes, 'data-sds-tone', options.tone)
  if (options.size) setAttribute(attributes, 'data-sds-size', options.size)
  if (options.block) setAttribute(attributes, 'data-sds-block')
  if (options.shape) setAttribute(attributes, 'data-sds-shape', options.shape)
}

function mapBootstrapClasses(tagName, attributes, line, warnings) {
  const classAttr = classAttribute(attributes)
  const relevantTags = new Set(['a', 'button', 'input', 'select', 'textarea'])
  if (!relevantTags.has(tagName)) return null
  if (
    classAttr?.dynamic ||
    hasUnsafeBinding(attributes, new Set(['class', 'classname']))
  ) {
    warnings.push(
      warning(
        'left a native element with a dynamic class unchanged; migrate Bootstrap classes manually',
        line,
      ),
    )
    return null
  }

  const classes = new Set((classAttr?.value ?? '').split(/\s+/).filter(Boolean))
  const isButton = classes.has('btn')
  const isControl =
    classes.has('form-control') || classes.has('form-select')
  if (!isButton && !isControl) return null

  if (isButton) {
    const sourceModifiers = [...classes].filter(
      (className) => className.startsWith('btn-') && className !== 'btn-group',
    )
    const sizeClasses = sourceModifiers.filter((name) =>
      ['btn-sm', 'btn-lg'].includes(name),
    )
    const variants = sourceModifiers.filter(
      (name) => !sizeClasses.includes(name),
    )
    const supported = new Set([
      'btn-primary',
      'btn-secondary',
      'btn-success',
      'btn-danger',
      'btn-warning',
      'btn-info',
      'btn-light',
      'btn-dark',
      'btn-link',
      'btn-outline-primary',
      'btn-outline-secondary',
      'btn-outline-success',
      'btn-outline-danger',
      'btn-outline-warning',
      'btn-outline-info',
      'btn-outline-light',
      'btn-outline-dark',
    ])
    if (
      variants.length > 1 ||
      variants.some((name) => !supported.has(name)) ||
      sizeClasses.length > 1
    ) {
      warnings.push(
        warning(
          `left a Bootstrap button with unsupported or conflicting modifiers unchanged: ${sourceModifiers.join(' ')}`,
          line,
        ),
      )
      return null
    }

    const options = { variant: 'filled', tone: 'accent' }
    const variant = variants[0]
    if (variant === 'btn-secondary') {
      options.variant = 'tonal'
      options.tone = 'neutral'
    } else if (variant === 'btn-link') {
      options.variant = 'text'
    } else if (variant?.startsWith('btn-outline-')) {
      options.variant = 'outlined'
      options.tone = bootstrapTone(variant.slice('btn-outline-'.length))
    } else if (variant) {
      options.tone = bootstrapTone(variant.slice('btn-'.length))
    }
    options.size = sizeClasses[0]?.slice('btn-'.length)

    const remove = new Set(['btn', ...sourceModifiers])
    replaceClasses(attributes, remove, ['sds-button'])
    applyOptions(attributes, options)
    return renderTag(tagName, attributes)
  }

  const remove = new Set()
  const add = []
  if (classes.has('form-select')) {
    remove.add('form-select')
    add.push('sds-select')
  }
  if (classes.has('form-control')) {
    remove.add('form-control')
    add.push(tagName === 'select' ? 'sds-select' : 'sds-input')
  }
  for (const size of ['sm', 'lg']) {
    if (classes.has(`form-control-${size}`)) {
      remove.add(`form-control-${size}`)
      setAttribute(attributes, 'data-sds-size', size)
    }
    if (classes.has(`form-select-${size}`)) {
      remove.add(`form-select-${size}`)
      setAttribute(attributes, 'data-sds-size', size)
    }
  }
  replaceClasses(attributes, remove, add)
  return renderTag(tagName, attributes)
}

function bootstrapTone(value) {
  return (
    {
      primary: 'accent',
      secondary: 'neutral',
      success: 'success',
      danger: 'danger',
      warning: 'warning',
      info: 'info',
      light: 'neutral',
      dark: 'neutral',
    }[value] ?? 'accent'
  )
}

function mapUswdsClasses(tagName, attributes, line, warnings) {
  const classAttr = classAttribute(attributes)
  const relevantTags = new Set(['a', 'button', 'input', 'select', 'textarea'])
  if (!relevantTags.has(tagName)) return null
  if (
    classAttr?.dynamic ||
    hasUnsafeBinding(attributes, new Set(['class', 'classname']))
  ) {
    warnings.push(
      warning(
        'left a native element with a dynamic class unchanged; migrate USWDS classes manually',
        line,
      ),
    )
    return null
  }

  const classes = new Set((classAttr?.value ?? '').split(/\s+/).filter(Boolean))
  if (classes.has('usa-button')) {
    const modifiers = [...classes].filter((name) =>
      name.startsWith('usa-button--'),
    )
    const supported = new Set([
      'usa-button--secondary',
      'usa-button--accent-cool',
      'usa-button--accent-warm',
      'usa-button--base',
      'usa-button--outline',
      'usa-button--unstyled',
      'usa-button--big',
    ])
    if (modifiers.some((name) => !supported.has(name))) {
      warnings.push(
        warning(
          `left a USWDS button with unsupported modifiers unchanged: ${modifiers.join(' ')}`,
          line,
        ),
      )
      return null
    }

    const options = { variant: 'filled', tone: 'accent' }
    if (classes.has('usa-button--secondary')) options.variant = 'tonal'
    if (classes.has('usa-button--outline')) options.variant = 'outlined'
    if (classes.has('usa-button--unstyled')) options.variant = 'text'
    if (classes.has('usa-button--accent-cool')) options.tone = 'info'
    if (classes.has('usa-button--accent-warm')) options.tone = 'warning'
    if (classes.has('usa-button--base')) options.tone = 'neutral'
    if (classes.has('usa-button--big')) options.size = 'lg'
    replaceClasses(
      attributes,
      new Set(['usa-button', ...modifiers]),
      ['sds-button'],
    )
    applyOptions(attributes, options)
    return renderTag(tagName, attributes)
  }

  const formClasses = new Map([
    ['usa-input', 'sds-input'],
    ['usa-textarea', 'sds-input'],
    ['usa-select', 'sds-select'],
  ])
  for (const [sourceClass, targetClass] of formClasses) {
    if (classes.has(sourceClass)) {
      replaceClasses(attributes, new Set([sourceClass]), [targetClass])
      return renderTag(tagName, attributes)
    }
  }
  return null
}

function mapLegacyClasses(tagName, attributes, line, warnings) {
  const classAttr = classAttribute(attributes)
  const relevantTags = new Set(['a', 'button', 'input', 'select', 'textarea'])
  if (!relevantTags.has(tagName)) return null
  if (
    classAttr?.dynamic ||
    hasUnsafeBinding(attributes, new Set(['class', 'classname']))
  ) {
    warnings.push(
      warning(
        'left a native element with a dynamic class unchanged; migrate legacy SDS classes manually',
        line,
      ),
    )
    return null
  }

  const classes = new Set((classAttr?.value ?? '').split(/\s+/).filter(Boolean))
  if (classes.has('btn')) {
    const modifiers = [...classes].filter((name) => name.startsWith('btn-'))
    const supported = new Set([
      'btn-primary',
      'btn-secondary',
      'btn-tertiary',
      'btn-ghost',
      'btn-gray',
      'btn-blue',
      'btn-red',
      'btn-white',
      'btn-xs',
      'btn-sm',
      'btn-md',
      'btn-lg',
      'btn-xl',
      'btn-block',
      'btn-cta',
    ])
    if (modifiers.some((name) => !supported.has(name))) {
      warnings.push(
        warning(
          `left a legacy SDS button with unsupported modifiers unchanged: ${modifiers.join(' ')}`,
          line,
        ),
      )
      return null
    }
    const kinds = [
      ['primary', 'filled'],
      ['secondary', 'tonal'],
      ['tertiary', 'outlined'],
      ['ghost', 'text'],
    ]
      .filter(([sourceValue]) => classes.has(`btn-${sourceValue}`))
      .map(([, targetValue]) => targetValue)
    const tones = ['gray', 'blue', 'red', 'white'].filter((value) =>
      classes.has(`btn-${value}`),
    )
    const sizes = ['xs', 'sm', 'md', 'lg', 'xl'].filter((value) =>
      classes.has(`btn-${value}`),
    )
    if (kinds.length > 1 || tones.length > 1 || sizes.length > 1) {
      warnings.push(
        warning(
          `left a legacy SDS button with conflicting modifiers unchanged: ${modifiers.join(' ')}`,
          line,
        ),
      )
      return null
    }
    const options = {
      variant: kinds[0] ?? 'filled',
      tone: classes.has('btn-red')
        ? 'danger'
        : classes.has('btn-gray') || classes.has('btn-white')
          ? 'neutral'
          : 'accent',
      size: sizes[0],
      block: classes.has('btn-block'),
    }
    replaceClasses(attributes, new Set(['btn', ...modifiers]), ['sds-button'])
    applyOptions(attributes, options)
    return renderTag(tagName, attributes)
  }

  if (classes.has('form-control')) {
    const remove = new Set(['form-control'])
    if (classes.has('form-control-sm')) remove.add('form-control-sm')
    replaceClasses(
      attributes,
      remove,
      [tagName === 'select' ? 'sds-select' : 'sds-input'],
    )
    if (classes.has('form-control-sm')) {
      setAttribute(attributes, 'data-sds-size', 'sm')
    }
    return renderTag(tagName, attributes)
  }
  return null
}

function transformComponentButton(
  sourceName,
  attributes,
  source,
  filePath,
  line,
  warnings,
) {
  const unsafeNames = new Set([
    'active',
    'appearance',
    'block',
    'class',
    'classname',
    'href',
    'icon-only',
    'kind',
    'label',
    'loading',
    'pending',
    'pill',
    'size',
    'soft-disabled',
    'static-color',
    'treatment',
    'type',
    'variant',
    'with-caret',
  ])
  if (hasUnsafeBinding(attributes, unsafeNames)) {
    warnings.push(
      warning(
        `left <${sourceName}> unchanged because a style or semantic prop is dynamic`,
        line,
      ),
    )
    return null
  }

  const lowerName = sourceName.toLowerCase()
  const options = {}
  const href = staticValue(findAttribute(attributes, 'href'))
  const targetName = href !== undefined && href !== null ? 'a' : 'button'
  const preferClassName = /\.(jsx|tsx)$/i.test(filePath)

  if (source === 'legacy-sds') {
    const active = isTruthyAttribute(findAttribute(attributes, 'active'))
    if (active) {
      warnings.push(
        warning(
          `left <${sourceName}> unchanged because the legacy active prop needs an application-specific aria-pressed review`,
          line,
        ),
      )
      return null
    }
    const kind = staticValue(findAttribute(attributes, 'kind'))
    options.variant =
      {
        primary: 'filled',
        secondary: 'tonal',
        tertiary: 'outlined',
        ghost: 'text',
      }[kind] ?? 'filled'
    const color = staticValue(findAttribute(attributes, 'variant'))
    if (
      !['filled', 'tonal', 'outlined', 'text'].includes(options.variant) ||
      (color && !['gray', 'blue', 'red', 'white'].includes(color))
    ) {
      warnings.push(
        warning(
          `left <${sourceName}> unchanged because its kind or variant value is unsupported`,
          line,
        ),
      )
      return null
    }
    options.tone =
      color === 'red'
        ? 'danger'
        : color === 'gray' || color === 'white'
          ? 'neutral'
          : 'accent'
    options.size = staticValue(findAttribute(attributes, 'size'))
    options.block = isTruthyAttribute(findAttribute(attributes, 'block')) === true
    if (
      options.size &&
      !['xs', 'sm', 'md', 'lg', 'xl'].includes(options.size)
    ) {
      warnings.push(
        warning(
          `left <${sourceName}> unchanged because size="${options.size}" is unsupported`,
          line,
        ),
      )
      return null
    }

    const type = staticValue(findAttribute(attributes, 'type'))
    if (type === 'cta') setAttribute(attributes, 'type', 'button')
    const pending = isTruthyAttribute(findAttribute(attributes, 'pending'))
    if (pending) {
      setAttribute(attributes, 'aria-busy', 'true')
      setAttribute(attributes, 'disabled')
    }
    for (const name of [
      'active',
      'block',
      'kind',
      'pending',
      'size',
      'variant',
    ]) {
      removeAttribute(attributes, name)
    }
  } else if (source === 'material') {
    options.variant =
      {
        'md-elevated-button': 'tonal',
        'md-filled-button': 'filled',
        'md-filled-tonal-button': 'tonal',
        'md-outlined-button': 'outlined',
        'md-text-button': 'text',
      }[lowerName] ?? 'filled'
    options.tone = 'accent'
    if (isTruthyAttribute(findAttribute(attributes, 'soft-disabled'))) {
      warnings.push(
        warning(
          `left <${sourceName}> unchanged because soft-disabled has no safe native equivalent`,
          line,
        ),
      )
      return null
    }
    removeAttribute(attributes, 'soft-disabled')
    removeAttribute(attributes, 'trailing-icon')
  } else if (source === 'web-awesome') {
    const variant = staticValue(findAttribute(attributes, 'variant')) ?? 'neutral'
    options.tone =
      {
        brand: 'accent',
        danger: 'danger',
        neutral: 'neutral',
        success: 'success',
        warning: 'warning',
      }[variant]
    const appearance =
      staticValue(findAttribute(attributes, 'appearance')) ?? 'accent'
    options.variant =
      {
        accent: 'filled',
        filled: 'filled',
        'filled-outlined': 'tonal',
        outlined: 'outlined',
        plain: 'text',
      }[appearance]
    const size = staticValue(findAttribute(attributes, 'size'))
    if (size && !['small', 'medium', 'large'].includes(size)) {
      warnings.push(
        warning(
          `left <${sourceName}> unchanged because size="${size}" is unsupported`,
          line,
        ),
      )
      return null
    }
    options.size =
      { small: 'sm', medium: 'md', large: 'lg' }[size] ?? size
    if (
      isTruthyAttribute(findAttribute(attributes, 'pill')) ||
      isTruthyAttribute(findAttribute(attributes, 'with-caret'))
    ) {
      warnings.push(
        warning(
          `left <${sourceName}> unchanged because pill/with-caret composition requires manual markup`,
          line,
        ),
      )
      return null
    }
    const loading = isTruthyAttribute(findAttribute(attributes, 'loading'))
    if (loading) {
      setAttribute(attributes, 'aria-busy', 'true')
      setAttribute(attributes, 'disabled')
    }
    for (const name of [
      'appearance',
      'loading',
      'pill',
      'size',
      'variant',
      'with-caret',
    ]) {
      removeAttribute(attributes, name)
    }
  } else if (source === 'spectrum') {
    const variant = staticValue(findAttribute(attributes, 'variant')) ?? 'accent'
    const treatment =
      staticValue(findAttribute(attributes, 'treatment')) ?? 'fill'
    if (
      !['accent', 'primary', 'secondary', 'negative'].includes(variant) ||
      !['fill', 'outline'].includes(treatment)
    ) {
      warnings.push(
        warning(
          `left <${sourceName}> unchanged because its variant or treatment value is unsupported`,
          line,
        ),
      )
      return null
    }
    options.variant =
      treatment === 'outline'
        ? 'outlined'
        : variant === 'secondary'
          ? 'tonal'
          : 'filled'
    options.tone = variant === 'negative' ? 'danger' : variant === 'accent'
      ? 'accent'
      : 'neutral'
    const size = staticValue(findAttribute(attributes, 'size'))
    if (size && !['s', 'm', 'l', 'xl'].includes(size)) {
      warnings.push(
        warning(
          `left <${sourceName}> unchanged because size="${size}" is unsupported`,
          line,
        ),
      )
      return null
    }
    options.size = { s: 'sm', m: 'md', l: 'lg', xl: 'xl' }[size]
    const pending = isTruthyAttribute(findAttribute(attributes, 'pending'))
    if (pending) {
      setAttribute(attributes, 'aria-busy', 'true')
      setAttribute(attributes, 'disabled')
    }
    if (isTruthyAttribute(findAttribute(attributes, 'icon-only'))) {
      options.shape = 'icon'
      const label = staticValue(findAttribute(attributes, 'label'))
      if (label) setAttribute(attributes, 'aria-label', label)
    }
    if (findAttribute(attributes, 'static-color')) {
      warnings.push(
        warning(
          `left <${sourceName}> unchanged because static-color depends on its surrounding surface`,
          line,
        ),
      )
      return null
    }
    for (const name of [
      'icon-only',
      'label',
      'pending',
      'size',
      'static-color',
      'treatment',
      'variant',
    ]) {
      removeAttribute(attributes, name)
    }
  }

  if (!options.variant || !options.tone) {
    warnings.push(
      warning(
        `left <${sourceName}> unchanged because its static appearance value is unsupported`,
        line,
      ),
    )
    return null
  }

  replaceClasses(attributes, new Set(), ['sds-button'], preferClassName)
  applyOptions(attributes, options)
  if (targetName === 'button') {
    if (!findAttribute(attributes, 'type')) {
      setAttribute(attributes, 'type', 'button')
    }
  } else {
    removeAttribute(attributes, 'type')
    if (findAttribute(attributes, 'disabled')) {
      removeAttribute(attributes, 'disabled')
      setAttribute(attributes, 'aria-disabled', 'true')
    }
  }

  return {
    raw: renderTag(targetName, attributes),
    closeRaw: () => `</${targetName}>`,
  }
}

function transformComponentField(
  sourceName,
  attributes,
  targetName,
  source,
  filePath,
  line,
  warnings,
  selfClosing,
) {
  const unsupportedNames = new Set([
    'count-characters',
    'error',
    'error-text',
    'grows',
    'hint',
    'invalid',
    'label',
    'multiline',
    'negative',
    'negative-help-text',
    'prefix-text',
    'quiet',
    'resize',
    'supporting-text',
    'suffix-text',
    'valid',
    'with-clear',
    'with-password-toggle',
  ])
  const unsafeNames = new Set([...unsupportedNames, 'size', 'type'])
  if (hasUnsafeBinding(attributes, unsafeNames)) {
    warnings.push(
      warning(
        `left <${sourceName}> unchanged because a field-shaping prop is dynamic`,
        line,
      ),
    )
    return null
  }

  const unsupported = attributes.find(
    (attribute) =>
      attribute.name && unsupportedNames.has(normalizedName(attribute)),
  )
  if (unsupported) {
    warnings.push(
      warning(
        `left <${sourceName}> unchanged because ${unsupported.name} requires manual label, help, validation, or layout migration`,
        line,
      ),
    )
    return null
  }

  if (
    source === 'material' &&
    staticValue(findAttribute(attributes, 'type')) === 'textarea'
  ) {
    warnings.push(
      warning(
        `left <${sourceName}> unchanged because a Material multiline field requires manual textarea migration`,
        line,
      ),
    )
    return null
  }

  const size = staticValue(findAttribute(attributes, 'size'))
  if (size) {
    const mapped =
      source === 'spectrum'
        ? { s: 'sm', m: 'md', l: 'lg' }[size]
        : { small: 'sm', medium: 'md', large: 'lg' }[size] ?? size
    if (!['sm', 'md', 'lg'].includes(mapped)) {
      warnings.push(
        warning(
          `left <${sourceName}> unchanged because size="${size}" has no safe SDS Lite field mapping`,
          line,
        ),
      )
      return null
    }
    setAttribute(attributes, 'data-sds-size', mapped)
    removeAttribute(attributes, 'size')
  }

  const preferClassName = /\.(jsx|tsx)$/i.test(filePath)
  replaceClasses(
    attributes,
    new Set(),
    [targetName === 'textarea' ? 'sds-input' : 'sds-input'],
    preferClassName,
  )

  if (targetName === 'input') {
    return {
      raw: renderTag('input', attributes, selfClosing),
      closeRaw: '',
    }
  }
  if (selfClosing) {
    return {
      raw: `${renderTag('textarea', attributes)}</textarea>`,
      closeRaw: '',
    }
  }
  return {
    raw: renderTag('textarea', attributes),
    closeRaw: '</textarea>',
  }
}

function transformEmptyComponentFields(
  sourceText,
  source,
  filePath,
  warnings,
) {
  const fields = COMPONENT_FIELDS[source]
  if (!fields) return sourceText
  const names = [...fields.keys()]
    .map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|')
  if (!names) return sourceText

  const pattern = new RegExp(
    `<(${names})\\b((?:\"[^\"]*\"|'[^']*'|[^'\">])*)>\\s*</\\1\\s*>`,
    'gi',
  )
  return sourceText.replace(
    pattern,
    (raw, sourceName, attributesSource, offset) => {
      const attributes = parseAttributes(attributesSource)
      const localWarnings = []
      const result = transformComponentField(
        sourceName,
        attributes,
        fields.get(sourceName.toLowerCase()),
        source,
        filePath,
        lineAt(sourceText, offset),
        localWarnings,
        false,
      )
      if (!result) return raw
      warnings.push(...localWarnings)
      const interiorWhitespace = raw.match(/>(\s*)<\//)?.[1] ?? ''
      return result.raw + (result.closeRaw || '') + interiorWhitespace
    },
  )
}

export function transform(sourceText, options) {
  const source = options.from
  const filePath = options.filePath ?? 'input.html'
  if (!SOURCES.has(source)) throw new Error(`unknown source "${source}"`)
  const warnings = []

  const componentButtons = COMPONENT_BUTTONS[source] ?? new Set()
  const componentFields = COMPONENT_FIELDS[source] ?? new Map()
  const preparedText = transformEmptyComponentFields(
    sourceText,
    source,
    filePath,
    warnings,
  )

  const code = walkMarkup(preparedText, (tag) => {
    const lowerName = tag.name.toLowerCase()
    const attributes = parseAttributes(tag.attributesSource)

    if (componentButtons.has(lowerName)) {
      return transformComponentButton(
        tag.name,
        attributes,
        source,
        filePath,
        tag.line,
        warnings,
      )
    }

    if (componentFields.has(lowerName)) {
      if (!tag.selfClosing) {
        const diagnosticWarnings = []
        const safeShape = transformComponentField(
          tag.name,
          attributes,
          componentFields.get(lowerName),
          source,
          filePath,
          tag.line,
          diagnosticWarnings,
          false,
        )
        warnings.push(
          ...(safeShape
            ? [
                warning(
                  `left <${tag.name}> unchanged because only empty or self-closing component fields can be converted without changing slotted content`,
                  tag.line,
                ),
              ]
            : diagnosticWarnings),
        )
        return null
      }
      return transformComponentField(
        tag.name,
        attributes,
        componentFields.get(lowerName),
        source,
        filePath,
        tag.line,
        warnings,
        tag.selfClosing,
      )
    }

    if (
      source === 'legacy-sds' &&
      ['sdsselect', 'sds-select'].includes(lowerName)
    ) {
      warnings.push(
        warning(
          `left <${tag.name}> unchanged because its options prop must be rewritten as native <option> elements`,
          tag.line,
        ),
      )
      return null
    }

    if (source === 'bootstrap') {
      const mapped = mapBootstrapClasses(
        lowerName,
        attributes,
        tag.line,
        warnings,
      )
      return mapped
        ? { raw: mapped.replace(/>$/, tag.selfClosing ? ' />' : '>') }
        : null
    }
    if (source === 'uswds') {
      const mapped = mapUswdsClasses(
        lowerName,
        attributes,
        tag.line,
        warnings,
      )
      return mapped
        ? { raw: mapped.replace(/>$/, tag.selfClosing ? ' />' : '>') }
        : null
    }
    if (source === 'legacy-sds') {
      const mapped = mapLegacyClasses(
        lowerName,
        attributes,
        tag.line,
        warnings,
      )
      return mapped
        ? { raw: mapped.replace(/>$/, tag.selfClosing ? ' />' : '>') }
        : null
    }
    return null
  })

  return { changed: code !== sourceText, code, warnings }
}

async function validateFiles(files) {
  for (const file of files) {
    let details
    try {
      details = await stat(file)
    } catch (error) {
      if (error?.code === 'ENOENT') throw new Error(`file not found: ${file}`)
      throw error
    }
    if (!details.isFile()) throw new Error(`not a file: ${file}`)
  }
}

export async function run(argv, io = {}) {
  const stdout = io.stdout ?? process.stdout
  const stderr = io.stderr ?? process.stderr
  const arguments_ = parseArguments(argv)
  if (arguments_.help) {
    stdout.write(`${usage()}\n`)
    return 0
  }

  await validateFiles(arguments_.files)
  let changedCount = 0
  let warningCount = 0

  for (const file of arguments_.files) {
    const original = await readFile(file, 'utf8')
    const result = transform(original, {
      filePath: file,
      from: arguments_.from,
    })
    warningCount += result.warnings.length
    for (const item of result.warnings) {
      stderr.write(`${file}:${item.line}: warning: ${item.message}\n`)
    }

    if (!result.changed) {
      stdout.write(`${file}: no supported static changes\n`)
      continue
    }
    changedCount += 1
    if (arguments_.write) {
      await writeFile(file, result.code, 'utf8')
      stdout.write(`${file}: updated\n`)
    } else {
      stdout.write(
        `=== ${file} (SDS Lite migration preview from ${arguments_.from}) ===\n`,
      )
      stdout.write(result.code)
      if (!result.code.endsWith('\n')) stdout.write('\n')
      stdout.write(`=== end ${file} ===\n`)
    }
  }

  stdout.write(
    `${arguments_.write ? 'Updated' : 'Would update'} ${changedCount} of ${arguments_.files.length} file(s); ${warningCount} warning(s).\n`,
  )
  return 0
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))

if (isMain) {
  run(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`sds-lite-migrate: ${error.message}\n`)
    process.exitCode = 1
  })
}

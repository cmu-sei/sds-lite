import assert from 'node:assert/strict'
import { access, readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'

async function sourceFiles(directory, extension) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name)
      if (entry.isDirectory()) return sourceFiles(entryPath, extension)
      return entry.name.endsWith(extension) ? [entryPath] : []
    }),
  )
  return files.flat()
}

const documentationFiles = [
  'README.md',
  '.github/RELEASING.md',
  ...(await sourceFiles('docs', '.md')),
]
const reference = (
  await Promise.all(documentationFiles.map((file) => readFile(file, 'utf8')))
).join('\n')
const packageJson = JSON.parse(await readFile('package.json', 'utf8'))
const interfaceManifest = JSON.parse(
  await readFile('interface-manifest.json', 'utf8'),
)

function allowedValues(definition) {
  if (definition.family) {
    return interfaceManifest.optionFamilies[definition.family]?.values ?? []
  }
  return definition.values ?? []
}

function htmlExamples(source) {
  return Array.from(
    source.matchAll(/```html\s*\n([\s\S]*?)```/g),
    (match) => match[1],
  )
}

function openingTags(source) {
  return Array.from(source.matchAll(/<([a-z][\w-]*)\b([^>]*)>/gi), (match) => ({
    attributes: match[2],
    tagName: match[1].toLowerCase(),
  }))
}

function staticAttributes(source) {
  return new Map(
    Array.from(
      source.matchAll(/([:\w-]+)\s*=\s*["']([^"']*)["']/g),
      (match) => [match[1].toLowerCase(), match[2]],
    ),
  )
}

function markdownSection(source, heading) {
  const start = source.indexOf(`## ${heading}`)
  const end = source.indexOf('\n## ', start + 1)
  return source.slice(start, end === -1 ? undefined : end)
}

test('component features are directly discoverable and consistently structured', async () => {
  const index = await readFile('docs/components/README.md', 'utf8')
  const guidanceSections = new Set([
    'Responsive composition',
    'Commands and dismissal',
    'Choosing the right state',
  ])
  const guides = (await sourceFiles('docs/components', '.md'))
    .filter((file) => path.basename(file) !== 'README.md')

  assert.match(index, /## Feature index/)
  for (const file of guides) {
    const source = await readFile(file, 'utf8')
    for (const section of source.split(/^## /m).slice(1)) {
      const heading = section.slice(0, section.indexOf('\n')).trim()
      if (guidanceSections.has(heading)) continue
      const fragment = heading.toLowerCase().replace(/\s+/g, '-')
      assert.ok(
        index.includes(`(./${path.basename(file)}#${fragment})`),
        `${file}: ${heading} must be directly linked from the feature index`,
      )

      const positions = [
        section.search(/```(?:html|js|tsx)\n/),
        section.indexOf('\n### Options\n'),
        ...(section.includes('\n### Events\n')
          ? [section.indexOf('\n### Events\n')]
          : []),
        section.indexOf('\n### Accessibility\n'),
        section.indexOf('\n### Related\n'),
      ]
      assert.ok(
        positions.every((position, index) =>
          position >= 0 && (index === 0 || position > positions[index - 1])),
        `${file}: ${heading} must order example, options, events, accessibility, and related links`,
      )
    }
  }
})

test('quick start offers one CSS-only path and advanced workflows stay separate', async () => {
  const starter = await readFile('docs/getting-started.md', 'utf8')
  const forms = await readFile('docs/components/forms.md', 'utf8')
  const advanced = await readFile('docs/guides/combobox.md', 'utf8')

  assert.equal(htmlExamples(starter).length, 2)
  assert.doesNotMatch(starter, /<script|<sds-|```(?:js|sh|tsx)\b/)
  assert.match(starter, /<form class="sds-form">/)
  assert.match(starter, /\[NPM installation\]\(\.\/installation\/npm\.md\)/)
  assert.match(markdownSection(forms, 'Combobox'), /\.\.\/guides\/combobox\.md/)
  assert.doesNotMatch(markdownSection(forms, 'Combobox'), /const records|useState|fetch\(/)
  const filter = interfaceManifest.customElements
    .find((element) => element.tagName === 'sds-combobox')
    .attributes.find((attribute) => attribute.name === 'filter')
  assert.ok(forms.includes(
    `| \`filter\` | ${filter.values.map((value) => `\`${value}\``).join(', ')} | \`${filter.default}\` |`,
  ))
  for (const heading of [
    'Rich suggestions and record IDs',
    'Multiple selections',
    'Application-supplied results',
    'React 19 record picker',
    'Vue record picker',
  ]) {
    assert.ok(advanced.includes(`## ${heading}`), heading)
  }
})

test('CDN documentation uses the versioned GitHub repository location', async () => {
  const cdnGuide = await readFile('docs/installation/cdn.md', 'utf8')
  const sources = [
    reference,
    await readFile('index.html', 'utf8'),
    await readFile('interface-manifest.schema.json', 'utf8'),
  ].join('\n')
  const expectedBase =
    `https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v${packageJson.version}/dist/`
  const urls = Array.from(
    sources.matchAll(
      /https:\/\/cdn\.jsdelivr\.net\/gh\/cmu-sei\/sds-lite@v\d+\.\d+\.\d+[^'"<>\s)]*/g,
    ),
    (match) => match[0],
  )

  assert.ok(urls.length > 0)
  assert.equal(urls.every((url) => url.startsWith(expectedBase)), true)
  assert.doesNotMatch(sources, /cdn\.jsdelivr\.net\/npm\/@cmu-sei\/sds-lite/)
  assert.doesNotMatch(sources, /cmu-sei\.github\.io\/sds-lite\/(?:dist\/|(?:sds|auto|brand)\.(?:css|js))/)
  assert.match(
    cdnGuide,
    /cdn\.jsdelivr\.net\/gh\/cmu-sei\/sds-lite@vVERSION\/dist\/FILE/,
  )
  assert.match(cdnGuide, /only needs `sds\.css` and `auto\.js`/)
  assert.doesNotMatch(cdnGuide, /published package files/)
})

test('local documentation links and anchors resolve', async () => {
  for (const file of documentationFiles) {
    const source = await readFile(file, 'utf8')
    const links = Array.from(
      source.matchAll(/\[[^\]]+\]\(([^)]+)\)/g),
      (match) => match[1],
    )

    for (const link of links) {
      if (link.startsWith('http://') || link.startsWith('https://')) continue

      const [relativePath, fragment] = link.split('#')
      const target = path.resolve(
        path.dirname(file),
        relativePath || path.basename(file),
      )
      await assert.doesNotReject(
        access(target),
        `${file} links to missing ${link}`,
      )
      if (!fragment) continue

      const destination = await readFile(target, 'utf8')
      if (path.extname(target) === '.html') {
        assert.ok(
          destination.includes(`id="${fragment}"`) ||
            destination.includes(`id='${fragment}'`),
          `${file} links to missing anchor ${link}`,
        )
        continue
      }

      const headingCounts = new Map()
      const headings = Array.from(
        destination.matchAll(/^#{1,6}\s+(.+)$/gm),
        (match) => {
          const slug = match[1]
            .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
            .replace(/<[^>]+>|[*_`~]/g, '')
            .toLowerCase()
            .replace(/[^\p{L}\p{N}_ -]/gu, '')
            .trim()
            .replace(/\s+/g, '-')
          const count = headingCounts.get(slug) ?? 0
          headingCounts.set(slug, count + 1)
          return count ? `${slug}-${count}` : slug
        },
      )
      assert.ok(
        headings.includes(decodeURIComponent(fragment)),
        `${file} links to missing anchor ${link}`,
      )
    }
  }
})

function matches(source, pattern) {
  return new Set(Array.from(source.matchAll(pattern), (match) => match[1]))
}

test('documentation lists every public CSS class', async () => {
  const files = await sourceFiles('src/css', '.css')
  const css = (
    await Promise.all(files.map((file) => readFile(file, 'utf8')))
  ).join('\n')
  const classes = matches(css, /\.((?:sds-[a-z0-9-]+)|(?:sds-not-prose))\b/g)

  for (const className of classes) {
    assert.match(reference, new RegExp(`\\.${className}\\b`), className)
  }
  assert.match(reference, /`\.sds-prose-lead`/)
})

test('documentation lists every public data attribute', async () => {
  const files = await sourceFiles('src', '.css')
  const typescriptFiles = await sourceFiles('src/elements', '.ts')
  const source = (
    await Promise.all(
      [...files, ...typescriptFiles].map((file) => readFile(file, 'utf8')),
    )
  ).join('\n')
  const attributes = matches(source, /\b(data-[a-z][a-z0-9-]*)\b/g)
  for (const property of matches(source, /\.dataset\.([A-Za-z][A-Za-z0-9]*)/g)) {
    attributes.add(
      `data-${property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`,
    )
  }

  for (const attribute of attributes) {
    assert.match(reference, new RegExp(`\\b${attribute}\\b`), attribute)
  }
})

test('HTML examples use option values supported by their recipe', async () => {
  const globalOptions = new Map(
    interfaceManifest.globalAttributes.map((attribute) => [
      attribute.name,
      allowedValues(attribute),
    ]),
  )
  const classRecipes = new Map(
    interfaceManifest.recipes.flatMap((recipe) =>
      recipe.classes.map((className) => [className, recipe]),
    ),
  )
  const elementRecipes = new Map()
  for (const recipe of interfaceManifest.recipes) {
    for (const element of recipe.elements ?? []) {
      const recipes = elementRecipes.get(element) ?? []
      recipes.push(recipe)
      elementRecipes.set(element, recipes)
    }
  }

  for (const file of documentationFiles) {
    const source = await readFile(file, 'utf8')
    for (const example of htmlExamples(source)) {
      for (const tag of openingTags(example)) {
        const attributes = staticAttributes(tag.attributes)
        const classes = (attributes.get('class') ?? '').split(/\s+/)
        for (const className of classes) {
          if (!className.startsWith('sds-')) continue
          assert.ok(
            classRecipes.has(className),
            `${file} uses unknown public class ${className}`,
          )
        }
        const recipes = classes
          .map((className) => classRecipes.get(className))
          .filter(Boolean)
        if (recipes.length === 0) {
          recipes.push(...(elementRecipes.get(tag.tagName) ?? []))
        }

        for (const [name, value] of attributes) {
          if (!name.startsWith('data-sds-')) continue
          const candidateValues = globalOptions.has(name)
            ? globalOptions.get(name)
            : recipes.flatMap((recipe) =>
                Object.hasOwn(recipe.options, name)
                  ? allowedValues({
                      family: recipe.optionFamilies?.[name],
                      values: recipe.options[name],
                    })
                  : [],
              )
          if (candidateValues.length === 0) continue
          assert.ok(
            candidateValues.includes(value),
            `${file} uses unsupported ${name}="${value}" on <${tag.tagName}>`,
          )
        }
      }
    }
  }
})

test('documented custom-element examples use declared option values', async () => {
  const elements = new Map(interfaceManifest.customElements.map((element) => [element.tagName, element]))
  for (const file of documentationFiles) {
    const source = await readFile(file, 'utf8')
    for (const example of htmlExamples(source)) {
      for (const tag of openingTags(example)) {
        const element = elements.get(tag.tagName)
        if (!element) continue
        for (const [name, value] of staticAttributes(tag.attributes)) {
          const definition = element.attributes.find((attribute) => attribute.name === name)
          if (!definition) continue
          const values = allowedValues(definition)
          if (values.length > 0) {
            assert.ok(values.includes(value), `${file}: <${tag.tagName}> uses unsupported ${name}="${value}"`)
          }
          if (definition.type === 'number') {
            assert.ok(value.trim() && Number.isFinite(Number(value)), `${file}: ${name} must be a finite number`)
          }
        }
      }
    }
  }
})

test('CSS reference lists every public foundation property', async () => {
  const tokens = await readFile('src/css/tokens.css', 'utf8')
  const cssReference = await readFile('docs/reference/css.md', 'utf8')
  const foundation = tokens.slice(
    0,
    tokens.indexOf(
      ':where([data-sds-root]) {\n    color-scheme:',
    ),
  )
  const properties = matches(foundation, /(--sds-[a-z0-9-]+)\s*:/g)

  for (const property of properties) {
    if (property.startsWith('--sds-typography-')) continue
    const primitiveFamily = /^--sds-(gray|purple|blue|red|green|orange)-\d+$/.test(
      property,
    )
    const semanticToneFamily =
      /^--sds-color-(neutral|accent|info|success|warning|danger)-(surface|border|text|strong|strong-hover|on-strong)$/.test(
        property,
      )
    assert.ok(
      cssReference.includes(property) ||
        (primitiveFamily && cssReference.includes('--sds-gray-{25')) ||
        (semanticToneFamily && cssReference.includes('--sds-color-{tone}-')),
      property,
    )
  }
})

test('CSS interface omits unused and component-specific foundation properties', async () => {
  const files = await sourceFiles('src/css', '.css')
  const css = (
    await Promise.all(files.map((file) => readFile(file, 'utf8')))
  ).join('\n')
  const cssReference = await readFile('docs/reference/css.md', 'utf8')

  for (const property of [
    '--sds-color-border-control',
    '--sds-color-interactive-subtle-active',
    '--sds-color-overlay-strong',
    '--sds-color-shadow-subtle',
    '--sds-color-text-label',
    '--sds-space-button-gap',
  ]) {
    assert.equal(css.includes(property), false, property)
    assert.equal(cssReference.includes(property), false, property)
  }
})

test('public motion tokens use the documented three-tier scale', async () => {
  const tokens = await readFile('src/css/tokens.css', 'utf8')
  const cssReference = await readFile('docs/reference/css.md', 'utf8')
  const motionReference = markdownSection(cssReference, 'Motion')
  const expectedProperties = new Set([
    '--sds-duration-fast',
    '--sds-duration-normal',
    '--sds-duration-slow',
    '--sds-easing-standard',
    '--sds-easing-enter',
    '--sds-easing-exit',
  ])

  assert.deepEqual(
    matches(tokens, /(--sds-(?:duration|easing)-[a-z0-9-]+)\s*:/g),
    expectedProperties,
  )
  assert.deepEqual(
    matches(motionReference, /(--sds-(?:duration|easing)-[a-z0-9-]+)/g),
    expectedProperties,
  )
})

test('component guide tone defaults agree with the public interface', async () => {
  const forms = await readFile('docs/components/forms.md', 'utf8')
  const navigation = await readFile('docs/components/navigation.md', 'utf8')
  const feedback = await readFile('docs/components/feedback.md', 'utf8')
  const switchTone = interfaceManifest.recipes
    .find((recipe) => recipe.name === 'switch')
    .defaults['data-sds-tone']
  const tabsTone = interfaceManifest.customElements
    .find((element) => element.tagName === 'sds-tabs')
    .attributes.find((attribute) => attribute.name === 'tone').default
  const toastTone = interfaceManifest.customElements
    .find((element) => element.tagName === 'sds-toast')
    .attributes.find((attribute) => attribute.name === 'tone').default

  assert.match(
    markdownSection(forms, 'Switch'),
    new RegExp('data-sds-tone[^\\n]+\\| `' + switchTone + '` \\|'),
  )
  assert.match(
    markdownSection(navigation, 'Tabs'),
    new RegExp('\\| `tone` \\|[^\\n]+\\| `' + tabsTone + '` \\|'),
  )
  assert.match(
    markdownSection(feedback, 'Toast'),
    new RegExp('\\| `tone` \\|[^\\n]+\\| `' + toastTone + '` \\|'),
  )
})

test('documentation lists every package entry', async () => {
  for (const entry of Object.keys(packageJson.exports)) {
    if (entry === './package.json') continue
    const publicEntry =
      entry === '.' ? '@cmu-sei/sds-lite' : `@cmu-sei/sds-lite/${entry.slice(2)}`
    assert.ok(reference.includes(publicEntry), publicEntry)
  }
})

test('documentation does not reference package entries that do not exist', () => {
  const packageEntries = new Set(
    Object.keys(packageJson.exports).map((entry) =>
      entry === '.'
        ? '@cmu-sei/sds-lite'
        : `@cmu-sei/sds-lite/${entry.slice(2)}`,
    ),
  )
  const documentedEntries = matches(
    reference,
    /[`'"](@cmu-sei\/sds-lite(?:\/[a-z0-9./-]+)?)[`'"]/gi,
  )

  assert.deepEqual(
    [...documentedEntries].filter((entry) => !packageEntries.has(entry)),
    [],
  )
})

test('every documented versioned CDN file exists in the build', async () => {
  const urls = Array.from(
    reference.matchAll(
      /https:\/\/cdn\.jsdelivr\.net\/gh\/cmu-sei\/sds-lite@v\d+\.\d+\.\d+\/dist\/([^'"<>\s)]+)/g,
    ),
    (match) => match[1],
  )

  for (const filename of new Set(urls)) {
    await assert.doesNotReject(access(path.resolve('dist', filename)), filename)
  }
})

test('documentation lists every root declaration', async () => {
  const declarations = await readFile('dist/package/sds.d.ts', 'utf8')
  const names = matches(
    declarations,
    /export (?:declare )?(?:class|function|interface|type) ([A-Za-z0-9_]+)/g,
  )

  for (const name of names) {
    assert.match(reference, new RegExp(`\\b${name}\\b`), name)
  }
})

test('framework guides retain current SSR integration contracts', async () => {
  const frameworks = await readFile('docs/guides/frameworks.md', 'utf8')
  const serverRendering = await readFile(
    'docs/guides/server-rendering.md',
    'utf8',
  )

  assert.match(frameworks, /defineConfig\(\{\s*plugins:/)
  assert.match(frameworks, /app\/plugins\/sds\.client\.ts \(Nuxt 4\)/)
  assert.match(frameworks, /let \{ children \} = \$props\(\)/)
  assert.match(frameworks, /<Scripts \/>/)
  assert.match(frameworks, /this\.appRef\.whenStable\(\)/)
  assert.doesNotMatch(frameworks, /afterNextRender\(setupSds\)/)
  assert.doesNotMatch(
    `${reference}\n${serverRendering}`,
    /hydrateApplication\(\)\s*setupSds\(\)/,
  )
})

test('theming guidance identifies every private property family', async () => {
  const theming = await readFile('docs/guides/theming.md', 'utf8')

  for (const prefix of [
    'avatar',
    'button',
    'datapoint',
    'floating',
    'grid',
    'prose',
    'tab',
    'tag',
    'timeline',
    'tone',
  ]) {
    assert.ok(theming.includes(`--sds-${prefix}-*`), prefix)
  }
})

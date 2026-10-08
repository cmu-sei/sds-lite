import Ajv from 'ajv/dist/2020.js'

export function validateInterfaceManifest(manifest, schema) {
  const validator = new Ajv({ allErrors: true, strict: true, allowUnionTypes: true })
  const validate = validator.compile(schema)
  if (!validate(manifest)) {
    throw new Error(`Invalid interface manifest: ${validator.errorsText(validate.errors)}`)
  }
  const unique = (values, label) => {
    if (new Set(values).size !== values.length) throw new Error(`Duplicate ${label}`)
  }
  unique(manifest.recipes.map(recipe => recipe.name), 'recipe names')
  unique(manifest.recipes.flatMap(recipe => recipe.classes), 'recipe classes')
  unique(manifest.customElements.map(element => element.tagName), 'element names')
  unique(manifest.globalAttributes.map(attribute => attribute.name), 'global attributes')
  const attributes = [...manifest.globalAttributes]
  const sharedEvents = new Map()
  for (const element of manifest.customElements) {
    unique(element.attributes.map(attribute => attribute.name), `${element.tagName} attributes`)
    unique(element.members.map(member => member.name), `${element.tagName} members`)
    unique((element.events ?? []).map(event => event.name), `${element.tagName} events`)
    attributes.push(...element.attributes)
    for (const member of element.members) {
      unique((member.parameters ?? []).map(parameter => parameter.name), `${element.tagName}.${member.name} parameters`)
    }
    for (const event of element.events ?? []) {
      const signature = JSON.stringify([event.type, Object.entries(event.detail).sort()])
      if (sharedEvents.has(event.name) && sharedEvents.get(event.name) !== signature) {
        throw new Error(`Conflicting event contract: ${event.name}`)
      }
      sharedEvents.set(event.name, signature)
    }
  }
  for (const attribute of attributes) {
    if (attribute.family && !Object.hasOwn(manifest.optionFamilies, attribute.family)) {
      throw new Error(`Unknown option family: ${attribute.family}`)
    }
    unique(attribute.values ?? [], `${attribute.name} values`)
  }
  for (const recipe of manifest.recipes) {
    for (const name of [...Object.keys(recipe.optionTypes ?? {}), ...Object.keys(recipe.optionTargets ?? {}), ...Object.keys(recipe.omissionDefaults ?? {})]) {
      if (!Object.hasOwn(recipe.options, name)) throw new Error(`Unknown option: ${recipe.name}.${name}`)
    }
    for (const [name, values] of Object.entries(recipe.options)) {
      unique(values, `${recipe.name}.${name} values`)
      if (!Object.hasOwn(recipe.defaults ?? {}, name)) throw new Error(`Missing default: ${recipe.name}.${name}`)
      const defaultValue = recipe.defaults[name]
      const omission = recipe.omissionDefaults?.[name]
      const derived = typeof defaultValue === 'string' && defaultValue !== '' && !values.includes(defaultValue)
      if (derived ? omission !== defaultValue : omission !== undefined) {
        throw new Error(`Ambiguous default: ${recipe.name}.${name}`)
      }
      if (!values.length && typeof defaultValue !== 'boolean' && !recipe.optionTypes?.[name]) {
        throw new Error(`Missing option type: ${recipe.name}.${name}`)
      }
    }
  }
  const recipes = new Set(manifest.recipes.map(recipe => recipe.name))
  const elements = new Set(manifest.customElements.map(element => element.tagName))
  unique((manifest.compositions ?? []).map(composition => `${composition.kind}:${composition.name}`), 'composition names')
  for (const composition of manifest.compositions ?? []) {
    for (const name of composition.recipes) {
      if (!recipes.has(name)) throw new Error(`Unknown composition recipe: ${name}`)
    }
    for (const name of composition.customElements) {
      if (!elements.has(name)) throw new Error(`Unknown composition element: ${name}`)
    }
    if (!composition.stylesheets.includes('sds.css') ||
      composition.recipes.includes('application-shell') && !composition.stylesheets.includes('brand.css') ||
      composition.customElements.length && !composition.requiresSetup) {
      throw new Error(`Missing composition dependency: ${composition.name}`)
    }
  }
}
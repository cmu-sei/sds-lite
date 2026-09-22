import { expect, test } from '@playwright/test'

const cases = [
  {
    name: 'button',
    defaultTone: 'accent',
    markup:
      '<button type="button" data-tone-target data-sds-variant="primary" {{tone}}>Button</button>',
  },
  {
    name: 'compact-button',
    defaultTone: 'accent',
    markup:
      '<button type="button" data-tone-target data-sds-density="compact" data-sds-variant="primary" {{tone}}>Button</button>',
  },
  {
    name: 'link',
    defaultTone: 'accent',
    markup: '<a class="sds-link" data-tone-target href="#" {{tone}}>Link</a>',
  },
  {
    name: 'field',
    defaultTone: 'neutral',
    markup:
      '<div class="sds-field" {{tone}}><small data-tone-target>Help text</small></div>',
  },
  {
    name: 'switch',
    defaultTone: 'accent',
    markup:
      '<label class="sds-switch" {{tone}}><input data-tone-target type="checkbox" role="switch" checked>Switch</label>',
  },
  {
    name: 'badge',
    defaultTone: 'neutral',
    markup: '<span class="sds-badge" data-tone-target {{tone}}>Badge</span>',
  },
  {
    name: 'tag',
    defaultTone: 'neutral',
    markup: '<span class="sds-tag" data-tone-target {{tone}}>Tag</span>',
  },
  {
    name: 'callout',
    defaultTone: 'neutral',
    markup:
      '<div class="sds-callout" data-tone-target {{tone}}><strong>Callout</strong><span>Message</span></div>',
  },
  {
    name: 'spinner',
    defaultTone: 'neutral',
    markup:
      '<span class="sds-spinner" data-tone-target role="status" {{tone}}></span>',
  },
  {
    name: 'avatar',
    defaultTone: 'neutral',
    markup:
      '<span class="sds-avatar" data-tone-target {{tone}}>AM</span>',
  },
  {
    name: 'datapoint',
    defaultTone: 'neutral',
    markup:
      '<div class="sds-datapoint" {{tone}}><span>Drafts</span><div><strong data-tone-target>9</strong></div></div>',
  },
  {
    name: 'dropdown-parts',
    defaultTone: 'neutral',
    markup:
      '<div class="sds-dropdown-menu"><button type="button" data-tone-target {{tone}}>Item</button></div>',
  },
  {
    name: 'prose',
    defaultTone: 'neutral',
    markup:
      '<div class="sds-prose" {{tone}}><a data-tone-target href="#">Link</a></div>',
  },
  {
    name: 'tabs',
    defaultTone: 'accent',
    attribute: 'tone',
    properties: ['color', 'backgroundColor', 'borderBlockEndColor'],
    markup:
      '<sds-tabs {{tone}}><div class="sds-tab-list" role="tablist"><button type="button" id="{{id}}-tab" class="sds-tab" data-tone-target role="tab" aria-controls="{{id}}-panel" aria-selected="true">Tab</button></div><section id="{{id}}-panel" class="sds-tab-panel" role="tabpanel" aria-labelledby="{{id}}-tab">Panel</section></sds-tabs>',
  },
  {
    name: 'toast',
    defaultTone: 'accent',
    attribute: 'tone',
    pseudo: '::before',
    markup:
      '<sds-toast data-tone-target open {{tone}}><strong>Toast</strong><span>Message</span></sds-toast>',
  },
]

for (const colorScheme of ['light', 'dark']) {
  test(`omitted tones match explicit defaults in ${colorScheme} mode`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await page.locator('[data-sds-root]').evaluate(
      (root, { cases, colorScheme }) => {
        root.setAttribute('data-sds-color-scheme', colorScheme)
        const markup = cases
          .flatMap((testCase) =>
            ['omitted', 'explicit'].map((mode) => {
              const attribute = testCase.attribute ?? 'data-sds-tone'
              const tone =
                mode === 'explicit'
                  ? `${attribute}="${testCase.defaultTone}"`
                  : ''
              const id = `default-tone-${testCase.name}-${mode}`
              return `<div data-tone-case="${testCase.name}" data-tone-mode="${mode}">${testCase.markup
                .replace('{{tone}}', tone)
                .replaceAll('{{id}}', id)}</div>`
            }),
          )
          .join('')
        root.insertAdjacentHTML(
          'afterbegin',
          `<div style="position: fixed; visibility: hidden">${markup}</div>`,
        )
      },
      { cases, colorScheme },
    )

    for (const testCase of cases) {
      const readStyles = (mode) =>
        page
          .locator(
            `[data-tone-case="${testCase.name}"][data-tone-mode="${mode}"] [data-tone-target]`,
          )
          .evaluate(
            (element, { properties, pseudo }) => {
              const style = getComputedStyle(element, pseudo)
              return Object.fromEntries(
                properties.map((property) => [property, style[property]]),
              )
            },
            {
              properties: testCase.properties ?? [
                'color',
                'backgroundColor',
                'borderColor',
              ],
              pseudo: testCase.pseudo,
            },
          )

      expect.soft(
        await readStyles('omitted'),
        `${testCase.name} should use its ${testCase.defaultTone} default tone`,
      ).toEqual(await readStyles('explicit'))
    }
  })
}

test('playground exposes omitted-tone examples for every interface', async ({
  page,
}) => {
  await page.goto('/')

  const examples = [
    {
      name: 'regular and compact buttons',
      selector: '#default-action-tones button',
      count: 8,
      attribute: 'data-sds-tone',
    },
    {
      name: 'link',
      selector: '#default-action-tones .sds-link',
      count: 1,
      attribute: 'data-sds-tone',
    },
    {
      name: 'field',
      selector: '#default-form-tones .sds-field',
      count: 1,
      attribute: 'data-sds-tone',
    },
    {
      name: 'switch',
      selector: '#default-form-tones .sds-switch',
      count: 1,
      attribute: 'data-sds-tone',
    },
    {
      name: 'badge',
      selector: '#default-feedback-tones .sds-badge',
      count: 1,
      attribute: 'data-sds-tone',
    },
    {
      name: 'tag',
      selector: '#default-feedback-tones .sds-tag',
      count: 1,
      attribute: 'data-sds-tone',
    },
    {
      name: 'callout',
      selector: '#default-feedback-tones .sds-callout',
      count: 1,
      attribute: 'data-sds-tone',
    },
    {
      name: 'toast',
      selector: '#toast-default',
      count: 1,
      attribute: 'tone',
    },
    {
      name: 'avatar',
      selector: '#default-content-tones .sds-avatar',
      count: 1,
      attribute: 'data-sds-tone',
    },
    {
      name: 'datapoint',
      selector: '#default-content-tones .sds-datapoint',
      count: 1,
      attribute: 'data-sds-tone',
    },
    {
      name: 'prose',
      selector: '#default-prose-tones .sds-prose:not([data-sds-tone])',
      count: 1,
      attribute: 'data-sds-tone',
    },
    {
      name: 'tabs',
      selector: '#default-tabs',
      count: 1,
      attribute: 'tone',
    },
    {
      name: 'dropdown parts',
      selector: '#default-dropdown [role="menuitem"]:not([data-sds-tone])',
      count: 2,
      attribute: 'data-sds-tone',
    },
    {
      name: 'spinner',
      selector: '#default-spinner-tones .sds-spinner:not([data-sds-tone])',
      count: 1,
      attribute: 'data-sds-tone',
    },
  ]

  for (const example of examples) {
    const locator = page.locator(example.selector)
    await expect(locator, example.name).toHaveCount(example.count)
    expect(
      await locator.evaluateAll(
        (elements, attribute) =>
          elements.every((element) => !element.hasAttribute(attribute)),
        example.attribute,
      ),
      `${example.name} should omit ${example.attribute}`,
    ).toBe(true)
  }
})

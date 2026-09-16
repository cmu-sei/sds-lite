import assert from 'node:assert/strict'
import test from 'node:test'

import { computeFloatingPosition } from '../package/floating.js'

const viewport = { width: 800, height: 640 }
const surface = { width: 180, height: 120 }

test('an open floating surface retains its resolved side while it still fits', () => {
  const initiallyFlipped = computeFloatingPosition({
    anchor: {
      top: 560,
      right: 200,
      bottom: 600,
      left: 100,
      width: 100,
      height: 40,
    },
    surface,
    viewport,
    preferredPlacement: 'bottom-start',
    previousPlacement: null,
    offset: 5,
  })
  assert.equal(initiallyFlipped.placement, 'top-start')
  assert.equal(initiallyFlipped.side, 'top')

  const afterScroll = computeFloatingPosition({
    anchor: {
      top: 300,
      right: 200,
      bottom: 340,
      left: 100,
      width: 100,
      height: 40,
    },
    surface,
    viewport,
    preferredPlacement: 'bottom-start',
    previousPlacement: initiallyFlipped.placement,
    offset: 5,
  })
  assert.equal(afterScroll.placement, 'top-start')
  assert.equal(afterScroll.top, 175)
})

test('a retained side flips only when its alternative fits better', () => {
  const position = computeFloatingPosition({
    anchor: {
      top: 20,
      right: 200,
      bottom: 60,
      left: 100,
      width: 100,
      height: 40,
    },
    surface,
    viewport,
    preferredPlacement: 'bottom-start',
    previousPlacement: 'top-start',
    offset: 5,
  })

  assert.equal(position.placement, 'bottom-start')
  assert.equal(position.top, 65)
})

test('cardinal placements align and flip on both axes', () => {
  const position = computeFloatingPosition({
    anchor: {
      top: 580,
      right: 790,
      bottom: 620,
      left: 690,
      width: 100,
      height: 40,
    },
    surface,
    viewport,
    preferredPlacement: 'right-start',
    previousPlacement: null,
    offset: 5,
  })

  assert.equal(position.placement, 'left-end')
  assert.equal(position.side, 'left')
  assert.equal(position.left, 505)
  assert.equal(position.top, 500)
})

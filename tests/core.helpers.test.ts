import assert, { equal } from 'assert'
import { describe, it } from 'mocha'

import { Enlightenment } from '../dist/Enlightenment'

const instance = new Enlightenment()

describe('Core:instance', () => {
  const timestamp = instance.useTimestamp()
  const date = instance.useTimestamp(true)

  it(`Calculates the timestamp in real time: ${timestamp}`, () => {
    assert.equal(typeof timestamp, 'number')
    assert.equal(timestamp <= 500, true)
    assert.notEqual(timestamp, 0)
  })

  it(`Generates the current Unix timestamp: ${date}`, () => {
    assert.equal(typeof date, 'number')
    assert.notEqual(date, 0)
  })
})

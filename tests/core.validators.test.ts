import assert, { equal } from 'assert'
import { describe, it } from 'mocha'

import { Enlightenment } from '../dist/Enlightenment'

describe('Properties', () => {
  it('Can generate timestamp ID values', () => {
    const id = Enlightenment.generateTimestampID()

    assert.equal(id.length > 4, true)
    assert.equal(typeof id, 'string')
    assert.equal(id.startsWith('uuid'), true)
  })
})

describe('Parsers', () => {
  it(`resolveURL`, () => {
    const url = 'http://example.com/get'
    const localhost = 'http://127.0.0.1'
    const resolved = Enlightenment.resolveURL(url)

    assert.equal(resolved.startsWith(localhost), true)
    assert.notEqual(url, resolved)
    assert.equal(resolved.startsWith(localhost), true)
    assert.equal(resolved.endsWith('get'), true)
  })

  it(`parseJSON`, () => {
    const json = `{"foo": "bar"}`
    const result = Enlightenment.parseJSON(json)
    const commit = { entry: [] }
    const transform = Enlightenment.parseJSON(json, () => commit)
    const invalid = Enlightenment.parseJSON(false)

    const { foo } = result

    assert.equal(foo, 'bar')
    assert.equal(result instanceof Object, true)
    assert.equal(result instanceof Object, true)
    assert.notDeepEqual(transform, result)
    assert.equal(Array.isArray(transform), true)
    assert.equal(transform.length, 1)
    assert.equal(invalid.length, 0)
  })

  it(`parseMatrixValue`, () => {
    const translate = `translate(-50px, -25pt)`
    const matrix = Enlightenment.parseMatrixValue(translate)
    const invalid = Enlightenment.parseMatrixValue(false)

    assert.equal(matrix[0], -50)
    assert.equal(matrix[1], -25)
    assert.equal(invalid.length, 0)
  })

  it('Strip', () => {
    const whitespace = 'some body tab   tabtab'
    const strip = Enlightenment.strip(whitespace)

    assert.notEqual(whitespace.length, strip.length)
  })

  it('filterProperty', () => {
    const properties = ['foo', 'bar', 'baz']

    const valid = Enlightenment.filterPropertyValue(properties[1], properties)
    const fallback = Enlightenment.filterProperty('john', properties)

    assert.equal(valid, properties[1])
    assert.equal(fallback, properties[0])
  })

  it('isBoolean', () => {
    const resultA = Enlightenment.isBoolean('false')
    const resultB = Enlightenment.isBoolean('true')
    const resultC = Enlightenment.isBoolean(1)
    const resultD = Enlightenment.isBoolean(0)
    const resultE = Enlightenment.isBoolean({})
    const resultF = Enlightenment.isBoolean([])

    assert.equal(resultA, false)
    assert.equal(resultB, true)
    assert.equal(resultC, true)
    assert.equal(resultD, true)
    assert.equal(resultE, true)
    assert.equal(resultF, true)
  })

  it('isInteger', () => {
    const int = 4
    const float = 0.4
    const invalid = '0'
    const obj = {}

    assert.equal(Enlightenment.isInteger(int), int)
    assert.equal(Enlightenment.isInteger(float), 0)
    assert.equal(Enlightenment.isInteger(invalid), 0)
    assert.equal(Enlightenment.isInteger(obj), NaN)
    assert.equal(Enlightenment.isInteger(''), undefined)
  })
})

describe('Validators', () => {
  it('compareValue', () => {
    const boolean = Enlightenment.compareValue(true, false)
    const booleanEqual = Enlightenment.compareValue(true, true)

    const string = Enlightenment.compareValue('foo', 'bar')
    const stringEqual = Enlightenment.compareValue('foo', 'foo')

    const array = Enlightenment.compareValue([1], [2])
    const arrayEqual = Enlightenment.compareValue([1, 2], [1, 2])

    const object = Enlightenment.compareValue({ foo: 'bar' }, { john: 'doe ' })
    const objectEqual = Enlightenment.compareValue(
      { foo: 'bar', john: 'doe' },
      { foo: 'bar', john: 'doe' }
    )

    assert.equal(boolean, false)
    assert.equal(booleanEqual, true)
    assert.equal(string, false)
    assert.equal(stringEqual, true)
    assert.equal(array, false)
    assert.equal(arrayEqual, true)
    assert.equal(object, false)
    assert.equal(objectEqual, true)
  })

  it('isExternalURL', () => {
    const internal = Enlightenment.isExternalURL('/foo')
    const external = Enlightenment.isExternalURL('http://example.com')

    assert.equal(internal, false)
    assert.equal(external, true)
  })

  it(`isMode`, () => {
    const invalid = 'yeast'
    const valid = 'light'

    assert.equal(Enlightenment.isMode(invalid) !== invalid, true)
    assert.equal(Enlightenment.isMode(valid) == valid, true)
    assert.equal(Enlightenment.isMode(valid), Enlightenment.isMode(invalid))
  })

  it('isTarget', () => {
    const _self = '_self'
    const _blank = '_blank'
    const _parent = '_parent'
    const _top = '_top'
    const fallback = '_host'

    assert.equal(Enlightenment.isTarget(_self), _self)
    assert.equal(Enlightenment.isTarget(_blank), _blank)
    assert.equal(Enlightenment.isTarget(_parent), _parent)
    assert.equal(Enlightenment.isTarget(_top), _top)
    assert.equal(Enlightenment.isTarget(fallback), _self)
  })
})

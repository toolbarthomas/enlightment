import assert, { equal } from 'assert'
import { describe, it } from 'mocha'

import { Enlightenment } from '../dist/Enlightenment'

describe('Static globals', () => {
  const invalid = 'yeast'
  const valid = 'light'

  it('MAX_THREADS', () => assert.equal(typeof Enlightenment.MAX_THREADS, 'number'))
  it('NAMESPACE', () => assert.equal(typeof Enlightenment.NAMESPACE, 'string'))
  it('FPS', () => assert.equal(typeof Enlightenment.FPS, 'number'))
  it('RPS', () => assert.equal(typeof Enlightenment.RPS, 'number'))
  it('Global', () => assert.equal(Enlightenment.Global instanceof Object, true))
  it('devicePixelRatio', () => assert.equal(Enlightenment.devicePixelRatio >= 1, true))
  it('webfontExtensions', () => assert.equal(Enlightenment.webfontExtensions.length > 0, true))

  it('State', () => assert.equal(Enlightenment.globals instanceof Object, true))
  it('State[currentElements]', () =>
    assert.equal(Array.isArray(Enlightenment.globals.currentElements), true))
  it('State[currentAttribute]', () =>
    assert.equal(typeof Enlightenment.globals.currentAttribute, 'string'))
  it('State[mode]', () => assert.equal(Enlightenment.globals.mode.length > 0, true))
  it('State[namespace]', () => assert.equal(typeof Enlightenment.globals.mode, 'string'))
  it('State[verbose]', () => assert.equal(Enlightenment.globals.verbose, undefined))
  it('State[providers]', () => assert.equal(Array.isArray(Enlightenment.globals.providers), true))
  it('State[instances]', () => assert.equal(Array.isArray(Enlightenment.globals.instances), true))
  it('State[cleanupRequest]', () => assert.equal(Enlightenment.globals.cleanupRequest, undefined))

  it(`isMode`, () => {
    assert.equal(Enlightenment.isMode(invalid) !== invalid, true)
    assert.equal(Enlightenment.isMode(valid) == valid, true)
    assert.equal(Enlightenment.isMode(valid), Enlightenment.isMode(invalid))
  })
})

describe('Parsers', () => {
  it(`Resolve any URL within the current enviroment:`, () => {
    const url = 'http://example.com/get'
    const localhost = 'http://127.0.0.1'
    const resolved = Enlightenment.resolveURL(url)

    assert.equal(resolved.startsWith(localhost), true)
    assert.notEqual(url, resolved)
    assert.equal(resolved.startsWith(localhost), true)
    assert.equal(resolved.endsWith('get'), true)
  })

  it(`Parse any JSON`, () => {
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

  it(`Parse matrix values`, () => {
    const translate = `translate(-50px, -25pt)`
    const matrix = Enlightenment.parseMatrixValue(translate)
    const invalid = Enlightenment.parseMatrixValue(false)

    assert.equal(matrix[0], -50)
    assert.equal(matrix[1], -25)
    assert.equal(invalid.length, 0)
  })

  it('Strips any whitespace', () => {
    const whitespace = 'some body tab   tabtab'
    const strip = Enlightenment.strip(whitespace)

    assert.notEqual(whitespace.length, strip.length)
  })

  it('Can compare Primitive value types:', () => {
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

  it('Can filter property values', () => {
    const properties = ['foo', 'bar', 'baz']

    const valid = Enlightenment.filterPropertyValue(properties[1], properties)
    const fallback = Enlightenment.filterProperty('john', properties)

    assert.equal(valid, properties[1])
    assert.equal(fallback, properties[0])
  })

  it('Can generate timestamp ID values', () => {
    const id = Enlightenment.generateTimestampID()

    assert.equal(id.length > 4, true)
    assert.equal(typeof id, 'string')
    assert.equal(id.startsWith('uuid'), true)
  })

  it('Decode boolean values', () => {
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

  it('Validate external URLS', () => {
    const internal = Enlightenment.isExternalURL('/foo')
    const external = Enlightenment.isExternalURL('http://example.com')

    assert.equal(internal, false)
    assert.equal(external, true)
  })
})

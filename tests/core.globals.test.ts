import assert, { equal } from 'assert'
import { describe, it } from 'mocha'

import { Enlightenment } from '../dist/Enlightenment'

describe('Static globals', () => {
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
})

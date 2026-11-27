import { describe, expect, test } from 'vitest'
import { MODULES } from '../modules/registry'
import { loginEmail, sessionIdOf } from './api'
import { suggestDeviceName } from './device'
import { greeting } from './greeting'
import { togglePin } from './pins'
import { parseRoute, hrefOf } from './route'
import { RADEK, sessionFor } from '../test/fakeApi'

describe('logging in', () => {
  test('a username becomes the hidden nest.home address', () => {
    expect(loginEmail(' Radek ')).toBe('radek@nest.home')
  })

  test('a real email address is used as typed', () => {
    expect(loginEmail('Someone@Example.com')).toBe('someone@example.com')
  })

  test('the session id is read from the access token', () => {
    expect(sessionIdOf(sessionFor(RADEK, 'abc-123'))).toBe('abc-123')
  })
})

describe('naming the phone', () => {
  const iphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)'
  const android = 'Mozilla/5.0 (Linux; Android 15; Pixel 9) Mobile Safari/537.36'

  test('suggests the owner and the kind of phone', () => {
    expect(suggestDeviceName('Radek', iphone)).toBe("Radek's iPhone")
    expect(suggestDeviceName('Didem', android)).toBe("Didem's Android phone")
  })

  test('names ending in s get just an apostrophe', () => {
    expect(suggestDeviceName('Chris', iphone)).toBe("Chris' iPhone")
  })
})

describe('pins', () => {
  const name = (k: string) => k.toUpperCase()

  test('pinning and unpinning', () => {
    expect(togglePin([], 'a', name)).toEqual({ pins: ['a'], message: 'Pinned A to the bar' })
    expect(togglePin(['a'], 'a', name)).toEqual({ pins: [], message: 'Unpinned A' })
  })

  test('a third pin replaces the oldest', () => {
    expect(togglePin(['a', 'b'], 'c', name)).toEqual({ pins: ['b', 'c'], message: 'Pinned C in place of A' })
  })
})

describe('routes', () => {
  test('round trip', () => {
    for (const r of [{ name: 'home' }, { name: 'all' }, { name: 'us' }, { name: 'module', key: 'groceries' }] as const) {
      expect(parseRoute(hrefOf(r))).toEqual(r)
    }
  })

  test('anything unknown goes home', () => {
    expect(parseRoute('#/nope/../x')).toEqual({ name: 'home' })
  })
})

test('greetings follow the time of day', () => {
  expect(greeting(8).text).toBe('Good morning')
  expect(greeting(14).text).toBe('Good afternoon')
  expect(greeting(20)).toEqual({ text: 'Good evening', sky: 'moon' })
  expect(greeting(2).text).toBe('Hello, night owl')
})

test('the registry matches the modules the database creates', () => {
  expect(MODULES.map((m) => m.key)).toEqual(['groceries', 'todos', 'wishlists', 'finances'])
})

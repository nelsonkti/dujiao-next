import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveBrandName } from '../src/utils/brand.ts'

test('legacy brands resolve to JD1688', () => {
  for (const value of [undefined, null, '', 'Dujiao-Next', 'D&J Studio', 'Dujiao-Next · D&N']) {
    assert.equal(resolveBrandName(value), 'JD1688')
  }
})

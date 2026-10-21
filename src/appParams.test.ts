import assert from 'node:assert';
import {describe, it} from 'node:test';
import {dateRange, generateItemParams, generateFileItemParams} from './app.ts';

const DATE = '2021-05-08';
const TEST_RANGE = {$gte: '2000-01-01T00:00:00.000Z', $lte: '2021-05-08T00:00:00.000Z'};
const PRODUCTION_RANGE = {$gte: new Date('2000-01-01'), $lte: new Date('2021-05-08')};

describe('dateRange', () => {
  it('returns ISO string range when useTestDates is true', () => {
    assert.deepStrictEqual(dateRange({date: DATE, useTestDates: true}), TEST_RANGE);
  });

  it('returns Date object range when useTestDates is false', () => {
    assert.deepStrictEqual(dateRange({date: DATE, useTestDates: false}), PRODUCTION_RANGE);
  });
});

describe('generateItemParams', () => {
  const cases = [
    {
      name: 'removeProtected: true, useTestDates: true',
      params: {removeProtected: true, date: DATE, useTestDates: true},
      expected: {creationTime: TEST_RANGE}
    },
    {
      name: 'removeProtected: false, useTestDates: true',
      params: {removeProtected: false, date: DATE, useTestDates: true},
      expected: {$and: [{creationTime: TEST_RANGE}, {protected: {$in: [null, false]}}]}
    },
    {
      name: 'removeProtected: true, useTestDates: false',
      params: {removeProtected: true, date: DATE, useTestDates: false},
      expected: {creationTime: PRODUCTION_RANGE}
    },
    {
      name: 'removeProtected: false, useTestDates: false',
      params: {removeProtected: false, date: DATE, useTestDates: false},
      expected: {$and: [{creationTime: PRODUCTION_RANGE}, {protected: {$in: [null, false]}}]}
    }
  ];

  for (const {name, params, expected} of cases) {
    it(name, () => {
      assert.deepStrictEqual(generateItemParams(params), expected);
    });
  }
});

describe('generateFileItemParams', () => {
  it('returns uploadDate ISO string range when useTestDates is true', () => {
    const actual = generateFileItemParams({date: DATE, useTestDates: true});
    assert.deepStrictEqual(actual, {uploadDate: TEST_RANGE});
  });

  it('returns uploadDate Date object range when useTestDates is false', () => {
    const actual = generateFileItemParams({date: DATE, useTestDates: false});
    assert.deepStrictEqual(actual, {uploadDate: PRODUCTION_RANGE});
  });
});

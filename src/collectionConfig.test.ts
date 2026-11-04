import assert from 'node:assert';
import {describe, it} from 'node:test';
import {parseCollectionConfigs} from './collectionConfig.ts';
import type {CollectionConfig} from './collectionConfig.ts';

function entry(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {db: 'movies', collection: 'files', removeDaysFromNow: 30, ...overrides};
}

interface InvalidCase {
  name: string;
  input: unknown;
  expectedError: string;
}
const invalidCases: InvalidCase[] = [
  {
    name: 'rejects an invalid JSON string',
    input: '{not json',
    expectedError: 'MONGO_DATABASE_AND_COLLECTIONS is not valid JSON'
  },
  {
    name: 'rejects a JSON object that is not an array',
    input: {db: 'movies', collection: 'files'},
    expectedError: 'MONGO_DATABASE_AND_COLLECTIONS must be a JSON array'
  },
  {
    name: 'rejects a number input',
    input: 42,
    expectedError: 'MONGO_DATABASE_AND_COLLECTIONS must be a JSON array'
  },
  {
    name: 'rejects a null entry',
    input: [null],
    expectedError: 'MONGO_DATABASE_AND_COLLECTIONS[0] must be an object'
  },
  {
    name: 'rejects an array entry',
    input: [[1, 2]],
    expectedError: 'MONGO_DATABASE_AND_COLLECTIONS[0] must be an object'
  },
  {
    name: 'rejects a number entry',
    input: [42],
    expectedError: 'MONGO_DATABASE_AND_COLLECTIONS[0] must be an object'
  },
  {
    name: 'rejects a non-string db',
    input: [entry({db: 42})],
    expectedError: 'MONGO_DATABASE_AND_COLLECTIONS[0].db must be a string'
  },
  {
    name: 'rejects a non-string collection',
    input: [entry({collection: null})],
    expectedError: 'MONGO_DATABASE_AND_COLLECTIONS[0].collection must be a string'
  },
  {
    name: 'rejects a missing removeDaysFromNow',
    input: [entry({removeDaysFromNow: undefined})],
    expectedError: 'MONGO_DATABASE_AND_COLLECTIONS[0].removeDaysFromNow must be an integer'
  },
  {
    name: 'rejects a non-integer removeDaysFromNow',
    input: [entry({removeDaysFromNow: 2.5})],
    expectedError: 'MONGO_DATABASE_AND_COLLECTIONS[0].removeDaysFromNow must be an integer'
  },
  {
    name: 'rejects a string removeDaysFromNow',
    input: [entry({removeDaysFromNow: '7'})],
    expectedError: 'MONGO_DATABASE_AND_COLLECTIONS[0].removeDaysFromNow must be an integer'
  },
  {
    name: 'rejects a non-boolean removeProtected',
    input: [entry({removeProtected: 'yes'})],
    expectedError: 'MONGO_DATABASE_AND_COLLECTIONS[0].removeProtected, file and test must be booleans'
  },
  {
    name: 'rejects a non-boolean file',
    input: [entry({file: 1})],
    expectedError: 'MONGO_DATABASE_AND_COLLECTIONS[0].removeProtected, file and test must be booleans'
  },
  {
    name: 'rejects a non-boolean test',
    input: [entry({test: null})],
    expectedError: 'MONGO_DATABASE_AND_COLLECTIONS[0].removeProtected, file and test must be booleans'
  }
];

interface ValidCase {
  name: string;
  input: unknown;
  expected: CollectionConfig[];
}
const validCases: ValidCase[] = [
  {
    name: 'parses a valid JSON string',
    input: '[{"db":"d","collection":"c","removeDaysFromNow":7}]',
    expected: [{db: 'd', collection: 'c', removeDaysFromNow: 7, removeProtected: false, file: false, test: false}]
  },
  {
    name: 'parses a plain array with explicit and default boolean fields',
    input: [
      entry({removeDaysFromNow: 7, removeProtected: true, file: true, test: false}),
      {db: 'movies', collection: 'blobs', removeDaysFromNow: 365}
    ],
    expected: [
      {db: 'movies', collection: 'files', removeDaysFromNow: 7, removeProtected: true, file: true, test: false},
      {db: 'movies', collection: 'blobs', removeDaysFromNow: 365, removeProtected: false, file: false, test: false}
    ]
  }
];

describe('parseCollectionConfigs', () => {
  for (const {name, input, expectedError} of invalidCases) {
    it(name, () => {
      assert.throws(() => parseCollectionConfigs(input), new Error(expectedError));
    });
  }

  for (const {name, input, expected} of validCases) {
    it(name, () => {
      assert.deepStrictEqual(parseCollectionConfigs(input), expected);
    });
  }
});

import assert from 'node:assert';
import {describe, it} from 'node:test';

// config.ts reads MONGO_URI and MONGO_DATABASE_AND_COLLECTIONS at import time,
// so the environment variables must be set before importing the module.
process.env['MONGO_URI'] = 'mongodb://localhost:27017/test';
process.env['MONGO_DATABASE_AND_COLLECTIONS'] = '[{"db":"d","collection":"c","removeDaysFromNow":7}]';

const {parseMongoUri} = await import('./config.ts');

interface InvalidCase {
  name: string;
  input: unknown;
}
const invalidCases: InvalidCase[] = [
  {name: 'rejects an undefined MONGO_URI', input: undefined},
  {name: 'rejects a non-string MONGO_URI', input: 123},
  {name: 'rejects an empty string MONGO_URI', input: ''}
];

interface ValidCase {
  name: string;
  input: unknown;
  expected: string;
}
const validCases: ValidCase[] = [
  {name: 'returns a valid MONGO_URI unchanged', input: 'mongodb://localhost:27017/test', expected: 'mongodb://localhost:27017/test'}
];

describe('parseMongoUri', () => {
  for (const {name, input} of invalidCases) {
    it(name, () => {
      assert.throws(() => parseMongoUri(input), new Error('MONGO_URI must be a non-empty string'));
    });
  }

  for (const {name, input, expected} of validCases) {
    it(name, () => {
      assert.strictEqual(parseMongoUri(input), expected);
    });
  }
});

import assert from 'node:assert';
import {READERS} from '@natlibfi/fixura';
import generateTests, {type CallbackArgs} from '@natlibfi/fixugen';
import mongoFixturesFactory, {type FixuraMongoGridFS, type FixtureData} from '@natlibfi/fixura-mongo';
import startApp from './app.ts';
import {parseCollectionConfigs} from './collectionConfig.ts';

let mongoFixtures: FixuraMongoGridFS | undefined;

function requireFixtures(): FixuraMongoGridFS {
  if (mongoFixtures === undefined) {
    throw new Error('mongo fixtures not initialized');
  }

  return mongoFixtures;
}

generateTests({
  callback,
  path: [import.meta.dirname, '..', 'test-fixtures', 'clean'],
  recurse: false,
  useMetadataFile: true,
  fixura: {
    failWhenNotFound: true,
    reader: READERS.JSON
  },
  hooks: {
    before: async () => {
      await initMongofixtures();
    },
    beforeEach: () => requireFixtures().clear(),
    afterEach: () => requireFixtures().clear(),
    after: async () => {
      await requireFixtures().close();
    }
  }
});

async function initMongofixtures(): Promise<void> {
  mongoFixtures = await mongoFixturesFactory({
    rootPath: [import.meta.dirname, '..', 'test-fixtures', 'clean'],
    gridFS: {bucketName: 'blobs'},
    useObjectId: true,
    format: {
      blobmetadatas: {
        creationTime: v => new Date(String(v)),
        modificationTime: v => new Date(String(v))
      }
    }
  });
}

async function callback({getFixture, mongoDatabaseAndCollections}: CallbackArgs): Promise<void> {
  const fixtures = requireFixtures();
  const mongoUri = fixtures.getUri();
  const dbContents = requireFixtureData(getFixture('dbContents.json'), 'dbContents.json');
  await fixtures.populate(dbContents);
  await startApp({mongoUri, mongoDatabaseAndCollections: parseCollectionConfigs(mongoDatabaseAndCollections)}, '2021-05-08', true);
  const dump = await fixtures.dump();
  const expectedResult = requireFixtureData(getFixture('expectedResult.json'), 'expectedResult.json');
  assert.deepStrictEqual(dump, expectedResult);
}

function requireFixtureData(value: unknown, name: string): FixtureData {
  if (isFixtureData(value)) {
    return value;
  }

  throw new Error(`${name} is not valid fixture data (expected an object of arrays)`);
}

function isFixtureData(value: unknown): value is FixtureData {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  return Object.values(value).every((items) => Array.isArray(items) && items.every((item) => typeof item === 'object' && item !== null));
}

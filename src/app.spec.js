// import {expect} from 'chai';
import {expect} from 'chai';
import {READERS} from '@natlibfi/fixura';
import generateTests from '@natlibfi/fixugen';
import mongoFixturesFactory from '@natlibfi/fixura-mongo';
import {MongoClient} from 'mongodb';
import startApp from './app';

let mongoFixtures; // eslint-disable-line functional/no-let
let client; // eslint-disable-line functional/no-let

generateTests({
  callback,
  path: [__dirname, '..', 'test-fixtures', 'clean'],
  recurse: false,
  useMetadataFile: true,
  fixura: {
    failWhenNotFound: true,
    reader: READERS.JSON
  },
  mocha: {
    before: async () => {
      await initMongofixtures();
    },
    beforeEach: () => mongoFixtures.clear(),
    afterEach: async () => {
      if (client) { // eslint-disable-line functional/no-conditional-statement
        await client.close();
      }
      await mongoFixtures.clear();
    },
    after: async () => {
      await mongoFixtures.close();
    }
  }
});

async function initMongofixtures() {
  mongoFixtures = await mongoFixturesFactory({
    rootPath: [__dirname, '..', 'test-fixtures', 'clean'],
    gridFS: {bucketName: 'blobs'},
    useObjectId: true
  });
}

async function callback({
  getFixture,
  mongoDatabaseAndCollections
}) {
  await connectClient();
  insertOnePopulate(getFixture('dbContents.json'));
  const mongoUri = await mongoFixtures.getUri();
  await startApp(mongoUri, mongoDatabaseAndCollections, 0, '2021-05-08');
  const dump = await mongoFixtures.dump();
  const expectedResult = getFixture('expectedResult.json');
  expect(dump).to.eql(expectedResult);
}

async function insertOnePopulate(items) {
  const [item, ...rest] = items;

  if (item === undefined) {
    return;
  }

  await client.db().collection(item.collection).insertOne({correlationId: item.value.correlationId, creationTime: new Date(item.value.creationTime)});
  return insertOnePopulate(rest);
}

async function connectClient() {
  const connectionUri = await mongoFixtures.getUri();
  client = await MongoClient.connect(connectionUri, {useNewUrlParser: true});
}

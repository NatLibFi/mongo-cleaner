// import {expect} from 'chai';
import fixtureFactory, {READERS} from '@natlibfi/fixura';
import mongoFixturesFactory from '@natlibfi/fixura-mongo';
import {expect} from 'chai';
import startApp from './app';

run();

async function run() {

  const promises = ['1', '2', '3', '4'].map(async index => {
    const {getFixture} = await fixtureFactory({
      root: [__dirname, '..', 'test-fixtures', 'clean', index],
      reader: READERS.JSON
    });
    const metadata = await getFixture('metadata.json');

    if (metadata.only) {
      return it.only(`${index} ONLY ${metadata.description}`, () => testProcess({getFixture, index, ...metadata}));
    }

    if (metadata.skip) {
      return it.skip(`${index} SKIP ${metadata.description}`, () => testProcess({getFixture, index, ...metadata}));
    }

    return it(`${index} ${metadata.description}`, () => testProcess({getFixture, index, ...metadata}));
  });

  await Promise.all(promises);
  throw new Error('done');
}

async function testProcess({getFixture, index, removeDateLimit, mongoDatabaseAndCollections}) {
  const mongoFixtures = await mongoFixturesFactory({rootPath: [__dirname, '..', 'test-fixtures', 'clean', index], useObjectId: false});
  try {
    const mongoUri = await mongoFixtures.getUri();
    await mongoFixtures.populate(['dbContents.json']);
    await startApp({mongoUri, removeDateLimit, mongoDatabaseAndCollections});
    const dump = await mongoFixtures.dump();
    const expectedResult = getFixture('expectedResult.json');
    expect(dump).to.eql(expectedResult);
    return;
  } finally {
    mongoFixtures.clear();
    mongoFixtures.close();
  }
}

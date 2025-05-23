import {promisify} from 'util';
import {MongoClient} from 'mongodb';
import {createLogger} from '@natlibfi/melinda-backend-commons';

const setTimeoutPromise = promisify(setTimeout);

export default async function ({mongoUri, mongoDatabaseAndCollections}, momentDate) {
  const logger = createLogger();
  logger.info('Starting mongo cleaning');
  const client = await MongoClient.connect(mongoUri);

  await createSearchProcess(mongoDatabaseAndCollections);

  await client.close();
  if (momentDate === '2021-05-08') { // test escape
    return;
  }

  logger.info('Done, await 2h till next restart');
  await setTimeoutPromise(7200000); // 2h
  //await setTimeoutPromise(10000); // 10sec
  logger.info('Restarting');
  return;

  async function createSearchProcess(configs) {
    const [config, ...rest] = configs;

    if (config === undefined) {
      return;
    }

    const {db, collection, removeDaysFromNow, removeProtected, file = false, test = false} = config;
    const removeDate = new Date(momentDate);
    removeDate.setDate(removeDate.getDate() - removeDaysFromNow);
    const removeDateIso = new Date(removeDate).toISOString();
    const dbOperator = db === '' ? client.db() : client.db(db);
    logger.info(`Collection: ${config.collection}, Status: PROCESS, Remove items older than: ${removeDateIso}, Remove protected: ${config.removeProtected}`);
    await searchItem(dbOperator.collection(collection), {
      collection,
      removeProtected,
      date: removeDateIso,
      file,
      test
    });

    return createSearchProcess(rest);
  }

  async function searchItem(mongoOperator, {collection, removeProtected, date, file, test}) {
    // find and remove
    const params = generateParams(removeProtected, date, file, test);

    const item = await mongoOperator.findOne(params);

    if (item === null) {
      logger.info(`Collection: ${collection}, Status: DONE, remove Protected: ${removeProtected}`);
      return;
    }

    if (file) {
      logger.debug(`Removing file item: ${item.filename}, created: ${item.uploadDate}`);
      await mongoOperator.deleteMany({filename: item.filename});
      return searchItem(mongoOperator, {collection, removeProtected, date, file, test});
    }

    logger.debug(`Removing item: ${item.correlationId}, created: ${item.creationTime}`);

    if (removeProtected) {
      await mongoOperator.deleteMany({correlationId: item.correlationId, protected: {'$in': [true, false, null]}});
      return searchItem(mongoOperator, {collection, removeProtected, file, date, test});
    }

    await mongoOperator.deleteMany({correlationId: item.correlationId, protected: {$nin: [true]}});
    return searchItem(mongoOperator, {collection, removeProtected, file, date, test});

    function generateParams(removeProtected, date, file, test) {
      if (file) {
        const query = {
          'uploadDate': {
            '$gte': test ? new Date('2000-01-01').toISOString() : new Date('2000-01-01'),
            '$lte': test ? new Date(date).toISOString() : new Date(date)
          }
        };

        return query;
      }

      if (removeProtected) {
        const query = {
          'creationTime': {
            '$gte': test ? new Date('2000-01-01').toISOString() : new Date('2000-01-01'),
            '$lte': test ? new Date(date).toISOString() : new Date(date)
          }
        };

        return query;
      }

      const query = {
        '$and': [
          {
            'creationTime': {
              '$gte': test ? new Date('2000-01-01').toISOString() : new Date('2000-01-01'),
              '$lte': test ? new Date(date).toISOString() : new Date(date)
            }
          },
          {
            'protected': {'$in': [null, false]}
          }
        ]
      };

      return query;
    }
  }
}

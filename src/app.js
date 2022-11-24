import {MongoClient} from 'mongodb';
import moment from 'moment';
import {createLogger} from '@natlibfi/melinda-backend-commons';

export default async function ({mongoUri, mongoDatabaseAndCollections}, momentDate) {
  const logger = createLogger();
  logger.info('Starting mongo cleaning');
  const client = await MongoClient.connect(mongoUri, {useNewUrlParser: true, useUnifiedTopology: true});

  const processes = mongoDatabaseAndCollections.flatMap(({db, collection, softRemoveDays = 7, forceRemoveDays = 30}) => {
    const softRemoveDate = moment(momentDate).subtract(softRemoveDays, 'd').format();
    const forceRemoveDate = moment(momentDate).subtract(forceRemoveDays, 'd').format();
    const dbOperator = db === '' ? client.db() : client.db(db);
    return [
      searchItem(dbOperator.collection(collection), collection, false, softRemoveDate),
      searchItem(dbOperator.collection(collection), collection, true, forceRemoveDate)
    ];
  });

  await Promise.all(processes);
  await client.close();
  logger.info('Done');
  return;

  async function searchItem(mongoOperator, collection, removeProtected, date) {
    // find and remove
    // params "modificationTime":"2020-01-01T00:00:01.000Z",
    const params = generateParams(removeProtected, date);

    const item = await mongoOperator.findOne(params);

    if (item) {
      await mongoOperator.deleteOne({correlationId: item.correlationId});
      return searchItem(mongoOperator, collection, removeProtected, date);
    }

    logger.info(`Collection ${collection} done`); // eslint-disable-line no-console
    return;
  }

  function generateParams(removeProtected, date) {
    if (removeProtected) {
      // console.log('FORCE REMOVE: ', moment.utc(date).format()) // eslint-disable-line
      return {
        modificationTime: {$lte: `${moment.utc(date).format()}`, $gte: '1900-01-01T00:00:01Z'}
      };
    }

    // console.log('SOFT REMOVE: ', moment.utc(date).format()) // eslint-disable-line
    return {
      $and: [
        {
          modificationTime: {
            $lte: `${moment.utc(date).format()}`,
            $gte: '1900-01-01T00:00:01Z'
          }
        },
        {
          protected: {$in: [null, false]}
        }
      ]
    };
  }
}

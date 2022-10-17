/* eslint-disable no-unused-vars */

import {MongoClient} from 'mongodb';
import moment from 'moment';
import {createLogger} from '@natlibfi/melinda-backend-commons';
import sanitize from 'mongo-sanitize';

export default async function ({removeDateLimit, mongoUri, mongoDatabaseAndCollections}) {
  const cleanRemoveDateLimit = sanitize(removeDateLimit);
  const logger = createLogger();
  logger.info('Starting mongo cleaning');
  const client = await MongoClient.connect(mongoUri, {useNewUrlParser: true, useUnifiedTopology: true});

  const processes = mongoDatabaseAndCollections.map(({db, collection, removeProtected = false}) => {
    const dbOperator = db === '' ? client.db() : client.db(db);
    return searchItem(dbOperator.collection(collection), collection, removeProtected);
  });

  await Promise.all(processes);
  client.close();
  logger.info('Done');
  return;

  async function searchItem(mongoOperator, collection, removeProtected) {
    // find and remove
    // params "modificationTime":"2020-01-01T00:00:01.000Z",
    const params = generateParams(removeProtected);

    const item = await mongoOperator.findOne(params);

    if (item) {
      await mongoOperator.deleteOne({correlationId: item.correlationId});
      return searchItem(mongoOperator, collection);
    }

    logger.info(`Collection ${collection} done`); // eslint-disable-line no-console
    return;
  }

  function generateParams(removeProtected) {
    if (removeProtected) {
      return {
        modificationTime: {$lte: `${moment.utc(cleanRemoveDateLimit).format()}`, $gte: '1900-01-01T00:00:01Z'}
      };
    }

    return {
      $and: [
        {
          modificationTime: {
            $lte: `${moment.utc(cleanRemoveDateLimit).format()}`,
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

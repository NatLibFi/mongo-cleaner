import {MongoClient} from 'mongodb';
import moment from 'moment';
import {createLogger} from '@natlibfi/melinda-backend-commons';
import {promisify} from 'util';

export default function (mongoUri, mongoDatabaseAndCollections, pollTime, momentDate) {
  const logger = createLogger();
  const setTimeoutPromise = promisify(setTimeout);
  let currentDate = momentDate; // eslint-disable-line functional/no-let
  return timer();

  async function timer(wait) {
    if (wait) {
      if (pollTime === 0) {
        return;
      }
      currentDate = moment().format();
      logger.info(`Next cleanup: ${moment.utc(currentDate).add(pollTime, 'milliseconds').format()}`);
      await setTimeoutPromise(pollTime);
      return clean();
    }

    return clean();
  }

  async function clean() {
    try {
      logger.info('Starting mongo cleaning');
      const client = await MongoClient.connect(mongoUri, {useNewUrlParser: true, useUnifiedTopology: true});

      const processes = mongoDatabaseAndCollections.flatMap(({db, collection, softRemoveDays = 7, forceRemoveDays = 30}) => {
        const softRemoveDate = moment(currentDate).subtract(softRemoveDays, 'd').format();
        const forceRemoveDate = moment(currentDate).subtract(forceRemoveDays, 'd').format();
        const dbOperator = db === '' ? client.db() : client.db(db);
        return [
          searchItem(dbOperator.collection(collection), collection, false, softRemoveDate),
          searchItem(dbOperator.collection(collection), collection, true, forceRemoveDate)
        ];
      });

      await Promise.all(processes);
      logger.info('Done');
      client.close();
      return timer(true);
    } catch (error) {
      logger.error(error);
      return timer(true);
    }

    async function searchItem(mongoOperator, collection, removeProtected, date) {
      // find and remove
      // params "modificationTime":"2020-01-01T00:00:01.000Z",
      const params = generateParams(removeProtected, date);
      logger.info(`Searching params: ${params}`);
      const item = await mongoOperator.findOne(params);

      if (item) {
        logger.info(`Deleting logs id: ${item.corelationId}, Modified: ${item.modificationTime}`);
        await mongoOperator.deleteOne({correlationId: item.correlationId});
        return searchItem(mongoOperator, collection, removeProtected, date);
      }

      logger.info(`Collection ${collection} ${removeProtected ? 'hard' : 'soft'} cleaning done`); // eslint-disable-line no-console
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
}

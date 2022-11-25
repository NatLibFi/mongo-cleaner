import moment from 'moment';
import {handleInterrupt, createLogger} from '@natlibfi/melinda-backend-commons';
import * as config from './config.js';
import startApp from './app.js';

run(config);

async function run({mongoUri, mongoDatabaseAndCollections, pollTime}) {
  const logger = createLogger();
  registerInterruptionHandlers();
  const date = moment().format();

  await startApp(mongoUri, mongoDatabaseAndCollections, pollTime, date);
  return;

  function registerInterruptionHandlers() {
    process
      .on('SIGTERM', handleSignal)
      .on('SIGINT', handleInterrupt)
      .on('uncaughtException', ({stack}) => {
        handleTermination({code: 1, message: stack});
      })
      .on('unhandledRejection', ({stack}) => {
        handleTermination({code: 1, message: stack});
      });

    function handleSignal(signal) {
      handleTermination({code: 1, message: `Received ${signal}`});
    }
  }

  function handleTermination({code = 0, message = false}) {
    logMessage(message);

    process.exit(code); // eslint-disable-line no-process-exit

    function logMessage(message) {
      if (message) {
        return logger.error(message);
      }
    }
  }
}

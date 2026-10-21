import {handleInterrupt, createLogger} from '@natlibfi/melinda-commons';
import * as config from './config.ts';
import startApp from './app.ts';
import moment from 'moment';

run();

async function run() {
  const logger = createLogger();
  registerInterruptionHandlers();
  const date = moment().format();
  await startApp(config, date);
  return;

  function registerInterruptionHandlers() {
    process
      .on('SIGTERM', handleSignal)
      .on('SIGINT', handleInterrupt)
      .on('uncaughtException', (error) => {
        const stack = error instanceof Error ? error.stack : undefined;
        handleTermination({code: 1, message: stack});
      })
      .on('unhandledRejection', (reason) => {
        const stack = reason instanceof Error ? reason.stack : undefined;
        handleTermination({code: 1, message: stack});
      });

    function handleSignal(signal: NodeJS.Signals | string) {
      handleTermination({code: 1, message: `Received ${signal}`});
    }
  }

  function handleTermination({code = 0, message}: {code?: number, message?: string}) {
    if (message) {
      logger.error(message);
    }

    process.exit(code);
  }
}

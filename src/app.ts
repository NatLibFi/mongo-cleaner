import {promisify} from 'util';
import {MongoClient, type Collection, type Document, type Filter} from 'mongodb';
import {createLogger} from '@natlibfi/melinda-commons';
import type {CollectionConfig} from './collectionConfig.ts';

const setTimeoutPromise = promisify(setTimeout);
const logger = createLogger();
const SEARCH_FROM = new Date('2000-01-01');

interface FileItem extends Document {
  filename: string;
  uploadDate: Date | string;
}

interface CorrelatedItem extends Document {
  correlationId: string;
  creationTime: Date | string;
  protected?: boolean | null;
}

export interface StartAppOptions {
  readonly mongoUri: string;
  readonly mongoDatabaseAndCollections: CollectionConfig[];
}

interface ItemSearchParams {
  readonly collection: string;
  readonly removeProtected: boolean;
  readonly date: string;
  readonly useTestDates: boolean;
}

export default async function startApp({mongoUri, mongoDatabaseAndCollections}: StartAppOptions, momentDate: string, test = false): Promise<void> {
  logger.info('Starting mongo cleaning');
  const client = await MongoClient.connect(mongoUri);
  await createSearchProcess(client, momentDate, mongoDatabaseAndCollections);
  await client.close();

  if (test) {
    return;
  }

  logger.info('Done, await 2h till next restart');
  await setTimeoutPromise(7200000); // 2h
  logger.info('Restarting');
}

async function createSearchProcess(client: MongoClient, momentDate: string, configs: CollectionConfig[]): Promise<void> {
  const [config, ...rest] = configs;

  if (config === undefined) {
    return;
  }

  const {db, collection, removeDaysFromNow, removeProtected, file, test: useTestDates} = config;
  const removeDate = new Date(momentDate);
  removeDate.setDate(removeDate.getDate() - removeDaysFromNow);
  const removeDateIso = removeDate.toISOString();
  const dbOperator = db === '' ? client.db() : client.db(db);
  logger.info(`Collection: ${collection}, Status: PROCESS, Remove items older than: ${removeDateIso}, Remove protected: ${removeProtected}`);

  if (file) {
    await removeFileItems(dbOperator.collection<FileItem>(collection), {collection, removeProtected, date: removeDateIso, useTestDates});
  } else {
    await removeItems(dbOperator.collection<CorrelatedItem>(collection), {collection, removeProtected, date: removeDateIso, useTestDates});
  }

  return createSearchProcess(client, momentDate, rest);
}

async function removeItems(collection: Collection<CorrelatedItem>, {collection: name, removeProtected, date, useTestDates}: ItemSearchParams): Promise<void> {
  const item = await collection.findOne(generateItemParams({removeProtected, date, useTestDates}));

  if (item === null) {
    logger.info(`Collection: ${name}, Status: DONE, remove Protected: ${removeProtected}`);
    return;
  }

  logger.debug(`Removing item: ${item.correlationId}, created: ${item.creationTime}`);

  if (removeProtected) {
    await collection.deleteMany({correlationId: item.correlationId, protected: {$in: [true, false, null]}});
  } else {
    await collection.deleteMany({correlationId: item.correlationId, protected: {$nin: [true]}});
  }

  return removeItems(collection, {collection: name, removeProtected, date, useTestDates});
}

async function removeFileItems(collection: Collection<FileItem>, {collection: name, removeProtected, date, useTestDates}: ItemSearchParams): Promise<void> {
  const item = await collection.findOne(generateFileItemParams({date, useTestDates}));

  if (item === null) {
    logger.info(`Collection: ${name}, Status: DONE, remove Protected: ${removeProtected}`);
    return;
  }

  logger.debug(`Removing file item: ${item.filename}, created: ${item.uploadDate}`);
  await collection.deleteMany({filename: item.filename});

  return removeFileItems(collection, {collection: name, removeProtected, date, useTestDates});
}

function dateRange({date, useTestDates}: {date: string, useTestDates: boolean}): {
  readonly $gte: Date | string;
  readonly $lte: Date | string;
} {
  return {
    $gte: useTestDates ? SEARCH_FROM.toISOString() : SEARCH_FROM,
    $lte: useTestDates ? new Date(date).toISOString() : new Date(date)
  };
}

function generateItemParams({removeProtected, date, useTestDates}: Omit<ItemSearchParams, 'collection'>): Filter<CorrelatedItem> {
  if (removeProtected) {
    return {creationTime: dateRange({date, useTestDates})};
  }

  return {
    $and: [
      {creationTime: dateRange({date, useTestDates})},
      {protected: {$in: [null, false]}}
    ]
  };
}

function generateFileItemParams({date, useTestDates}: Pick<ItemSearchParams, 'date' | 'useTestDates'>): Filter<FileItem> {
  return {uploadDate: dateRange({date, useTestDates})};
}

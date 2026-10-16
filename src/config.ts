import {readEnvironmentVariable} from '@natlibfi/melinda-commons';
import {parseCollectionConfigs} from './collectionConfig.ts';

export const mongoUri: string = parseMongoUri(readEnvironmentVariable('MONGO_URI'));
export const mongoDatabaseAndCollections = parseCollectionConfigs(readEnvironmentVariable('MONGO_DATABASE_AND_COLLECTIONS'));

function parseMongoUri(raw: unknown): string {
  if (typeof raw !== 'string' || raw === '') {
    throw new Error('MONGO_URI must be a non-empty string');
  }

  return raw;
}

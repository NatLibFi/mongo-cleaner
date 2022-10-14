import {readEnvironmentVariable} from '@natlibfi/melinda-backend-commons';

export const removeDateLimit = readEnvironmentVariable('REMOVE_DATE_LIMIT');

export const mongoUri = readEnvironmentVariable('MONGO_URI');
export const mongoDatabaseAndCollections = readEnvironmentVariable('MONGO_DATABASE_AND_COLLECTIONS', {format: v => JSON.parse(v)});

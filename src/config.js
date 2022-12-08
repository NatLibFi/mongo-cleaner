import {readEnvironmentVariable} from '@natlibfi/melinda-backend-commons';

export const pollTime = readEnvironmentVariable('POLL_TIME', {defaultValue: 0, format: v => parseInt(v, 10)});
export const mongoUri = readEnvironmentVariable('MONGO_URI', {defaultValue: 'mongodb://localhost:27017'});
export const mongoDatabaseAndCollections = readEnvironmentVariable('MONGO_DATABASE_AND_COLLECTIONS', {format: v => JSON.parse(v)});

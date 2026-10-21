export interface CollectionConfig {
  readonly db: string;
  readonly collection: string;
  readonly removeDaysFromNow: number;
  readonly removeProtected: boolean;
  readonly file: boolean;
  readonly test: boolean;
}

export function parseCollectionConfigs(raw: unknown): CollectionConfig[] {
  let parsed: unknown = raw;

  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error('MONGO_DATABASE_AND_COLLECTIONS is not valid JSON');
    }
  }

  if (!Array.isArray(parsed)) {
    throw new Error('MONGO_DATABASE_AND_COLLECTIONS must be a JSON array');
  }

  return parsed.map((item, index) => parseCollectionConfig(item, index));
}

function parseCollectionConfig(raw: unknown, index: number): CollectionConfig {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error(`MONGO_DATABASE_AND_COLLECTIONS[${index}] must be an object`);
  }

  const value = raw as Record<string, unknown>;
  const {
    db,
    collection,
    removeDaysFromNow,
    removeProtected = false,
    file = false,
    test = false
  } = value;

  if (typeof db !== 'string') {
    throw new Error(`MONGO_DATABASE_AND_COLLECTIONS[${index}].db must be a string`);
  }

  if (typeof collection !== 'string') {
    throw new Error(`MONGO_DATABASE_AND_COLLECTIONS[${index}].collection must be a string`);
  }

  if (typeof removeDaysFromNow !== 'number' || !Number.isInteger(removeDaysFromNow)) {
    throw new Error(`MONGO_DATABASE_AND_COLLECTIONS[${index}].removeDaysFromNow must be an integer`);
  }

  if (typeof removeProtected !== 'boolean' || typeof file !== 'boolean' || typeof test !== 'boolean') {
    throw new Error(`MONGO_DATABASE_AND_COLLECTIONS[${index}].removeProtected, file and test must be booleans`);
  }

  return {db, collection, removeDaysFromNow, removeProtected, file, test};
}

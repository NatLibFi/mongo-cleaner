# mongo-cleaner

Mongo database cleaner. Removes all items from collection based on modificationTime time stamp (UTC)

**COMPATIBLE: MONGO 4.X**

**NOT COMPATIBLE: MONGO 3.X**

# Usage

## Envs:
* MONGO_URI='mongodb://localhost:43575'
* MONGO_DATABASE_AND_COLLECTIONS='[{"db": "", "collection": "collectionName", "softRemoveDays": 7, "forceRemoveDays": 30}]'
  * db: Database name, "" makes mongo to use default database.
  * collection: Database collection name.
  * removeProtected: Boolean variable for forcing removal of protected items. Defaults false.

## Debug envs:
* LOG_LEVEL='debug'
* MONGOMS_DEBUG=1

## License and copyright

Copyright (c) 2022 **University Of Helsinki (The National Library Of Finland)**

This project's source code is licensed under the terms of **MIT** or any later version.
# mongo-cleaner

Mongo database cleaner. Removes all items from collection based on modificationTime time stamp (UTC)

**COMPATIBLE: MONGO 4.X**

**NOT COMPATIBLE: MONGO 3.X**

# Usage

## Envs:
* POLL_TIME='0'
  * Defaults to '0'
  * Time period between cleanings in ms (3600000 = hour)
  * '0' = single run
* MONGO_URI='mongodb://localhost:27017'
  * Defaults to mongodb://localhost:27017
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
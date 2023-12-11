# mongo-cleaner

Mongo database cleaner. Removes all items from collection based on creationTime time stamp (UTC)

**COMPATIBLE: MONGO 4.X**

**NOT COMPATIBLE: MONGO 3.X**

# Usage

## Envs:
* MONGO_URI='mongodb://localhost:43575'
* MONGO_DATABASE_AND_COLLECTIONS='[{"db": "", "collection": "collectionName", "removeProtected": boolean, "file": boolean, ("test": boolean)}]'
  * db: Database name, "" makes mongo to use default database.
  * collection: Database collection name.
  * removeProtected: Boolean variable for forcing removal of protected items. Defaults false.
  * file: Boolean variable to determine file collection cleaning
  * test: Boolean variable to determine if test params are to be used on file search. Mongo-memory-server and real mongo wants different types of time variables.

## Debug envs:
* LOG_LEVEL='debug'
* MONGOMS_DEBUG=1

## License and copyright

Copyright (c) 2022 **University Of Helsinki (The National Library Of Finland)**

This project's source code is licensed under the terms of **MIT** or any later version.
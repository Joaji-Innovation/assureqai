
const { MongoClient } = require('mongodb');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const SOURCE_URI = process.env.MONGODB_URI;
const DEST_URI = process.env.NEW_MONGODB_URI;

if (!SOURCE_URI || !DEST_URI) {
  console.error('Error: MONGODB_URI or NEW_MONGODB_URI environment variables are missing.');
  process.exit(1);
}

async function migrate() {
  let sourceClient = null;
  let destClient = null;

  try {
    console.log(`Connecting to Source DB (assureqai)...`);
    sourceClient = new MongoClient(SOURCE_URI);
    await sourceClient.connect();
    const sourceDb = sourceClient.db('assureqai');
    console.log(`Connected to Source DB: ${sourceDb.databaseName}`);

    console.log(`Connecting to Destination DB (main)...`);
    destClient = new MongoClient(DEST_URI);
    await destClient.connect();
    const destDb = destClient.db('main');
    console.log(`Connected to Destination DB: ${destDb.databaseName}`);

    // Get list of collections
    const collections = await sourceDb.listCollections().toArray();

    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;

      // Skip system collections
      if (collectionName.startsWith('system.')) continue;

      console.log(`\nMigrating collection: ${collectionName}...`);

      const sourceCollection = sourceDb.collection(collectionName);
      const destCollection = destDb.collection(collectionName);

      const documents = await sourceCollection.find({}).toArray();

      if (documents.length === 0) {
        console.log(`  - Skipping (0 documents)`);
        continue;
      }

      console.log(`  - Found ${documents.length} documents. Inserting...`);

      try {
        // Use insertMany with ordered: false to continue if duplicates exist
        const result = await destCollection.insertMany(documents, { ordered: false });
        console.log(`  - Successfully inserted ${result.insertedCount} documents.`);
      } catch (e) {
        if (e.code === 11000) { // Duplicate key error
          console.warn(`  - Some duplicates found and skipped. Inserted: ${e.result?.nInserted || 0}`);
        } else {
          console.error(`  - Error inserting documents for ${collectionName}:`, e.message);
        }
      }
    }

    console.log('\nMigration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    if (sourceClient) await sourceClient.close();
    if (destClient) await destClient.close();
  }
}

migrate();

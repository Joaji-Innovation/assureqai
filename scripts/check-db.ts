/**
 * Database diagnostic script
 * Run with: npx ts-node scripts/check-db.ts
 */
import mongoose from 'mongoose';

async function checkDatabase() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/assureqai';

  console.log('🔍 Connecting to MongoDB...');
  console.log(`   URI: ${mongoUri.replace(/:[^:@]+@/, ':***@')}`); // Hide password

  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected successfully\n');

    const db = mongoose.connection.db;

    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('📊 Collections found:');
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`   - ${col.name}: ${count} documents`);
    }

    // Check callaudits specifically
    console.log('\n📋 Checking callaudits collection:');
    const auditsCollection = db.collection('callaudits');
    const auditCount = await auditsCollection.countDocuments();
    console.log(`   Total audits: ${auditCount}`);

    if (auditCount > 0) {
      const latestAudit = await auditsCollection.findOne({}, { sort: { createdAt: -1 } });
      console.log('\n   Latest audit:');
      console.log(`   - ID: ${latestAudit?._id}`);
      console.log(`   - CallId: ${latestAudit?.callId}`);
      console.log(`   - Agent: ${latestAudit?.agentName}`);
      console.log(`   - Score: ${latestAudit?.overallScore}`);
      console.log(`   - Created: ${latestAudit?.createdAt}`);
      console.log(`   - Type: ${latestAudit?.auditType}`);
    } else {
      console.log('   ⚠️  No audits found in database!');
    }

    // Check users
    console.log('\n👤 Checking users collection:');
    const usersCount = await db.collection('users').countDocuments();
    console.log(`   Total users: ${usersCount}`);

    // Check qa parameters
    console.log('\n📝 Checking qaparameters collection:');
    const qaParamsCount = await db.collection('qaparameters').countDocuments();
    console.log(`   Total QA parameters: ${qaParamsCount}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkDatabase();

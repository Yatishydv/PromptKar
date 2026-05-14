const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function wipePrompts() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) throw new Error('MONGODB_URI is not defined');

    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const result = await db.collection('prompts').deleteMany({});
    
    console.log(`Successfully deleted ${result.deletedCount} prompts.`);
    
    process.exit(0);
  } catch (err) {
    console.error('Wipe error:', err);
    process.exit(1);
  }
}

wipePrompts();

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    });
  }
}

async function cleanup() {
  loadEnv();
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const UserSchema = new mongoose.Schema({
      firebaseUid: String,
      username: String,
      email: String
    });

    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    // 1. Delete broken null UID records
    const deleted = await User.deleteMany({ firebaseUid: null });
    console.log(`Deleted ${deleted.deletedCount} broken records (null UID)`);

    // 2. Ensure remaining users have unique usernames (fallback if duplicates remain)
    const users = await User.find({}).sort({ createdAt: 1 });
    const seen = new Set();
    
    for (const user of users) {
      if (seen.has(user.username)) {
        const newUsername = `${user.username}_${Math.random().toString(36).substring(2, 5)}`;
        console.log(`Duplicate handle found for ${user.firebaseUid}. Renaming "${user.username}" to "${newUsername}"`);
        user.username = newUsername;
        await user.save();
      }
      seen.add(user.username);
    }

    console.log('Cleanup complete');
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

cleanup();

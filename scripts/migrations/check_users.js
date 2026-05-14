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

async function checkUsers() {
  loadEnv();
  try {
    if (!process.env.MONGODB_URI) {
        console.error("MONGODB_URI not found in .env.local");
        return;
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const UserSchema = new mongoose.Schema({
      firebaseUid: String,
      username: String,
      email: String
    });

    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    const users = await User.find({}).lean();
    console.log('Total Users:', users.length);
    users.forEach(u => {
      console.log(`- UID: ${u.firebaseUid} | Username: ${u.username} | Email: ${u.email}`);
    });

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

checkUsers();

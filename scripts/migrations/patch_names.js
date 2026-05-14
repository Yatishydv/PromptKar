const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const content = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
  content.split('\n').forEach(line => {
    const idx = line.indexOf('=');
    if (idx > 0) process.env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  });
}

async function patchNames() {
  loadEnv();
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected');

  const col = mongoose.connection.db.collection('users');
  const users = await col.find({}).toArray();

  for (const u of users) {
    if (!u.name) {
      const name = u.username || u.email?.split('@')[0] || 'User';
      await col.updateOne({ _id: u._id }, { $set: { name } });
      console.log(`Patched: ${u.firebaseUid} → name = "${name}"`);
    } else {
      console.log(`OK: ${u.firebaseUid} → name = "${u.name}"`);
    }
  }

  await mongoose.disconnect();
  console.log('Done');
}

patchNames().catch(console.error);

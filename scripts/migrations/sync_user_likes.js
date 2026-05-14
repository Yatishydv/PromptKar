const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

// Define Minimal Schemas
const UserSchema = new mongoose.Schema({
  firebaseUid: String,
  totalLikes: { type: Number, default: 0 }
}, { collection: 'users' });

const PromptSchema = new mongoose.Schema({
  authorId: String,
  likes: { type: Number, default: 0 }
}, { collection: 'prompts' });

async function syncLikes() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected!");

    const User = mongoose.models.User || mongoose.model('User', UserSchema);
    const Prompt = mongoose.models.Prompt || mongoose.model('Prompt', PromptSchema);

    const users = await User.find({});
    console.log(`Found ${users.length} users. Recalculating likes...`);

    for (const user of users) {
      const userPrompts = await Prompt.find({ authorId: user.firebaseUid });
      const totalLikes = userPrompts.reduce((acc, p) => acc + (p.likes || 0), 0);
      
      if (user.totalLikes !== totalLikes) {
        console.log(`Updating @${user.firebaseUid}: ${user.totalLikes} -> ${totalLikes}`);
        await User.updateOne({ _id: user._id }, { $set: { totalLikes } });
      }
    }

    console.log("Sync complete!");
    process.exit(0);
  } catch (err) {
    console.error("Error during sync:", err);
    process.exit(1);
  }
}

syncLikes();

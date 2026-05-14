const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const InteractionSchema = new mongoose.Schema({
  userId: String,
  blogSlug: String,
  type: String,
}, { timestamps: true });

const CommentSchema = new mongoose.Schema({
  blogSlug: String,
  userId: String,
  userName: String,
  content: String,
}, { timestamps: true });

async function checkData() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to DB");

  const Interaction = mongoose.models.Interaction || mongoose.model("Interaction", InteractionSchema);
  const Comment = mongoose.models.Comment || mongoose.model("Comment", CommentSchema);

  const interactions = await Interaction.find({});
  console.log("\n--- ALL INTERACTIONS ---");
  console.log(interactions);

  const comments = await Comment.find({});
  console.log("\n--- ALL COMMENTS ---");
  console.log(comments);

  const users = await mongoose.connection.db.collection('users').find({}).toArray();
  console.log("\n--- ALL USERS (First 5) ---");
  console.log(users.slice(0, 5));

  await mongoose.disconnect();
}

checkData();

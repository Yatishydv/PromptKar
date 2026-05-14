const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/promptkar').then(async () => {
  const db = mongoose.connection.db;
  const count = await db.collection('prompts').countDocuments();
  console.log('Total Prompts in MongoDB:', count);
  process.exit(0);
});

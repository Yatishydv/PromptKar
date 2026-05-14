const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/promptkar').then(async () => {
  const db = mongoose.connection.db;
  await db.collection('prompts').deleteMany({});
  console.log('MongoDB Prompts Cleared!');
  process.exit(0);
});

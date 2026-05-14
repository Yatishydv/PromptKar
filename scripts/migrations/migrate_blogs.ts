import mongoose from 'mongoose';
import dbConnect from './src/lib/mongodb';
import Blog from './src/models/Blog';

async function migrate() {
  await dbConnect();
  const result = await Blog.updateMany(
    { coverHeight: { $exists: false } },
    { $set: { coverHeight: 400 } }
  );
  console.log(`MIGRATED ${result.modifiedCount} BLOGS`);
  process.exit(0);
}

migrate();

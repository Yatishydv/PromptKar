import mongoose from 'mongoose';
import dbConnect from './src/lib/mongodb';
import Blog from './src/models/Blog';

async function checkBlog() {
  await dbConnect();
  const latest = await Blog.findOne().sort({ updatedAt: -1 });
  console.log('LATEST BLOG UPDATE:');
  console.log('Title:', latest?.title);
  console.log('CoverImage:', latest?.coverImage);
  console.log('CoverHeight:', latest?.coverHeight);
  console.log('UpdatedAt:', latest?.updatedAt);
  process.exit(0);
}

checkBlog();

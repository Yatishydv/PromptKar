const mongoose = require('mongoose');
const dbConnect = require('./src/lib/mongodb').default;
const User = require('./src/models/User').default;

async function checkAdminFollowers() {
  await dbConnect();
  const admin = await User.findOne({ username: 'Yatishydv' });
  if (admin) {
    console.log('Admin Followers:', admin.followers);
    console.log('Admin Following:', admin.following);
  } else {
    console.log('Admin not found');
  }
  process.exit();
}

checkAdminFollowers();

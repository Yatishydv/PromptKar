const mongoose = require('mongoose');

const BlogSchema = new mongoose.Schema({
    coverHeight: { type: Number, default: 400 }
}, { strict: false });

const MONGODB_URI = "mongodb://127.0.0.1:27017/promptkar";

async function migrate() {
    try {
        await mongoose.connect(MONGODB_URI);
        const Blog = mongoose.model('Blog', BlogSchema, 'blogs');
        const result = await Blog.updateMany(
            { coverHeight: { $exists: false } },
            { $set: { coverHeight: 400 } }
        );
        console.log(`MIGRATED ${result.modifiedCount} BLOGS`);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

migrate();

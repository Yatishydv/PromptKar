const mongoose = require('mongoose');

const BlogSchema = new mongoose.Schema({
    content: { type: String, required: true }
}, { strict: false });

const MONGODB_URI = "mongodb://127.0.0.1:27017/promptkar";

function mdToHtml(md) {
    if (!md) return "";
    // Check if it's already HTML
    if (md.includes('<p>') || md.includes('<h2>')) return md;

    return md
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/\*\*(.*)\*\*/gim, '<b>$1</b>')
        .replace(/\*(.*)\*/gim, '<i>$1</i>')
        .replace(/!\[(.*?)\]\((.*?)\)/gim, '<img src="$2" alt="$1" style="max-width:100%; border-radius:1rem; margin:1rem 0;" />')
        .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" style="color:#4f46e5; text-decoration:underline;">$1</a>')
        .split('\n')
        .map(line => {
            if (!line.trim()) return '<br/>';
            if (line.startsWith('<')) return line;
            return `<p>${line}</p>`;
        })
        .join('\n');
}

async function migrate() {
    try {
        await mongoose.connect(MONGODB_URI);
        const Blog = mongoose.model('Blog', BlogSchema, 'blogs');
        const blogs = await Blog.find({});
        console.log(`Checking ${blogs.length} blogs...`);

        let count = 0;
        for (const blog of blogs) {
            // If it doesn't look like HTML, convert it
            if (!blog.content.includes('<p>') && !blog.content.includes('<h2>')) {
                const html = mdToHtml(blog.content);
                await Blog.updateOne({ _id: blog._id }, { $set: { content: html } });
                count++;
            }
        }
        console.log(`CONVERTED ${count} BLOGS TO HTML`);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

migrate();

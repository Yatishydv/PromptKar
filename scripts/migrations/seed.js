const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/promptkar').then(async () => {
  const db = mongoose.connection.db;
  
  const prompts = [
    {
      "title": "Master UX Writing",
      "content": "Act as a senior UX Writer. Review the following app flow and rewrite all error messages to be concise, human-centric, and constructive. [Insert Flow]",
      "description": "Improve your app's user experience with better copy.",
      "category": "Design",
      "tags": ["ux", "copywriting", "design"],
      "authorId": "user1",
      "authorName": "Alex Design",
      "likes": 120,
      "views": 450,
      "bookmarks": 34,
      "likedBy": [],
      "savedBy": [],
      "toolIcon": "https://upload.wikimedia.org/wikipedia/commons/3/33/Figma-logo.svg",
      "slug": "master-ux-writing",
      "level": "Intermediate",
      "createdAt": new Date(),
      "updatedAt": new Date()
    },
    {
      "title": "SEO Blog Outline Generator",
      "content": "Act as an SEO expert. Generate a comprehensive, 2000-word blog post outline on [Topic]. Include H2/H3 tags, target keywords, and user intent.",
      "description": "Generate high-ranking blog outlines in seconds.",
      "category": "Marketing",
      "tags": ["seo", "blogging", "marketing"],
      "authorId": "user2",
      "authorName": "Sarah Marketer",
      "likes": 89,
      "views": 320,
      "bookmarks": 45,
      "likedBy": [],
      "savedBy": [],
      "toolIcon": "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg",
      "slug": "seo-blog-outline",
      "level": "Beginner",
      "createdAt": new Date(),
      "updatedAt": new Date()
    },
    {
      "title": "Cinematic Midjourney Portrait",
      "content": "A cinematic portrait of a cyberpunk hacker in a neon-lit alleyway, 8k resolution, highly detailed, dramatic lighting, shot on 35mm lens, photorealistic --ar 16:9 --v 6.0",
      "description": "Create stunning, photorealistic character portraits.",
      "category": "Midjourney",
      "tags": ["art", "cyberpunk", "portrait"],
      "authorId": "user3",
      "authorName": "Cyber Artist",
      "likes": 250,
      "views": 890,
      "bookmarks": 110,
      "likedBy": [],
      "savedBy": [],
      "toolIcon": "https://upload.wikimedia.org/wikipedia/commons/e/e6/Midjourney_Emblem.png",
      "slug": "cinematic-cyberpunk-portrait",
      "level": "Advanced",
      "createdAt": new Date(),
      "updatedAt": new Date()
    }
  ];

  await db.collection('prompts').insertMany(prompts);
  console.log('Seeded 3 new prompts!');
  process.exit(0);
});

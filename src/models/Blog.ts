import mongoose, { Schema, Document } from "mongoose";
import { IBlog as IBlogBase } from "../types/blog";

export interface IBlog extends Omit<IBlogBase, "_id" | "createdAt" | "updatedAt">, Document {}

const BlogSchema: Schema = new Schema(
  {
    title:        { type: String, required: true },
    slug:         { type: String, required: true, unique: true, index: true },
    excerpt:      { type: String, required: true },
    content:      { type: String, required: true },
    category:     { type: String, required: true },
    tags:         [{ type: String }],
    author:       { type: String, default: "PromptKar Team" },
    authorAvatar: { type: String, default: "" },
    authorBio:    { type: String, default: "" },
    coverImage:   { type: String, default: "" },
    coverHeight:  { type: Number, default: 400 },
    featured:     { type: Boolean, default: false },
    published:    { type: Boolean, default: true },
    readTime:     { type: String, default: "5 min read" },
    views:        { type: Number, default: 0 },
    likes:        { type: Number, default: 0 },
    bloggerId:    { type: String, unique: true, sparse: true, index: true },
  },
  { timestamps: true }
);

// Force clear model in development to ensure schema updates are recognized
if (process.env.NODE_ENV === "development" && mongoose.models.Blog) {
  delete (mongoose.models as Record<string, any>).Blog;
}

export default mongoose.models.Blog || mongoose.model<IBlog>("Blog", BlogSchema);

import mongoose, { Schema, Document } from "mongoose";
import { IPrompt as IPromptBase } from "../types/prompt";

export interface IPrompt extends Omit<IPromptBase, "_id" | "createdAt" | "updatedAt">, Document {}

const PromptSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true, index: true },
    tags: [{ type: String }],
    authorId: { type: String, required: true, index: true },
    authorName: { type: String, required: true },
    authorAvatar: { type: String },
    likes: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    bookmarks: { type: Number, default: 0 },
    likedBy: [{ type: String }],
    savedBy: [{ type: String }],
    toolIcon: { type: String },
    slug: { type: String, required: true, unique: true },
    level: { type: String, default: "Standard" },
    history: [{
      content: { type: String, required: true },
      updatedAt: { type: Date, default: Date.now }
    }],
  },
  { timestamps: true }
);

// Force re-registration of the model to ensure schema updates (like 'history') are picked up
if (mongoose.models.Prompt) {
  delete mongoose.models.Prompt;
}

export default mongoose.model<IPrompt>("Prompt", PromptSchema);

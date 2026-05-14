import mongoose, { Schema, Document } from "mongoose";
import { IUser as IUserBase } from "../types/user";

export interface IUser extends Omit<IUserBase, "_id" | "createdAt" | "updatedAt">, Document {}

const UserSchema: Schema = new Schema(
  {
    firebaseUid: { type: String, required: true, unique: true },
    name: { type: String, default: "" },
    email: { type: String },
    username: { type: String, required: true, index: true },
    avatar: { type: String },
    bio: { type: String },
    totalLikes: { type: Number, default: 0 },
    savedPrompts: [{ type: String }],
    followers: [{ type: String }],
    following: [{ type: String }],
    banner: { type: String, default: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop" },
    location: { type: String, default: "Digital Space" },
    socialLinks: {
      website: { type: String, default: "" },
      twitter: { type: String, default: "" },
      github: { type: String, default: "" },
      instagram: { type: String, default: "" },
    },
    currentStreak: { type: Number, default: 0 },
    lastActiveAt: { type: Date, default: Date.now },
    activityDates: [{ type: String }], // Format: YYYY-MM-DD
    isPro: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },
    role: { type: String, default: "member" },
    customBadge: { type: String, default: "" },
    customTitle: { type: String, default: "" },
    selectedTheme: { type: String, default: "Standard" },
    featuredPromptId: { type: String, default: "" },
    isVerifiedActive: { type: Boolean, default: false },
    isGlowActive: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

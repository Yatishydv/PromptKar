import { Schema, model, models } from "mongoose";

const CommentSchema = new Schema({
  blogSlug: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userAvatar: { type: String },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Comment = models.Comment || model("Comment", CommentSchema);
export default Comment;

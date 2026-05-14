import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  recipientId: string; // Firebase UID of the user receiving the notification
  senderId: string;    // Firebase UID of the user who performed the action
  senderName: string;
  senderUsername: string;
  senderAvatar: string;
  type: 'like' | 'save' | 'comment' | 'follow';
  targetId: string;    // ID or Slug of the prompt/blog/user
  targetTitle?: string;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    recipientId: { type: String, required: true, index: true },
    senderId: { type: String, required: true },
    senderName: { type: String, required: true },
    senderUsername: { type: String, required: true },
    senderAvatar: { type: String },
    type: { type: String, enum: ['like', 'save', 'comment', 'follow'], required: true },
    targetId: { type: String, required: true },
    targetTitle: { type: String },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Notification || mongoose.model<INotification>("Notification", NotificationSchema);

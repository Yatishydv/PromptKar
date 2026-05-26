import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  recipientId: string; // Firebase UID of the user receiving the notification
  senderId: string;    // Firebase UID of the user who performed the action (or 'system')
  senderName: string;
  senderUsername: string;
  senderAvatar: string;
  type: 'like' | 'save' | 'comment' | 'follow' | 'admin_message' | 'system' | 'milestone';
  targetId: string;    // ID or Slug of the prompt/blog/user (or custom target)
  targetTitle?: string;
  message?: string;    // Custom message body
  linkType?: 'url' | 'modal' | 'profile' | 'prompt' | 'none'; // How to handle taps
  linkTarget?: string; // The destination (URL, username, slug, modal ID)
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
    type: { type: String, enum: ['like', 'save', 'comment', 'follow', 'admin_message', 'system', 'milestone'], required: true },
    targetId: { type: String, required: true },
    targetTitle: { type: String },
    message: { type: String },
    linkType: { type: String, enum: ['url', 'modal', 'profile', 'prompt', 'none'] },
    linkTarget: { type: String },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Force Mongoose to rebuild the model to pick up the new enum values in development mode
if (mongoose.models.Notification) {
  delete mongoose.models.Notification;
}

export default mongoose.model<INotification>("Notification", NotificationSchema);

import mongoose from "mongoose";

const PendingActionSchema = new mongoose.Schema({
  actionType: {
    type: String,
    required: true,
    enum: [
      'DELETE_PROMPT',
      'DELETE_BLOG',
      'UPDATE_USER_ROLE',
      'UPDATE_SETTINGS',
      'RESET_STREAKS',
      'RESET_AVATARS',
      'RECALCULATE_LIKES',
      'SYNC_BLOGGER'
    ]
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  requestedBy: {
    type: String, // Firebase UID of the sub-admin
    required: true
  },
  requestedByName: {
    type: String
  },
  requestedByEmail: {
    type: String
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.PendingAction || mongoose.model("PendingAction", PendingActionSchema);

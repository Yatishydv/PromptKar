import { Schema, model, models } from "mongoose";

const InteractionSchema = new Schema({
  userId: { type: String, required: true, index: true },
  blogSlug: { type: String, required: true, index: true },
  type: { 
    type: String, 
    enum: ['like', 'save'], 
    required: true 
  },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Ensure a user can only have one interaction of a specific type per blog
InteractionSchema.index({ userId: 1, blogSlug: 1, type: 1 }, { unique: true });

const Interaction = models.Interaction || model("Interaction", InteractionSchema);
export default Interaction;

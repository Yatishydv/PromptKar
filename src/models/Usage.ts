import mongoose, { Schema, Document } from "mongoose";

export interface IUsage extends Document {
  identifier: string; // userId or IP
  type: string; // 'enhance'
  count: number;
  date: string; // YYYY-MM-DD
}

const UsageSchema: Schema = new Schema({
  identifier: { type: String, required: true, index: true },
  type: { type: String, required: true },
  count: { type: Number, default: 0 },
  date: { type: String, required: true, index: true },
});

export default mongoose.models.Usage || mongoose.model<IUsage>("Usage", UsageSchema);

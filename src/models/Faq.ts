import mongoose, { Document, Schema } from 'mongoose';

export interface IFaq extends Document {
  question: string;
  answer: string;
  category: string;
  iconName: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const faqSchema = new Schema<IFaq>(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    category: { type: String, required: true },
    iconName: { type: String, default: 'help-circle' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// This ensures that when the Next.js dev server hot-reloads, it doesn't crash 
// by trying to redefine the Mongoose model.
export default mongoose.models.Faq || mongoose.model<IFaq>('Faq', faqSchema);

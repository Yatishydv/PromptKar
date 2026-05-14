import mongoose, { Schema, Document } from "mongoose";

export interface ISettings extends Document {
  maintenanceMode: boolean;
  announcementsEnabled: boolean;
  announcements: Array<{
    text: string;
    enabled: boolean;
  }>;
  announcementCloseable: boolean;
  updatedAt: Date;
}

const SettingsSchema: Schema = new Schema(
  {
    maintenanceMode: { type: Boolean, default: false },
    announcementsEnabled: { type: Boolean, default: true },
    announcements: [
      {
        text: { type: String, default: "" },
        enabled: { type: Boolean, default: true },
      }
    ],
    announcementCloseable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.SiteSettings || mongoose.model<ISettings>("SiteSettings", SettingsSchema);

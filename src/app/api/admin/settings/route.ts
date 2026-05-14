import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Settings from "@/models/Settings";

export async function GET() {
  try {
    await dbConnect();
    
    // Ensure we only ever have ONE settings document to prevent sync issues
    const count = await Settings.countDocuments();
    if (count > 1) {
      console.log("Cleaning up redundant settings documents...");
      const latest = await Settings.findOne().sort({ updatedAt: -1 });
      await Settings.deleteMany({ _id: { $ne: latest._id } });
    }

    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({
        maintenanceMode: false,
        announcementsEnabled: true,
        announcements: [],
        announcementCloseable: true
      });
    }
    
    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    
    // Find the current active settings document
    const settings = await Settings.findOne();
    
    const updatedSettings = await Settings.findOneAndUpdate(
      settings ? { _id: settings._id } : {}, 
      { $set: body },
      { upsert: true, new: true, runValidators: true }
    );
    
    return NextResponse.json(updatedSettings);
  } catch (error: any) {
    console.error("Settings Update Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

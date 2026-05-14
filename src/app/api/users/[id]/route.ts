import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    console.log(`[API] Resolving user identity for ID: "${id}"`);

    // Try finding by Firebase UID first, then by username
    let user = await User.findOne({ firebaseUid: id }).lean();
    
    if (!user) {
      console.log(`[API] UID lookup failed for "${id}", trying username...`);
      user = await User.findOne({ username: id }).lean();
    }
    
    if (!user) {
      console.log(`[API] Identity resolution failed for "${id}"`);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log(`[API] Resolved identity: ${user.username} (${user.firebaseUid})`);
    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    // Safety: Prevent sensitive fields from being accidentally overwritten
    const { firebaseUid, ...updateData } = body;
    const allowedUpdates: any = { ...updateData };
    if (updateData.username) {
      let username = updateData.username;
      
      // Check if username is already taken by ANOTHER user (case-insensitive)
      const existingUser = await User.findOne({ 
        username: { $regex: new RegExp(`^${username}$`, 'i') },
        firebaseUid: { $ne: id } 
      });

      if (existingUser) {
        // If the user is NEW (upserting), we should try to make it unique
        const userExists = await User.exists({ firebaseUid: id });
        
        if (!userExists) {
          username = `${username}_${Math.random().toString(36).substring(2, 6)}`;
        } else {
          return NextResponse.json({ 
            error: "This handle is already claimed by another engineer. Please choose a different identity." 
          }, { status: 400 });
        }
      }
      allowedUpdates.username = username;
    }
    if (updateData.bio !== undefined) allowedUpdates.bio = updateData.bio;
    if (updateData.avatar !== undefined) allowedUpdates.avatar = updateData.avatar;
    if (updateData.name !== undefined) allowedUpdates.name = updateData.name;
    if (updateData.totalLikes !== undefined) allowedUpdates.totalLikes = updateData.totalLikes;
    if (updateData.savedPrompts) allowedUpdates.savedPrompts = updateData.savedPrompts;
    if (updateData.followers) allowedUpdates.followers = updateData.followers;
    if (updateData.following) allowedUpdates.following = updateData.following;
    if (updateData.banner) allowedUpdates.banner = updateData.banner;
    if (updateData.location) allowedUpdates.location = updateData.location;
    if (updateData.socialLinks) allowedUpdates.socialLinks = updateData.socialLinks;
    if (updateData.isAdmin !== undefined) allowedUpdates.isAdmin = updateData.isAdmin;
    if (updateData.isPro !== undefined) allowedUpdates.isPro = updateData.isPro;
    if (updateData.role !== undefined) allowedUpdates.role = updateData.role;
    if (updateData.customBadge !== undefined) allowedUpdates.customBadge = updateData.customBadge;
    if (updateData.customTitle !== undefined) allowedUpdates.customTitle = updateData.customTitle;

    const user = await User.findOneAndUpdate(
      { firebaseUid: id },
      { $set: allowedUpdates },
      { returnDocument: 'after', upsert: true, runValidators: true }
    );

    return NextResponse.json(user);
  } catch (error: any) {
    console.error("User Update Error:", error);
    
    // Handle duplicate key error (e.g. username already taken)
    if (error.code === 11000) {
      return NextResponse.json({ 
        error: "This handle is already claimed by another engineer. Please choose a different identity." 
      }, { status: 400 });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    // 1. Delete user's prompts
    const Prompt = (await import("@/models/Prompt")).default;
    await Prompt.deleteMany({ authorId: id });

    // 2. Delete user
    const user = await User.findOneAndDelete({ firebaseUid: id });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "User and all associated data deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import PendingAction from "@/models/PendingAction";
import Settings from "@/models/Settings";
import User from "@/models/User";

// GET all pending approvals
export async function GET(request: Request) {
  try {
    await dbConnect();
    // In a real app we'd verify the token is from Head Admin
    const actions = await PendingAction.find({ status: 'PENDING' }).sort({ createdAt: -1 });
    return NextResponse.json(actions);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST to Approve or Reject
export async function POST(request: Request) {
  try {
    await dbConnect();
    const { actionId, decision, headAdminEmail } = await request.json();

    if (headAdminEmail !== "yatishydv@gmail.com") {
      return NextResponse.json({ error: "Unauthorized. Only Head Admin can approve." }, { status: 403 });
    }

    const action = await PendingAction.findById(actionId);
    if (!action) {
      return NextResponse.json({ error: "Action not found" }, { status: 404 });
    }

    if (decision === 'REJECTED') {
      await PendingAction.findByIdAndDelete(actionId);
      return NextResponse.json({ message: "Action rejected and removed from database." });
    }

    if (decision === 'APPROVED') {
      // Execute the action based on actionType
      switch (action.actionType) {
        case 'UPDATE_SETTINGS':
          const settings = await Settings.findOne();
          await Settings.findOneAndUpdate(
            settings ? { _id: settings._id } : {},
            { $set: action.payload },
            { upsert: true, new: true }
          );
          break;
        case 'UPDATE_USER_ROLE':
          await User.findOneAndUpdate(
            { firebaseUid: action.payload.userId },
            { $set: action.payload.updates }
          );
          break;
        case 'DELETE_PROMPT':
          const Prompt = (await import("@/models/Prompt")).default;
          await Prompt.findOneAndDelete({ slug: action.payload.slug });
          break;
        case 'DELETE_BLOG':
          const Blog = (await import("@/models/Blog")).default;
          await Blog.findOneAndDelete({ slug: action.payload.slug });
          break;
        case 'RESET_STREAKS':
          if (action.payload.resetAll) {
             await User.updateMany({}, { $set: { currentStreak: 0, lastActivityDate: null } });
          } else {
             await User.findOneAndUpdate({ firebaseUid: action.payload.userId }, { $set: { currentStreak: 0, lastActivityDate: null } });
          }
          break;
        // Other cases can be handled here...
      }

      await PendingAction.findByIdAndDelete(actionId);
      return NextResponse.json({ message: "Action approved and executed (record removed)." });
    }

    return NextResponse.json({ error: "Invalid decision" }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

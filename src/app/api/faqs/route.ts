import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Faq from "@/models/Faq";

export async function GET() {
  try {
    await dbConnect();
    const faqs = await Faq.find({}).sort({ order: 1, createdAt: 1 }).lean();
    return NextResponse.json(faqs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    
    const requesterEmail = request.headers.get("x-requester-email");
    if (requesterEmail !== "yatishydv@gmail.com") {
      return NextResponse.json({ error: "Only Head Admin can add FAQs." }, { status: 403 });
    }

    const { question, answer, category, iconName } = await request.json();

    if (!question || !answer || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newFaq = await Faq.create({ question, answer, category, iconName });
    
    return NextResponse.json({ message: "FAQ added successfully", faq: newFaq }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

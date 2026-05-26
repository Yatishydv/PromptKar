import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Faq from "@/models/Faq";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    
    const requesterEmail = request.headers.get("x-requester-email");
    if (requesterEmail !== "yatishydv@gmail.com") {
      return NextResponse.json({ error: "Only Head Admin can edit FAQs." }, { status: 403 });
    }

    const { question, answer, category, iconName } = await request.json();

    if (!question || !answer || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const updatedFaq = await Faq.findByIdAndUpdate(
      params.id,
      { question, answer, category, iconName },
      { new: true }
    );
    
    if (!updatedFaq) {
        return NextResponse.json({ error: "FAQ not found" }, { status: 404 });
    }
    
    return NextResponse.json({ message: "FAQ updated successfully", faq: updatedFaq });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
      await dbConnect();
      
      const requesterEmail = request.headers.get("x-requester-email");
      if (requesterEmail !== "yatishydv@gmail.com") {
        return NextResponse.json({ error: "Only Head Admin can delete FAQs." }, { status: 403 });
      }
  
      const deletedFaq = await Faq.findByIdAndDelete(params.id);
      
      if (!deletedFaq) {
          return NextResponse.json({ error: "FAQ not found" }, { status: 404 });
      }
      
      return NextResponse.json({ message: "FAQ deleted successfully" });
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

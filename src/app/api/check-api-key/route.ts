import { checkAIAvailability } from "@/app/actions";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const hasApiKey = await checkAIAvailability();
    return NextResponse.json({ hasApiKey });
  } catch (error) {
    console.error("Error checking API key availability:", error);
    return NextResponse.json({ hasApiKey: false, error: "Failed to check API key" }, { status: 500 });
  }
}
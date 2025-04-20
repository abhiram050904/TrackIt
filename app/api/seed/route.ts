import { seedTransactions } from "@/actions/seed";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await seedTransactions();
    return NextResponse.json(result, { status: result.success ? 200 : 500, });
  } catch (error) {
    console.error("Unhandled error in /api/seed:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDb } from "@/lib/db";
import { ProgramTemplate } from "@/lib/models/ProgramTemplate";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const week = Number(searchParams.get("week"));
  const day = searchParams.get("day");

  if (!week || !day) {
    return NextResponse.json({ error: "week and day are required." }, { status: 400 });
  }

  await connectDb();
  const exercises = await ProgramTemplate.find({ weekNumber: week, dayKey: day })
    .sort({ _id: 1 })
    .lean();

  return NextResponse.json({ exercises });
}

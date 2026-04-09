import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDb } from "@/lib/db";
import { User } from "@/lib/models/User";

const SignupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = SignupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
    }

    await connectDb();
    const existing = await User.findOne({ email: parsed.data.email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: "Email is already registered." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    await User.create({
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      passwordHash,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Signup failed." }, { status: 500 });
  }
}

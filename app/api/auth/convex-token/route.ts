import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth/auth0";

export async function GET() {
  const session = await auth0.getSession();
  const token = session?.tokenSet.idToken;

  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  return NextResponse.json({ token });
}

import { NextResponse } from "next/server";

export async function POST() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost";
  const response = NextResponse.redirect(new URL("/admin/login", baseUrl));
  response.cookies.delete("admin");
  return response;
}

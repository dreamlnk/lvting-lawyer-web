import { NextRequest, NextResponse } from "next/server";

function getBaseUrl(req: NextRequest): string {
  const forwardedHost = req.headers.get("x-forwarded-host");
  const forwardedProto = req.headers.get("x-forwarded-proto");
  if (forwardedHost) {
    return `${forwardedProto || "https"}://${forwardedHost}`;
  }
  return req.nextUrl.origin;
}

export async function POST(req: NextRequest) {
  const response = NextResponse.redirect(new URL("/admin/login", getBaseUrl(req)), 303);
  response.cookies.delete("admin");
  response.cookies.delete("user_info");
  return response;
}

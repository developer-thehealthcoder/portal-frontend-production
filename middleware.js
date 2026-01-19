import { NextResponse } from "next/server";

export const config = {
  matcher: ["/", "/login"],
};

export default function middleware(req) {
  const token = req.cookies.get("accessToken")?.value;
  const { pathname } = req.nextUrl;

  // If no token and not on login page, redirect to login
  if (!token && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // If token exists and user is trying to view /login, send to home
  if (token && pathname === "/login") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Allow the request to proceed
  return NextResponse.next();
}

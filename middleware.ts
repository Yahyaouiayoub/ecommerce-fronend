import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const AUTH_PAGES = ["/login", "/register"]
const COOKIE_NAME = "auth_token"

export function middleware(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value
  const { pathname } = request.nextUrl

  // Already logged in → redirect away from auth pages
  if (token && AUTH_PAGES.includes(pathname)) {
    // We can't check the role in middleware without decoding the JWT,
    // so redirect to profile — the profile page handles admin redirect
    return NextResponse.redirect(new URL("/profile", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/login", "/register"],
}

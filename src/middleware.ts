import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const userId = request.cookies.get("userId")?.value;
  const userRole = request.cookies.get("userRole")?.value;

  const { pathname } = request.nextUrl;

  // Rotas de Admin
  if (pathname.startsWith("/admin")) {
    if (!userId) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Rotas de Médico
  if (pathname.startsWith("/medico")) {
    if (!userId) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (userRole !== "DOCTOR") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Futuro dashboard do paciente
  if (pathname.startsWith("/paciente")) {
    if (!userId) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (userRole !== "PATIENT") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/medico/:path*",
    "/paciente/:path*",
  ],
};
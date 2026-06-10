import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const userId = request.cookies.get("userId")?.value;
  const userRole = request.cookies.get("userRole")?.value;

  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/dashboard/admin")) {
    if (!userId) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  if (
    pathname.startsWith("/dashboard/paciente") ||
    pathname.startsWith("/dashboard/medico") ||
    pathname.startsWith("/medico") ||
    pathname.startsWith("/selecionar-perfil")
  ) {
    if (!userId) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/admin/:path*",
    "/dashboard/paciente/:path*",
    "/dashboard/medico/:path*",
    "/medico/:path*",
    "/selecionar-perfil",
  ],
};
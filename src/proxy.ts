import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", request.nextUrl.pathname);

  return NextResponse.redirect(loginUrl);
}

function redirectToHome(request: NextRequest) {
  return NextResponse.redirect(new URL("/", request.url));
}

export function proxy(request: NextRequest) {
  const userId = request.cookies.get("userId")?.value;
  const userRole = request.cookies.get("userRole")?.value;

  const { pathname } = request.nextUrl;

  const isAdminRoute =
    pathname.startsWith("/admin") || pathname.startsWith("/dashboard/admin");

  const isAuthenticatedRoute =
    pathname.startsWith("/dashboard/paciente") ||
    pathname.startsWith("/dashboard/medico") ||
    pathname.startsWith("/medico") ||
    pathname.startsWith("/selecionar-perfil") ||
    pathname.startsWith("/agendar");

  if (isAdminRoute) {
    if (!userId) {
      return redirectToLogin(request);
    }

    if (userRole !== "ADMIN") {
      return redirectToHome(request);
    }

    return NextResponse.next();
  }

  if (isAuthenticatedRoute) {
    if (!userId) {
      return redirectToLogin(request);
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/admin/:path*",
    "/dashboard/paciente/:path*",
    "/dashboard/medico/:path*",
    "/medico/:path*",
    "/selecionar-perfil",
    "/agendar/:path*",
  ],
};
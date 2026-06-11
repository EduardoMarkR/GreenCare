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

function redirectToDashboard(request: NextRequest, role?: string) {
  if (role === "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard/admin", request.url));
  }

  if (role === "DOCTOR") {
    return NextResponse.redirect(new URL("/dashboard/medico", request.url));
  }

  return NextResponse.redirect(new URL("/dashboard/paciente", request.url));
}

function isPublicAuthRoute(pathname: string) {
  return pathname === "/login" || pathname === "/cadastro";
}

export function proxy(request: NextRequest) {
  const userId = request.cookies.get("userId")?.value;
  const userRole = request.cookies.get("userRole")?.value;

  const { pathname } = request.nextUrl;

  const isLoggedIn = Boolean(userId);

  const isAdminRoute =
    pathname.startsWith("/admin") || pathname.startsWith("/dashboard/admin");

  const isPatientRoute = pathname.startsWith("/dashboard/paciente");

  const isDoctorRoute =
    pathname.startsWith("/dashboard/medico") || pathname.startsWith("/medico");

  const isProfileSelectionRoute = pathname.startsWith("/selecionar-perfil");

  const isAppointmentRoute = pathname.startsWith("/agendar");

  if (isPublicAuthRoute(pathname) && isLoggedIn) {
    return redirectToDashboard(request, userRole);
  }

  if (
    isAdminRoute ||
    isPatientRoute ||
    isDoctorRoute ||
    isProfileSelectionRoute ||
    isAppointmentRoute
  ) {
    if (!isLoggedIn) {
      return redirectToLogin(request);
    }
  }

  if (isAdminRoute && userRole !== "ADMIN") {
    return redirectToHome(request);
  }

  if (isPatientRoute && userRole !== "PATIENT") {
    return redirectToDashboard(request, userRole);
  }

  if (isDoctorRoute && userRole !== "DOCTOR") {
    return redirectToDashboard(request, userRole);
  }

  if (isAppointmentRoute && userRole !== "PATIENT") {
    return redirectToDashboard(request, userRole);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/cadastro",
    "/admin/:path*",
    "/dashboard/admin/:path*",
    "/dashboard/paciente/:path*",
    "/dashboard/medico/:path*",
    "/medico/:path*",
    "/selecionar-perfil",
    "/agendar/:path*",
  ],
};
import { getSessionCookie } from "better-auth/cookies";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login"];

export function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;
	const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
	const sessionCookie = getSessionCookie(request);

	if (!sessionCookie && !isPublic) {
		return NextResponse.redirect(new URL("/login", request.url));
	}
	if (sessionCookie && isPublic) {
		return NextResponse.redirect(new URL("/", request.url));
	}
	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

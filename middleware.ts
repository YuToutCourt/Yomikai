import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Rediriger la page racine vers le dashboard si connecté
    if (req.nextUrl.pathname === "/") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Pour la page racine, toujours autoriser (la redirection se fera dans le middleware)
        if (req.nextUrl.pathname === "/") {
          return true;
        }
        // Pour les autres routes protégées, vérifier le token
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/admin/:path*",
    "/profile/:path*",
    // Exclure les routes d'authentification et les assets
    "/((?!api|_next/static|_next/image|favicon.ico|login|register).*)",
  ],
}; 
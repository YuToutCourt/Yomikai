import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      isadmin: boolean;
      userlogo?: string;
    };
  }

  interface User {
    id: string;
    username: string;
    isadmin: boolean;
    userlogo?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    isadmin: boolean;
    userlogo?: string;
  }
} 
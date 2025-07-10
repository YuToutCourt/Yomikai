import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.isadmin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      isadmin: true,
      userlogo: true
    },
    orderBy: { id: 'desc' }
  });
  return NextResponse.json({ data: users });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.isadmin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const body = await request.json();
  const { username, password, isadmin, userlogo } = body;
  if (!username || !password) {
    return NextResponse.json({ error: "Username et password requis" }, { status: 400 });
  }
  const existing = await prisma.user.findFirst({ where: { username } });
  if (existing) {
    return NextResponse.json({ error: "Username déjà existant" }, { status: 409 });
  }
  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      username,
      password: hashed,
      isadmin: isadmin || false,
      userlogo: userlogo || null,
    },
    select: {
      id: true,
      username: true,
      isadmin: true,
      userlogo: true
    }
  });
  return NextResponse.json({ data: user });
} 
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.isadmin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { id } = await params;
  const body = await request.json();
  const { username, password, isadmin, userlogo } = body;
  if (!username) {
    return NextResponse.json({ error: "Username requis" }, { status: 400 });
  }
  let data: any = { username, isadmin: isadmin || false, userlogo: userlogo || null };
  if (password) {
    data.password = await bcrypt.hash(password, 10);
  }
  const user = await prisma.user.update({
    where: { id: Number(id) },
    data,
    select: {
      id: true,
      username: true,
      isadmin: true,
      userlogo: true
    }
  });
  return NextResponse.json({ data: user });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.isadmin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { id } = await params;
  await prisma.user.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
} 
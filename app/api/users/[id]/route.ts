import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    
    // Vérifier que l'utilisateur est connecté
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { username, userlogo } = body;

    // Vérifier que l'utilisateur modifie son propre profil
    if (session.user.id !== id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Validation des données
    if (!username || username.trim().length === 0) {
      return NextResponse.json({ error: "Le nom d'utilisateur est requis" }, { status: 400 });
    }

    // Vérifier si le nom d'utilisateur est déjà pris par un autre utilisateur
    const existingUser = await prisma.user.findFirst({
      where: {
        username: username.trim(),
        id: { not: parseInt(id) }
      }
    });

    if (existingUser) {
      return NextResponse.json({ error: "Ce nom d'utilisateur est déjà pris" }, { status: 409 });
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        username: username.trim(),
        userlogo: userlogo || null,
      },
      select: {
        id: true,
        username: true,
        userlogo: true,
        isadmin: true
      }
    });

    return NextResponse.json({
      success: true,
      message: "Profil mis à jour avec succès",
      data: updatedUser
    });

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error("Erreur lors de la mise à jour du profil:", error);
    }
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du profil" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;

    // Vérifier que l'utilisateur accède à son propre profil
    if (session.user.id !== id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        username: true,
        userlogo: true,
        isadmin: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: user
    });

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error("Erreur lors de la récupération du profil:", error);
    }
    return NextResponse.json(
      { error: "Erreur lors de la récupération du profil" },
      { status: 500 }
    );
  }
} 
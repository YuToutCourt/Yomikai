import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST - Marquer un tome comme lu/non lu
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const { tomeId, isRead } = await request.json();
    const userId = parseInt(session.user.id);

    if (!tomeId) {
      return NextResponse.json(
        { error: "ID du tome requis" },
        { status: 400 }
      );
    }

    if (isRead) {
      // Créer ou mettre à jour la lecture
      await prisma.reading.upsert({
        where: {
          userId_tomeId: {
            userId,
            tomeId
          }
        },
        update: {},
        create: {
          userId,
          tomeId
        }
      });
    } else {
      // Supprimer la lecture
      await prisma.reading.deleteMany({
        where: {
          userId,
          tomeId
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: isRead ? "Tome marqué comme lu" : "Tome marqué comme non lu"
    });

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error("Erreur lors de la mise à jour du statut de lecture:", error);
    }
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du statut de lecture" },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour la note d'un tome
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const { tomeId, rating } = await request.json();
    const userId = parseInt(session.user.id);

    if (!tomeId) {
      return NextResponse.json(
        { error: "ID du tome requis" },
        { status: 400 }
      );
    }

    if (rating && (rating < 1 || rating > 10)) {
      return NextResponse.json(
        { error: "La note doit être comprise entre 1 et 10" },
        { status: 400 }
      );
    }

    // Mettre à jour ou créer la lecture avec la note
    await prisma.reading.upsert({
      where: {
        userId_tomeId: {
          userId,
          tomeId
        }
      },
      update: {
        rating: rating || null
      },
      create: {
        userId,
        tomeId,
        rating: rating || null
      }
    });

    return NextResponse.json({
      success: true,
      message: "Note mise à jour"
    });

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error("Erreur lors de la mise à jour de la note:", error);
    }
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la note" },
      { status: 500 }
    );
  }
}

// GET - Récupérer les lectures de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);

    const readings = await prisma.reading.findMany({
      where: { userId },
      include: {
        tome: {
          include: {
            manga: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: readings
    });

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error("Erreur lors de la récupération des lectures:", error);
    }
    return NextResponse.json(
      { error: "Erreur lors de la récupération des lectures" },
      { status: 500 }
    );
  }
} 
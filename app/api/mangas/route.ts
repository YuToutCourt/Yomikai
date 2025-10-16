import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Récupérer tous les mangas avec leurs tomes
    const mangas = await prisma.manga.findMany({
      include: {
        tomes: {
          orderBy: { numero: 'asc' }
        }
      },
      orderBy: { title: 'asc' }
    });

    // Si l'utilisateur est connecté, récupérer ses lectures et les notes globales
    if (session.user?.id) {
      const userId = parseInt(session.user.id);
      
      // Récupérer les lectures de l'utilisateur
      const readings = await prisma.reading.findMany({
        where: { userId },
        include: { tome: true }
      });

      // Récupérer toutes les notes pour calculer les moyennes globales
      const allRatings = await prisma.reading.findMany({
        where: { rating: { not: null } },
        include: { tome: true }
      });

      // Créer un map pour les lectures de l'utilisateur
      const readingsMap = new Map();
      readings.forEach(reading => {
        readingsMap.set(reading.tomeId, {
          isRead: true,
          rating: reading.rating
        });
      });

      // Créer un map pour les notes globales par tome
      const globalRatingsMap = new Map();
      allRatings.forEach(reading => {
        if (!globalRatingsMap.has(reading.tomeId)) {
          globalRatingsMap.set(reading.tomeId, []);
        }
        globalRatingsMap.get(reading.tomeId).push(reading.rating);
      });

      // Calculer les moyennes globales
      const globalAveragesMap = new Map();
      globalRatingsMap.forEach((ratings, tomeId) => {
        const average = ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratings.length;
        globalAveragesMap.set(tomeId, average);
      });

      // Enrichir les mangas avec les données de lecture et notes
      const enrichedMangas = mangas.map(manga => ({
        ...manga,
        tomes: manga.tomes.map(tome => ({
          ...tome,
          isRead: readingsMap.has(tome.id) ? readingsMap.get(tome.id).isRead : false,
          rating: readingsMap.has(tome.id) ? readingsMap.get(tome.id).rating : null,
          globalRating: globalAveragesMap.get(tome.id) || null
        }))
      }));

      return NextResponse.json({
        success: true,
        data: enrichedMangas
      });
    }

    // Si pas d'ID utilisateur, retourner les mangas sans données de lecture
    return NextResponse.json({
      success: true,
      data: mangas
    });

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error("Erreur lors de la récupération des mangas:", error);
    }
    return NextResponse.json(
      { error: "Erreur lors de la récupération des mangas" },
      { status: 500 }
    );
  }
} 
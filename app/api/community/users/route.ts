import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const totalTomes = await prisma.tome.count();

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        userlogo: true,
        readings: {
          select: {
            rating: true,
            tome: {
              select: {
                id: true,
                numero: true,
                coverImage: true,
                manga: { select: { id: true, title: true, coverImage: true } }
              }
            }
          }
        }
      },
      orderBy: { readings: { _count: 'desc' } }
    });

    const result = users.map((u) => {
      const readCount = u.readings.length;
      const ratings = u.readings
        .filter((r) => r.rating !== null && r.rating !== undefined)
        .map((r) => ({
          rating: r.rating,
          tomeId: r.tome.id,
          tomeNumero: r.tome.numero,
          tomeCoverImage: r.tome.coverImage || null,
          mangaId: r.tome.manga.id,
          mangaTitle: r.tome.manga.title,
          mangaCoverImage: r.tome.manga.coverImage || null,
        }));

      const avgRating = ratings.length > 0
        ? ratings.reduce((s, it) => s + (it.rating || 0), 0) / ratings.length
        : null;

      const progress = totalTomes > 0 ? Math.round((readCount / totalTomes) * 100) : 0;

      return {
        id: u.id,
        username: u.username,
        userlogo: u.userlogo || null,
        readCount,
        totalTomes,
        progress,
        averageRating: avgRating,
        ratings,
      };
    });

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

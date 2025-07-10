import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.isadmin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const formData = await request.formData();
    const mangaId = formData.get("mangaId") as string;
    const numero = formData.get("numero") as string;
    const prix = formData.get("prix") as string;
    const editeur = formData.get("editeur") as string;
    const coverImageFile = formData.get("coverImage") as File | null;

    // Validation des données
    if (!mangaId || !numero || !prix || !editeur) {
      return NextResponse.json({ 
        error: "Tous les champs obligatoires doivent être remplis" 
      }, { status: 400 });
    }

    // Vérifier que le manga existe
    const manga = await prisma.manga.findUnique({
      where: { id: parseInt(mangaId) }
    });

    if (!manga) {
      return NextResponse.json({ error: "Manga non trouvé" }, { status: 404 });
    }

    // Vérifier que le numéro de tome n'existe pas déjà pour ce manga
    const existingTome = await prisma.tome.findFirst({
      where: {
        mangaId: parseInt(mangaId),
        numero: parseInt(numero)
      }
    });

    if (existingTome) {
      return NextResponse.json({ 
        error: `Le tome ${numero} existe déjà pour ce manga` 
      }, { status: 400 });
    }

    let coverImagePath = null;

    // Traitement de l'image de couverture
    if (coverImageFile && coverImageFile.size > 0) {
      const bytes = await coverImageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      // Créer un nom de fichier unique
      const timestamp = Date.now();
      const fileName = `tome_${mangaId}_${numero}_${timestamp}.${coverImageFile.name.split('.').pop()}`;
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'mangas', 'tomes');
      const filePath = path.join(uploadDir, fileName);
      
      // Créer le dossier s'il n'existe pas
      try {
        await mkdir(uploadDir, { recursive: true });
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.log("Dossier existe déjà ou erreur de création:", error);
        }
      }
      
      // Sauvegarder le fichier
      await writeFile(filePath, buffer);
      
      coverImagePath = `/uploads/mangas/tomes/${fileName}`;
    } else if (typeof formData.get("coverImage") === 'string' && formData.get("coverImage")) {
      // Si c'est une URL
      coverImagePath = formData.get("coverImage") as string;
    }

    // Créer le tome
    const tome = await prisma.tome.create({
      data: {
        numero: parseInt(numero),
        prix: prix,
        editeur: editeur,
        coverImage: coverImagePath,
        mangaId: parseInt(mangaId)
      }
    });

    return NextResponse.json({
      message: "Tome ajouté avec succès",
      data: tome
    });

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error("Erreur lors de l'ajout du tome:", error);
    }
    return NextResponse.json(
      { error: "Erreur lors de l'ajout du tome" },
      { status: 500 }
    );
  }
}

// GET - Liste paginée des tomes pour l'admin
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.isadmin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const [tomes, total] = await Promise.all([
      prisma.tome.findMany({
        skip,
        take: limit,
        orderBy: [
          { manga: { title: "asc" } },
          { numero: "asc" }
        ],
        include: { manga: { select: { title: true } } },
      }),
      prisma.tome.count(),
    ]);

    return NextResponse.json({
      data: tomes,
      total,
      page,
      limit,
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error("Erreur lors de la récupération des tomes:", error);
    }
    return NextResponse.json(
      { error: "Erreur lors de la récupération des tomes" },
      { status: 500 }
    );
  }
} 
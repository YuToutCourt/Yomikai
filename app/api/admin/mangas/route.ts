import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// Types pour la création de manga
interface CreateMangaRequest {
  title: string;
  author?: string;
  genre?: string;
  status: string;
  description?: string;
  coverImage?: string;
  tomes: CreateTomeRequest[];
}

interface CreateTomeRequest {
  numero: number;
  prix: number;
  editeur: string;
  coverImage?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification admin
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.isadmin) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const title = formData.get("title") as string;
    const author = formData.get("author") as string;
    const genre = formData.get("genre") as string;
    const status = formData.get("status") as string;
    const description = formData.get("description") as string;
    const coverImageFile = formData.get("coverImage") as File | null;

    // Validation des données
    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Le titre est requis" },
        { status: 400 }
      );
    }

    let coverImagePath = null;

    // Traitement de l'image de couverture
    if (coverImageFile && coverImageFile.size > 0) {
      const bytes = await coverImageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      // Créer un nom de fichier unique
      const timestamp = Date.now();
      const fileName = `manga_${timestamp}.${coverImageFile.name.split('.').pop()}`;
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'mangas', 'covers');
      const filePath = path.join(uploadDir, fileName);
      
      // Créer le dossier s'il n'existe pas
      try {
        await mkdir(uploadDir, { recursive: true });
      } catch (error) {
        // Dossier existe déjà ou erreur de création
      }
      
      // Sauvegarder le fichier
      await writeFile(filePath, buffer);
      
      coverImagePath = `/uploads/mangas/covers/${fileName}`;
    } else if (typeof formData.get("coverImage") === 'string' && formData.get("coverImage")) {
      // Si c'est une URL
      coverImagePath = formData.get("coverImage") as string;
    }

    // Vérifier si le manga existe déjà
    const existingManga = await prisma.manga.findFirst({
      where: { title: title.trim() }
    });

    if (existingManga) {
      return NextResponse.json(
        { error: "Un manga avec ce titre existe déjà" },
        { status: 409 }
      );
    }

    // Créer le manga
    const manga = await prisma.manga.create({
      data: {
        title: title.trim(),
        author: author?.trim() || null,
        genre: genre?.trim() || null,
        status: status,
        description: description?.trim() || null,
        coverImage: coverImagePath,
      }
    });

    return NextResponse.json({
      success: true,
      message: "Manga créé avec succès",
      data: manga
    }, { status: 201 });

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error("Erreur lors de la création du manga:", error);
    }
    return NextResponse.json(
      { error: "Erreur lors de la création du manga" },
      { status: 500 }
    );
  }
}

// GET pour récupérer tous les mangas (optionnel, pour la gestion)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.isadmin) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 401 }
      );
    }

    const mangas = await prisma.manga.findMany({
      include: {
        tomes: {
          orderBy: { numero: 'asc' }
        }
      },
      orderBy: { title: 'asc' }
    });

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
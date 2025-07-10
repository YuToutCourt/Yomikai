import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// PUT - Modifier un manga
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Vérifier l'authentification admin
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.isadmin) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const mangaId = parseInt(id);
    if (isNaN(mangaId)) {
      return NextResponse.json(
        { error: "ID de manga invalide" },
        { status: 400 }
      );
    }

    // Vérifier que le manga existe
    const existingManga = await prisma.manga.findUnique({
      where: { id: mangaId }
    });

    if (!existingManga) {
      return NextResponse.json(
        { error: "Manga non trouvé" },
        { status: 404 }
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

    let coverImagePath = existingManga.coverImage;

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
        if (process.env.NODE_ENV === 'development') {
          console.log("Dossier existe déjà ou erreur de création:", error);
        }
      }
      
      // Sauvegarder le fichier
      await writeFile(filePath, buffer);
      
      coverImagePath = `/uploads/mangas/covers/${fileName}`;
    } else if (typeof formData.get("coverImage") === 'string' && formData.get("coverImage")) {
      // Si c'est une URL
      coverImagePath = formData.get("coverImage") as string;
    }

    // Vérifier si le titre existe déjà (sauf pour ce manga)
    const duplicateManga = await prisma.manga.findFirst({
      where: { 
        title: title.trim(),
        id: { not: mangaId }
      }
    });

    if (duplicateManga) {
      return NextResponse.json(
        { error: "Un manga avec ce titre existe déjà" },
        { status: 409 }
      );
    }

    // Mettre à jour le manga
    const updatedManga = await prisma.manga.update({
      where: { id: mangaId },
      data: {
        title: title.trim(),
        author: author?.trim() || null,
        genre: genre?.trim() || null,
        status: status,
        description: description?.trim() || null,
        coverImage: coverImagePath,
      }
    });

    if (process.env.NODE_ENV === 'development') {
      console.log("✅ Manga modifié avec succès:", updatedManga.title);
    }

    return NextResponse.json({
      success: true,
      message: "Manga modifié avec succès",
      data: updatedManga
    });

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error("Erreur lors de la modification du manga:", error);
    }
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un manga
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Vérifier l'authentification admin
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.isadmin) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const mangaId = parseInt(id);
    if (isNaN(mangaId)) {
      return NextResponse.json(
        { error: "ID de manga invalide" },
        { status: 400 }
      );
    }

    // Vérifier que le manga existe
    const existingManga = await prisma.manga.findUnique({
      where: { id: mangaId },
      include: { tomes: true }
    });

    if (!existingManga) {
      return NextResponse.json(
        { error: "Manga non trouvé" },
        { status: 404 }
      );
    }

    // Supprimer le manga et tous ses tomes (cascade)
    await prisma.manga.delete({
      where: { id: mangaId }
    });

    if (process.env.NODE_ENV === 'development') {
      console.log("✅ Manga supprimé avec succès:", existingManga.title);
    }

    return NextResponse.json({
      success: true,
      message: "Manga supprimé avec succès"
    });

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error("Erreur lors de la suppression du manga:", error);
    }
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
} 
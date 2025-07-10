import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.isadmin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const tomeId = parseInt(id);
    if (isNaN(tomeId)) {
      return NextResponse.json({ error: "ID de tome invalide" }, { status: 400 });
    }

    // Vérifier que le tome existe
    const existingTome = await prisma.tome.findUnique({
      where: { id: tomeId },
    });
    if (!existingTome) {
      return NextResponse.json({ error: "Tome non trouvé" }, { status: 404 });
    }

    const formData = await request.formData();
    const numero = formData.get("numero") as string;
    const prix = formData.get("prix") as string;
    const editeur = formData.get("editeur") as string;
    const coverImageFile = formData.get("coverImage") as File | null;

    // Validation des données
    if (!numero || !prix || !editeur) {
      return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
    }

    let coverImagePath = existingTome.coverImage;

    // Traitement de l'image de couverture
    if (coverImageFile && coverImageFile.size > 0) {
      const bytes = await coverImageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const timestamp = Date.now();
      const fileName = `tome_${existingTome.mangaId}_${numero}_${timestamp}.${coverImageFile.name.split('.').pop()}`;
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'mangas', 'tomes');
      const filePath = path.join(uploadDir, fileName);
      try {
        await mkdir(uploadDir, { recursive: true });
      } catch (error) {
        // dossier existe déjà ou erreur
      }
      await writeFile(filePath, buffer);
      coverImagePath = `/uploads/mangas/tomes/${fileName}`;
    } else if (typeof formData.get("coverImage") === 'string' && formData.get("coverImage")) {
      coverImagePath = formData.get("coverImage") as string;
    }

    // Vérifier qu'il n'y a pas de doublon de numéro pour ce manga (hors ce tome)
    const duplicateTome = await prisma.tome.findFirst({
      where: {
        mangaId: existingTome.mangaId,
        numero: parseInt(numero),
        id: { not: tomeId },
      },
    });
    if (duplicateTome) {
      return NextResponse.json({ error: `Le tome ${numero} existe déjà pour ce manga` }, { status: 400 });
    }

    // Mettre à jour le tome
    const updatedTome = await prisma.tome.update({
      where: { id: tomeId },
      data: {
        numero: parseInt(numero),
        prix: prix,
        editeur: editeur,
        coverImage: coverImagePath,
      },
    });

    return NextResponse.json({
      message: "Tome modifié avec succès",
      data: updatedTome,
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error("Erreur lors de la modification du tome:", error);
    }
    return NextResponse.json(
      { error: "Erreur lors de la modification du tome" },
      { status: 500 }
    );
  }
} 
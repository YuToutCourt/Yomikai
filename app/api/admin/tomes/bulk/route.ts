import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

function getImageMimeType(buffer: Buffer): string | null {
  const base64 = buffer.toString("base64");
  if (base64.startsWith("/9j/")) return "image/jpeg";
  if (base64.startsWith("iVBORw0KGgo")) return "image/png";
  if (base64.startsWith("UklGR")) return "image/webp";
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isadmin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { mangaId, images } = body;

    if (!mangaId || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    if (images.length > 50) {
      return NextResponse.json({ error: "Maximum 50 images à la fois" }, { status: 400 });
    }

    // Récupérer les tomes existants triés par numéro
    const tomes = await prisma.tome.findMany({
      where: { mangaId: Number(mangaId) },
      orderBy: { numero: "asc" },
    });

    if (tomes.length === 0) {
      return NextResponse.json({ error: "Ce manga n'a aucun tome" }, { status: 400 });
    }

    const uploadPath = join(process.cwd(), "public", "uploads", "mangas", "tomes");
    await mkdir(uploadPath, { recursive: true });

    const updated = [];
    const errors: { tome: number; error: string }[] = [];
    const count = Math.min(images.length, tomes.length);

    for (let i = 0; i < count; i++) {
      const tome = tomes[i];

      try {
        const base64Data = (images[i] as string).replace(/^data:image\/[a-z]+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");

        if (buffer.length > 5 * 1024 * 1024) {
          errors.push({ tome: tome.numero, error: "Image trop volumineuse (max 5MB)" });
          continue;
        }

        const mimeType = getImageMimeType(buffer);
        if (!mimeType) {
          errors.push({ tome: tome.numero, error: "Type d'image non supporté" });
          continue;
        }

        const processedBuffer = await sharp(new Uint8Array(buffer))
          .resize(200, 300, { fit: "cover" })
          .jpeg({ quality: 80 })
          .toBuffer();

        const fileName = `${uuidv4()}.jpeg`;
        await writeFile(join(uploadPath, fileName), Buffer.from(processedBuffer));
        const coverImagePath = `/uploads/mangas/tomes/${fileName}`;

        await prisma.tome.update({
          where: { id: tome.id },
          data: { coverImage: coverImagePath },
        });

        updated.push({ id: tome.id, numero: tome.numero });
      } catch {
        errors.push({ tome: tome.numero, error: "Erreur traitement image" });
      }
    }

    return NextResponse.json({ updated: updated.length, errors, tomes: updated });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Erreur bulk covers:", error);
    }
    return NextResponse.json({ error: "Erreur lors de la mise à jour des couvertures" }, { status: 500 });
  }
}

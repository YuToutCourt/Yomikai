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
    const { mangaId, startingTome, images } = body;
    const prix = "0";
    const editeur = "Non renseigné";

    if (!mangaId || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    if (images.length > 50) {
      return NextResponse.json({ error: "Maximum 50 images à la fois" }, { status: 400 });
    }

    const manga = await prisma.manga.findUnique({ where: { id: Number(mangaId) } });
    if (!manga) {
      return NextResponse.json({ error: "Manga non trouvé" }, { status: 404 });
    }

    const uploadPath = join(process.cwd(), "public", "uploads", "mangas", "tomes");
    await mkdir(uploadPath, { recursive: true });

    const created = [];
    const errors: { tome: number; error: string }[] = [];

    for (let i = 0; i < images.length; i++) {
      const tomeNum = Number(startingTome) + i;

      const existing = await prisma.tome.findFirst({
        where: { mangaId: Number(mangaId), numero: tomeNum },
      });

      if (existing) {
        errors.push({ tome: tomeNum, error: `Tome ${tomeNum} existe déjà` });
        continue;
      }

      let coverImagePath: string | null = null;

      if (images[i]) {
        try {
          const base64Data = (images[i] as string).replace(/^data:image\/[a-z]+;base64,/, "");
          const buffer = Buffer.from(base64Data, "base64");

          if (buffer.length > 5 * 1024 * 1024) {
            errors.push({ tome: tomeNum, error: "Image trop volumineuse (max 5MB)" });
            continue;
          }

          const mimeType = getImageMimeType(buffer);
          if (!mimeType) {
            errors.push({ tome: tomeNum, error: "Type d'image non supporté" });
            continue;
          }

          const processedBuffer = await sharp(new Uint8Array(buffer))
            .resize(200, 300, { fit: "cover" })
            .jpeg({ quality: 80 })
            .toBuffer();

          const fileName = `${uuidv4()}.jpeg`;
          await writeFile(join(uploadPath, fileName), Buffer.from(processedBuffer));
          coverImagePath = `/uploads/mangas/tomes/${fileName}`;
        } catch {
          errors.push({ tome: tomeNum, error: "Erreur traitement image" });
          continue;
        }
      }

      try {
        const tome = await prisma.tome.create({
          data: {
            numero: tomeNum,
            prix,
            editeur,
            coverImage: coverImagePath,
            mangaId: Number(mangaId),
          },
        });
        created.push(tome);
      } catch {
        errors.push({ tome: tomeNum, error: "Erreur création en base de données" });
      }
    }

    return NextResponse.json({ created: created.length, errors, tomes: created });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Erreur bulk tomes:", error);
    }
    return NextResponse.json({ error: "Erreur lors de la création des tomes" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit, validateFileUpload } from "@/lib/security";

// Types pour l'upload
interface UploadRequest {
  file: string; // Base64 encoded file
  type: "cover" | "tome" | "user";
  mangaId?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting pour les uploads
    const rateLimitCheck = checkRateLimit(request, 10, 60 * 1000); // 10 uploads par minute
    if (!rateLimitCheck.success) {
      return NextResponse.json(
        { error: rateLimitCheck.error },
        { status: 429 }
      );
    }

    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const body: UploadRequest = await request.json();
    const { file, type, mangaId } = body;

    // Validation des paramètres
    if (!file || !type) {
      return NextResponse.json(
        { error: "Fichier et type requis" },
        { status: 400 }
      );
    }

    // Vérifier les permissions selon le type
    if (type === "user") {
      // Les utilisateurs peuvent uploader leur propre logo
      // Pas besoin de vérification admin
    } else if (type === "cover" || type === "tome") {
      // Seuls les admins peuvent uploader des images de manga
      if (!session.user?.isadmin) {
        return NextResponse.json(
          { error: "Accès non autorisé" },
          { status: 401 }
        );
      }
    }

    // Décoder le fichier base64
    const base64Data = file.replace(/^data:image\/[a-z]+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // Validation sécurisée du fichier
    const fileValidation = validateFileUpload(buffer, 5 * 1024 * 1024); // 5MB max
    if (!fileValidation.valid) {
      return NextResponse.json(
        { error: fileValidation.error },
        { status: 400 }
      );
    }

    // Validation du type de fichier
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const fileType = await getImageType(buffer);
    
    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json(
        { error: "Type de fichier non supporté. Utilisez JPG, PNG ou WebP" },
        { status: 400 }
      );
    }

    // Générer un nom de fichier unique
    const fileName = `${uuidv4()}.${fileType.split('/')[1]}`;
    
    // Déterminer le chemin de sauvegarde
    let uploadDir: string;
    let uploadPath: string;
    
    if (type === "user") {
      uploadDir = "users/logos";
      uploadPath = join(process.cwd(), "public", "uploads", uploadDir);
    } else {
      uploadDir = type === "cover" ? "covers" : "tomes";
      uploadPath = join(process.cwd(), "public", "uploads", "mangas", uploadDir);
    }
    
    // Créer le dossier s'il n'existe pas
    await mkdir(uploadPath, { recursive: true });

    // Redimensionner l'image selon le type
    let processedBuffer = buffer;
    const uint8Buffer = new Uint8Array(buffer);
    
    if (type === "cover") {
      // Redimensionner les couvertures à 300x400
      const sharpBuffer = await sharp(uint8Buffer)
        .resize(300, 400, { fit: "cover" })
        .jpeg({ quality: 80 })
        .toBuffer();
      processedBuffer = Buffer.from(sharpBuffer);
    } else if (type === "tome") {
      // Redimensionner les tomes à 200x300
      const sharpBuffer = await sharp(uint8Buffer)
        .resize(200, 300, { fit: "cover" })
        .jpeg({ quality: 80 })
        .toBuffer();
      processedBuffer = Buffer.from(sharpBuffer);
    } else if (type === "user") {
      // Redimensionner les logos utilisateur à 150x150
      const sharpBuffer = await sharp(uint8Buffer)
        .resize(150, 150, { fit: "cover" })
        .jpeg({ quality: 80 })
        .toBuffer();
      processedBuffer = Buffer.from(sharpBuffer);
    }

    // Sauvegarder le fichier
    const filePath = join(uploadPath, fileName);
    await writeFile(filePath, processedBuffer);

    // Retourner l'URL relative
    let fileUrl: string;
    if (type === "user") {
      fileUrl = `/uploads/${uploadDir}/${fileName}`;
    } else {
      fileUrl = `/uploads/mangas/${uploadDir}/${fileName}`;
    }

    return NextResponse.json({
      success: true,
      url: fileUrl,
      fileName: fileName
    });

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error("Erreur lors de l'upload:", error);
    }
    return NextResponse.json(
      { error: "Erreur lors de l'upload" },
      { status: 500 }
    );
  }
}

// Fonction pour détecter le type d'image
async function getImageType(buffer: Buffer): Promise<string> {
  const signatures = {
    "/9j/": "image/jpeg",
    "iVBORw0KGgo": "image/png",
    "UklGR": "image/webp"
  };

  const base64 = buffer.toString("base64");
  
  for (const [signature, mimeType] of Object.entries(signatures)) {
    if (base64.startsWith(signature)) {
      return mimeType;
    }
  }

  throw new Error("Type d'image non reconnu");
} 
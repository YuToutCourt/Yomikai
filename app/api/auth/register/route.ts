import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { checkRateLimit, sanitizeInput, validateStrongPassword } from "@/lib/security";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting pour prévenir les attaques par force brute
    const rateLimitCheck = checkRateLimit(request, 5, 15 * 60 * 1000); // 5 tentatives par 15 min
    if (!rateLimitCheck.success) {
      return NextResponse.json(
        { error: rateLimitCheck.error },
        { status: 429 }
      );
    }

    const { username, password } = await request.json();

    // Validation et sanitisation
    if (!username || !password) {
      return NextResponse.json(
        { error: "Nom d'utilisateur et mot de passe requis" },
        { status: 400 }
      );
    }

    const sanitizedUsername = sanitizeInput(username);
    
    if (sanitizedUsername.length < 3) {
      return NextResponse.json(
        { error: "Le nom d'utilisateur doit contenir au moins 3 caractères" },
        { status: 400 }
      );
    }

    // Validation du mot de passe fort
    const passwordValidation = validateStrongPassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { username: sanitizedUsername }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Ce nom d'utilisateur est déjà pris" },
        { status: 409 }
      );
    }

    // Hasher le mot de passe avec salt fort
    const hashedPassword = await bcrypt.hash(password, 14);

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        username: sanitizedUsername,
        password: hashedPassword,
      },
    });

    // Retourner la réponse sans le mot de passe
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      { 
        message: "Compte créé avec succès",
        user: userWithoutPassword 
      },
      { status: 201 }
    );

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error("Erreur lors de la création du compte:", error);
    }
    return NextResponse.json(
      { error: "Erreur lors de la création du compte" },
      { status: 500 }
    );
  }
} 
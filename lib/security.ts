import { NextRequest } from 'next/server';

// Rate limiting simple en mémoire (à remplacer par Redis en production)
const rateLimit = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiting middleware
 */
export function checkRateLimit(
  request: NextRequest,
  maxRequests: number = 10,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { success: boolean; error?: string } {
  const ip = request.headers.get('x-forwarded-for') || 
            request.headers.get('x-real-ip') || 
            'anonymous';
  const now = Date.now();
  
  const userLimit = rateLimit.get(ip);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimit.set(ip, { count: 1, resetTime: now + windowMs });
    return { success: true };
  }
  
  if (userLimit.count >= maxRequests) {
    return { 
      success: false, 
      error: 'Trop de tentatives. Réessayez plus tard.' 
    };
  }
  
  userLimit.count++;
  return { success: true };
}

/**
 * Validation sécurisée des uploads
 */
export function validateFileUpload(
  buffer: Buffer,
  maxSize: number = 5 * 1024 * 1024 // 5MB
): { valid: boolean; error?: string } {
  // Vérification de la taille
  if (buffer.length > maxSize) {
    return { 
      valid: false, 
      error: `Fichier trop volumineux. Maximum: ${maxSize / 1024 / 1024}MB` 
    };
  }
  
  // Vérification des signatures de fichiers (magic numbers)
  const signatures = {
    'ffd8ff': 'jpeg',
    '89504e47': 'png',
    '52494646': 'webp'
  };
  
  const header = buffer.subarray(0, 4).toString('hex');
  const isValidType = Object.keys(signatures).some(sig => 
    header.startsWith(sig) || header.startsWith(sig.substring(0, 6))
  );
  
  if (!isValidType) {
    return { 
      valid: false, 
      error: 'Type de fichier non autorisé. Seuls JPG, PNG et WebP sont acceptés.' 
    };
  }
  
  return { valid: true };
}

/**
 * Sanitisation des inputs utilisateur
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Supprimer les scripts
    .replace(/[<>]/g, '') // Supprimer les balises HTML basiques
    .substring(0, 1000); // Limiter la longueur
}

/**
 * Validation des mots de passe forts
 */
export function validateStrongPassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'Le mot de passe doit contenir au moins 8 caractères' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Le mot de passe doit contenir au moins une majuscule' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Le mot de passe doit contenir au moins une minuscule' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Le mot de passe doit contenir au moins un chiffre' };
  }
  
  // Vérifier contre les mots de passe communs
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123', 
    'password123', 'admin', 'letmein', 'welcome', 'monkey'
  ];
  
  if (commonPasswords.includes(password.toLowerCase())) {
    return { valid: false, error: 'Ce mot de passe est trop commun' };
  }
  
  return { valid: true };
} 
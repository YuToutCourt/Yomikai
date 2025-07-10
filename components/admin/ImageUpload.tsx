"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Image, Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  onImageUpload: (imageUrl: string) => void;
  currentImage?: string;
  uploadType?: "cover" | "tome" | "user";
  className?: string;
  label?: string;
  placeholder?: string;
}

export default function ImageUpload({ 
  onImageUpload, 
  currentImage,
  uploadType = "user",
  className = "",
  label = "Image",
  placeholder = "URL de l'image ou upload" 
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [urlValue, setUrlValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadToServer = async (file: File): Promise<string> => {
    // Convertir le fichier en base64
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve) => {
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
    });
    reader.readAsDataURL(file);
    const base64Data = await base64Promise;

    // Upload vers le serveur
    const response = await fetch("/api/admin/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        file: base64Data,
        type: uploadType,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Erreur lors de l'upload");
    }

    const data = await response.json();
    return data.url;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validation du type de fichier
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Type de fichier non supporté. Utilisez JPG, PNG ou WebP");
      return;
    }

    // Validation de la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Fichier trop volumineux. Taille maximum : 5MB");
      return;
    }

    setIsUploading(true);

    try {
      // Créer une URL de prévisualisation temporaire
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
      
      // Upload vers le serveur
      const uploadedUrl = await uploadToServer(file);
      
      // Mettre à jour la prévisualisation avec l'URL du serveur
      setPreview(uploadedUrl);
      setUrlValue(uploadedUrl);
      
      // Notifier le parent
      onImageUpload(uploadedUrl);
      
      toast.success("Image uploadée avec succès !");
    } catch (error) {
      // Log error securely in production
      if (process.env.NODE_ENV === 'development') {
        console.error("Erreur upload:", error);
      }
      toast.error("Erreur lors de l'upload du fichier");
      setPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlChange = (url: string) => {
    setUrlValue(url);
    setPreview(url);
    onImageUpload(url);
  };

  const clearImage = () => {
    setUrlValue("");
    setPreview(null);
    onImageUpload("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Label className="text-white font-medium">{label}</Label>
      
      {/* Input URL */}
      <div className="flex space-x-2">
        <Input
          value={urlValue}
          onChange={(e) => handleUrlChange(e.target.value)}
          className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#EBACA2] focus:ring-[#EBACA2]/20"
          placeholder={placeholder}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="border-white/20 text-white hover:bg-white/10"
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
        </Button>
        {(preview || urlValue) && (
          <Button
            type="button"
            variant="outline"
            onClick={clearImage}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Input fichier caché */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Prévisualisation */}
      {(preview || urlValue) && (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-24 bg-gradient-to-br from-[#CE6A6B] to-[#EBACA2] rounded-lg flex items-center justify-center overflow-hidden">
                {preview || urlValue ? (
                  <img
                    src={preview || urlValue}
                    alt="Prévisualisation"
                    className="w-full h-full object-cover"
                    onError={() => setPreview(null)}
                  />
                ) : (
                  <Image className="w-8 h-8 text-white/50" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-white/70 text-sm">
                  {urlValue ? "URL d'image" : "Fichier uploadé"}
                </p>
                <p className="text-white/50 text-xs">
                  {preview || urlValue ? "Image chargée" : "Aucune image"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <div className="text-white/50 text-xs">
        <p>• Formats acceptés : JPG, PNG, WebP</p>
        <p>• Taille maximum : 5MB</p>
        <p>• Ou collez une URL d'image</p>
      </div>
    </div>
  );
} 
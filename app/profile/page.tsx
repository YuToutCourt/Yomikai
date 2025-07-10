"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Upload, User, Save } from "lucide-react";
import { toast } from "sonner";
import ImageUpload from "@/components/admin/ImageUpload";

interface UserProfile {
  id: number;
  username: string;
  userlogo?: string;
  isadmin: boolean;
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    userlogo: ""
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user) {
      // Initialiser les données du formulaire
      setFormData({
        username: session.user.username || "",
        userlogo: session.user.userlogo || ""
      });
    }
  }, [status, session, router]);

  const handleImageUpload = (imageUrl: string) => {
    setFormData(prev => ({ ...prev, userlogo: imageUrl }));
    toast.success("Logo mis à jour !");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user?.id) {
      toast.error("Session utilisateur non trouvée");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/users/${session.user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        toast.success("Profil mis à jour avec succès !");
        
        // Mettre à jour la session NextAuth
        await update({
          ...session,
          user: {
            ...session.user,
            username: updatedUser.data.username,
            userlogo: updatedUser.data.userlogo
          }
        });
        
      } else {
        const error = await response.json();
        toast.error(`Erreur: ${error.error}`);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Erreur:", error);
      }
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#212E53] to-[#4A919E] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto"></div>
          <p className="mt-6 text-white text-lg font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#212E53] to-[#4A919E]">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                className="text-white hover:bg-white/10"
                onClick={() => router.push("/dashboard")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour Dashboard
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#CE6A6B] to-[#EBACA2] rounded-full flex items-center justify-center">
                  <span className="text-white text-lg">🌸</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Mon Profil</h1>
                  <p className="text-white/70 text-sm">Gérer mes informations</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        
        <div className="max-w-2xl mx-auto">
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <User className="w-5 h-5 mr-2" />
                Informations du profil
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Avatar Preview */}
                <div className="text-center">
                  <Avatar className="h-24 w-24 mx-auto mb-4">
                    <AvatarImage 
                      src={formData.userlogo || undefined} 
                      alt={formData.username} 
                    />
                    <AvatarFallback className="bg-gradient-to-br from-[#CE6A6B] to-[#EBACA2] text-white text-2xl">
                      {formData.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-white/70 text-sm">Aperçu de votre avatar</p>
                </div>

                {/* Username */}
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-white">Nom d'utilisateur *</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    required
                  />
                </div>

                {/* Logo Upload */}
                <div className="space-y-2">
                  <Label className="text-white">Logo de profil</Label>
                  <ImageUpload
                    onImageUpload={handleImageUpload}
                    currentImage={formData.userlogo}
                    uploadType="user"
                    className="bg-white/10 border-white/20"
                  />
                  <p className="text-white/60 text-xs">
                    Formats acceptés: JPG, PNG, WebP. Taille max: 2MB.
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-[#CE6A6B] hover:bg-[#B55A5B] text-white"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Sauvegarder
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
} 
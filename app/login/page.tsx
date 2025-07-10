"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState("login");
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [registerData, setRegisterData] = useState({ 
    username: "", 
    password: "", 
    confirmPassword: "" 
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté
    getSession().then((session) => {
      if (session) {
        router.push("/dashboard");
      }
    });
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await signIn("credentials", {
        username: loginData.username,
        password: loginData.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Nom d'utilisateur ou mot de passe incorrect");
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      setError("Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    // Validation
    if (registerData.password !== registerData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: registerData.username,
          password: registerData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Compte créé avec succès ! Vous pouvez maintenant vous connecter.");
        setRegisterData({ username: "", password: "", confirmPassword: "" });
        setActiveTab("login");
      } else {
        setError(data.error || "Erreur lors de la création du compte");
      }
    } catch (error) {
      setError("Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center p-4 relative">
      <div className="w-full max-w-md relative z-10">
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-white rounded-full flex items-center justify-center shadow-lg">
            <span className="text-4xl">🌸</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Yomimono</h1>
          <p className="text-white/80">Accédez à votre collection de mangas</p>
        </div>

        {/* Onglets Connexion/Inscription */}
        <Card className="manga-card glass-effect border-white/20">
          <CardHeader className="text-center pb-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-white/10">
                <TabsTrigger 
                  value="login" 
                  className="data-[state=active]:bg-[#CE6A6B] data-[state=active]:text-white"
                >
                  Connexion
                </TabsTrigger>
                <TabsTrigger 
                  value="register" 
                  className="data-[state=active]:bg-[#CE6A6B] data-[state=active]:text-white"
                >
                  Inscription
                </TabsTrigger>
              </TabsList>

              {/* Onglet Connexion */}
              <TabsContent value="login" className="mt-6">
                <CardDescription className="text-white/70 mb-6">
                  Connectez-vous à votre compte existant
                </CardDescription>
                
                <form onSubmit={handleLogin} className="space-y-6">
                  {error && (
                    <div className="bg-[#CE6A6B]/20 border border-[#CE6A6B]/30 text-[#CE6A6B] px-4 py-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="login-username" className="text-white font-medium">
                      Nom d'utilisateur
                    </Label>
                    <Input
                      id="login-username"
                      type="text"
                      value={loginData.username}
                      onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#EBACA2] focus:ring-[#EBACA2]/20"
                      placeholder="Entrez votre nom d'utilisateur"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-white font-medium">
                      Mot de passe
                    </Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#EBACA2] focus:ring-[#EBACA2]/20"
                      placeholder="Entrez votre mot de passe"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#CE6A6B] hover:bg-[#B55A5B] disabled:bg-[#CE6A6B]/50 disabled:text-white/50 py-3 text-lg font-semibold border-0"
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Connexion...</span>
                      </div>
                    ) : (
                      "Se connecter"
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Onglet Inscription */}
              <TabsContent value="register" className="mt-6">
                <CardDescription className="text-white/70 mb-6">
                  Créez votre compte pour accéder à la collection
                </CardDescription>
                
                <form onSubmit={handleRegister} className="space-y-6">
                  {error && (
                    <div className="bg-[#CE6A6B]/20 border border-[#CE6A6B]/30 text-[#CE6A6B] px-4 py-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="bg-[#BED3C3]/20 border border-[#BED3C3]/30 text-[#BED3C3] px-4 py-3 rounded-lg text-sm">
                      {success}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="register-username" className="text-white font-medium">
                      Nom d'utilisateur
                    </Label>
                    <Input
                      id="register-username"
                      type="text"
                      value={registerData.username}
                      onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#EBACA2] focus:ring-[#EBACA2]/20"
                      placeholder="Choisissez un nom d'utilisateur"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="text-white font-medium">
                      Mot de passe
                    </Label>
                    <Input
                      id="register-password"
                      type="password"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#EBACA2] focus:ring-[#EBACA2]/20"
                      placeholder="Choisissez un mot de passe (min. 6 caractères)"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-white font-medium">
                      Confirmer le mot de passe
                    </Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#EBACA2] focus:ring-[#EBACA2]/20"
                      placeholder="Confirmez votre mot de passe"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#4A919E] hover:bg-[#3A7A8A] disabled:bg-[#4A919E]/50 disabled:text-white/50 py-3 text-lg font-semibold border-0"
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Création...</span>
                      </div>
                    ) : (
                      "Créer mon compte"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>

        {/* Retour à l'accueil */}
        <div className="text-center mt-6">
          <Button
            variant="ghost"
            className="text-white/70 hover:text-white hover:bg-white/10"
            onClick={() => router.push("/")}
          >
            ← Retour à l'accueil
          </Button>
        </div>
      </div>
    </div>
  );
} 
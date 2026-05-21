"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function LoginPageContent() {
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté
    getSession().then((session) => {
      if (session) {
        router.replace(callbackUrl);
      }
    });
  }, [callbackUrl, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        username: loginData.username,
        password: loginData.password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError("Nom d'utilisateur ou mot de passe incorrect");
      } else {
        router.push(result?.url ?? callbackUrl);
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

        <Card className="manga-card glass-effect border-white/20">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-white text-2xl mb-4">Connexion</CardTitle>
            <CardDescription className="text-white/70 mb-6">
              Connectez-vous à votre compte existant.
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

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageContent />
    </Suspense>
  );
} 
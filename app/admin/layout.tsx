"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

import { signOut } from "next-auth/react";
import { ArrowLeft, Settings, Users, BookOpen, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && !session?.user?.isadmin) {
      router.push("/dashboard");
    }
  }, [status, session, router]);

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

  if (!session || !session.user?.isadmin) {
    return null;
  }

  const handleSignOut = async () => {
    try {
      if (!session) {
        router.push("/login");
        return;
      }
      
      await signOut({ 
        callbackUrl: "/login",
        redirect: true 
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Erreur lors de la déconnexion:', error);
      }
      // Continue même en cas d'erreur
    }
  };

  const navigationItems = [
    {
      href: "/admin/add-manga",
      label: "Ajouter un Manga",
      icon: Plus,
      description: "Créer un nouveau manga ou ajouter des tomes"
    },
    {
      href: "/admin/mangas",
      label: "Gérer les Mangas",
      icon: BookOpen,
      description: "Modifier, supprimer et organiser les mangas"
    },
    {
      href: "/admin/tomes",
      label: "Gestion des Tomes",
      icon: BookOpen,
      description: "Modifier, supprimer et organiser les tomes"
    },
    {
      href: "/admin/users",
      label: "Utilisateurs",
      icon: Users,
      description: "Gérer les comptes utilisateurs"
    }
  ];

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
                  <h1 className="text-2xl font-bold text-white">Administration Yomimono</h1>
                  <p className="text-white/70 text-sm">Gestion de la collection</p>
                </div>
              </div>
            </div>

            <Button 
              className="bg-[#CE6A6B] hover:bg-[#B55A5B] text-white border-0"
              onClick={handleSignOut}
            >
              Se déconnecter
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white/5 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4 py-2">
          <div className="flex space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={`
                      ${isActive 
                        ? 'bg-[#CE6A6B] text-white font-bold shadow-lg hover:bg-[#B55A5B]' 
                        : 'text-white/80 hover:text-white hover:bg-white/10'}
                      transition-colors
                    `}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
} 
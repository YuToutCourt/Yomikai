"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, BookOpen, Star, Plus, Euro, Filter, SortAsc } from "lucide-react";
import { toast } from "sonner";

// Types pour les données
interface Manga {
  id: number;
  title: string;
  status: string;
  description?: string;
  author?: string;
  genre?: string;
  coverImage?: string;
  tomes: Tome[];
}

interface Tome {
  id: number;
  numero: number;
  prix: string | number;
  editeur: string;
  coverImage?: string;
  mangaId: number;
  isRead?: boolean;
  rating?: number;
  globalRating?: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedManga, setSelectedManga] = useState<Manga | null>(null);
  const [mangas, setMangas] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadingActions, setLoadingActions] = useState<{[key: string]: boolean}>({});
  
  // États des filtres
  const [sortBy, setSortBy] = useState<string>("title"); // title, rating, tomesCount, price
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [filterStatus, setFilterStatus] = useState<string>("all"); // all, complete, incomplete, other
  const [filterRead, setFilterRead] = useState<string>("all"); // all, read, unread, partial
  const [filterRating, setFilterRating] = useState<string>("all"); // all, rated, unrated, high (>=7), low (<7)
  const [randomManga, setRandomManga] = useState<Manga | null>(null);
  const mangaRefs = useRef<{[key: number]: HTMLDivElement | null}>({});

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Récupérer les mangas depuis la base de données
  useEffect(() => {
    if (status === "authenticated") {
      fetchMangas();
    }
  }, [status]);

  const fetchMangas = async () => {
    try {
      setLoading(true);
      setError("");
      
      const response = await fetch("/api/mangas");
      const data = await response.json();

      if (response.ok) {
        // Transformer les données pour correspondre à l'interface
        const transformedMangas = data.data.map((manga: any) => ({
          ...manga,
          tomes: manga.tomes.map((tome: any) => ({
            ...tome,
            prix: parseFloat(tome.prix), // Convertir le Decimal en number
            isRead: tome.isRead || false, // Utiliser les données de l'API
            rating: tome.rating || undefined, // Utiliser les données de l'API
            globalRating: tome.globalRating || undefined // Utiliser les données de l'API
          }))
        }));
        
        setMangas(transformedMangas);
      } else {
        setError("Erreur lors du chargement des mangas");
        if (process.env.NODE_ENV === 'development') {
          console.error("Erreur API:", data.error);
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Erreur fetch:", error);
      }
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  // Calculer le prix total d'un manga
  const getMangaTotalPrice = (manga: Manga) => {
    return manga.tomes.reduce((total, tome) => total + (typeof tome.prix === 'string' ? parseFloat(tome.prix) : tome.prix), 0);
  };

  const getMangaAverageRating = (manga: Manga) => {
    const ratedTomes = manga.tomes.filter(tome => tome.rating && tome.rating > 0);
    if (ratedTomes.length === 0) return 0;
    
    const totalRating = ratedTomes.reduce((sum, tome) => sum + (tome.rating || 0), 0);
    return totalRating / ratedTomes.length;
  };

  // Calculer la note globale moyenne d'un manga (tous les utilisateurs)
  const getMangaGlobalAverageRating = (manga: Manga) => {
    const ratedTomes = manga.tomes.filter(tome => tome.globalRating && tome.globalRating > 0);
    if (ratedTomes.length === 0) return 0;
    
    const totalRating = ratedTomes.reduce((sum, tome) => sum + (tome.globalRating || 0), 0);
    return totalRating / ratedTomes.length;
  };

  // Calculer le nombre de notes globales pour un manga
  const getMangaGlobalRatingCount = (manga: Manga) => {
    return manga.tomes.filter(tome => tome.globalRating && tome.globalRating > 0).length;
  };

  // Fonction pour déterminer le statut de lecture d'un manga
  const getReadStatus = (manga: Manga) => {
    if (manga.tomes.length === 0) return "unread";
    const readTomes = manga.tomes.filter(tome => tome.isRead).length;
    if (readTomes === 0) return "unread";
    if (readTomes === manga.tomes.length) return "read";
    return "partial";
  };

  // Fonction pour déterminer si un manga a des notes
  const getMangaRatingStatus = (manga: Manga) => {
    const ratedTomes = manga.tomes.filter(tome => tome.rating && tome.rating > 0);
    if (ratedTomes.length === 0) return "unrated";
    const avgRating = getMangaAverageRating(manga);
    return avgRating >= 7 ? "high" : "low";
  };

  // Logique de filtrage et tri
  const filteredAndSortedMangas = mangas
    .filter(manga => {
      // Filtre par recherche textuelle
      const matchesSearch = manga.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        manga.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        manga.genre?.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;

      // Filtre par statut
      if (filterStatus !== "all") {
        const statusMatch = filterStatus === "complete" ? manga.status === "Collection complète" :
                           filterStatus === "incomplete" ? manga.status === "Collection incomplète" :
                           filterStatus === "other" ? !["Collection complète", "Collection incomplète"].includes(manga.status) :
                           true;
        if (!statusMatch) return false;
      }

      // Filtre par statut de lecture
      if (filterRead !== "all") {
        const readStatus = getReadStatus(manga);
        if (filterRead !== readStatus) return false;
      }

      // Filtre par notation
      if (filterRating !== "all") {
        const ratingStatus = getMangaRatingStatus(manga);
        if (filterRating === "rated" && ratingStatus === "unrated") return false;
        if (filterRating === "unrated" && ratingStatus !== "unrated") return false;
        if (filterRating === "high" && ratingStatus !== "high") return false;
        if (filterRating === "low" && ratingStatus !== "low") return false;
      }

      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "rating":
          const ratingA = getMangaAverageRating(a);
          const ratingB = getMangaAverageRating(b);
          comparison = ratingB - ratingA; // Par défaut décroissant pour les notes
          break;
        case "tomesCount":
          comparison = b.tomes.length - a.tomes.length; // Par défaut décroissant pour le nombre de tomes
          break;
        case "price":
          comparison = getMangaTotalPrice(b) - getMangaTotalPrice(a); // Par défaut décroissant pour le prix
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === "desc" ? -comparison : comparison;
    });

  // Fonction pour obtenir un manga aléatoire non lu ou partiellement lu
  const getRandomUnreadManga = () => {
    const unreadOrPartialMangas = mangas.filter(manga => {
      const readStatus = getReadStatus(manga);
      return readStatus === "unread" || readStatus === "partial";
    });

    if (unreadOrPartialMangas.length === 0) {
      toast.error("Félicitations ! 🎉", {
        description: "Vous avez lu tous vos mangas ! Il est temps d'en ajouter de nouveaux.",
        icon: "🌸",
      });
      return;
    }

    const randomIndex = Math.floor(Math.random() * unreadOrPartialMangas.length);
    const selectedManga = unreadOrPartialMangas[randomIndex];
    
    setRandomManga(selectedManga);
    toast.success("Manga suggéré ! 📖", {
      description: `Que diriez-vous de lire "${selectedManga.title}" ?`,
      icon: "🎲",
    });

    // Scroll vers le manga suggéré avec une animation améliorée
    setTimeout(() => {
      const mangaElement = mangaRefs.current[selectedManga.id];

      if (mangaElement) {
        // Scroll smooth vers le manga
        mangaElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
        
        // Ajouter une animation de flash pour attirer l'attention
        mangaElement.classList.add('manga-selected');
        
        // Retirer la classe d'animation après 5 secondes
        setTimeout(() => {
          mangaElement.classList.remove('manga-selected');
        }, 5000);
      } else {
        // Fallback si l'élément n'est pas trouvé
        console.log("Élément manga non trouvé, tentative de scroll avec querySelector");
        const mangaCard = document.querySelector(`[data-manga-id="${selectedManga.id}"]`);
        console.log("Élément trouvé avec querySelector:", mangaCard);
        if (mangaCard) {
          mangaCard.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
          mangaCard.classList.add('manga-selected');
          setTimeout(() => {
            mangaCard.classList.remove('manga-selected');
          }, 5000);
        } else {
          console.log("Aucun élément trouvé pour le scroll");
        }
      }
    }, 500); // Augmenté le délai pour s'assurer que le DOM est mis à jour
  };

  // Calculer le prix total de toute la collection
  const getCollectionTotalPrice = () => {
    return mangas.reduce((total, manga) => total + getMangaTotalPrice(manga), 0);
  };

  // Calculer le prix total des mangas lus
  const getReadMangasTotalPrice = () => {
    return mangas.reduce((total, manga) => {
      const readTomes = manga.tomes.filter(tome => tome.isRead);
      return total + readTomes.reduce((tomeTotal, tome) => tomeTotal + (typeof tome.prix === 'string' ? parseFloat(tome.prix) : tome.prix), 0);
    }, 0);
  };

  // Calculer le nombre total de tomes dans la collection
  const getTotalTomes = () => {
    return mangas.reduce((total, manga) => total + manga.tomes.length, 0);
  };

  // Calculer le nombre de tomes lus
  const getReadTomes = () => {
    return mangas.reduce((total, manga) => {
      return total + manga.tomes.filter(tome => tome.isRead).length;
    }, 0);
  };

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
      setError("Erreur lors de la déconnexion. Veuillez réessayer.");
    }
  };

  const handleTomeToggle = async (mangaId: number, tomeId: number) => {
    const actionKey = `tome-${tomeId}`;
    
    try {
      setLoadingActions(prev => ({ ...prev, [actionKey]: true }));
      
      // Trouver le tome actuel pour obtenir son état de lecture
      const currentManga = mangas.find(m => m.id === mangaId);
      const currentTome = currentManga?.tomes.find(t => t.id === tomeId);
      const newIsRead = !currentTome?.isRead;

      // Mettre à jour l'état local immédiatement pour un feedback instantané
      setMangas(prev => prev.map(manga => {
        if (manga.id === mangaId) {
          return {
            ...manga,
            tomes: manga.tomes.map(tome => 
              tome.id === tomeId 
                ? { ...tome, isRead: newIsRead }
                : tome
            )
          };
        }
        return manga;
      }));

      // Envoyer la requête à l'API
      const response = await fetch("/api/readings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tomeId,
          isRead: newIsRead
        }),
      });

      if (!response.ok) {
        if (process.env.NODE_ENV === 'development') {
          console.error("Erreur lors de la mise à jour du statut de lecture");
        }
        // Si la requête échoue, remettre l'état précédent
        setMangas(prev => prev.map(manga => {
          if (manga.id === mangaId) {
            return {
              ...manga,
              tomes: manga.tomes.map(tome => 
                tome.id === tomeId 
                  ? { ...tome, isRead: !newIsRead }
                  : tome
              )
            };
          }
          return manga;
        }));
        toast.error("Erreur lors de la mise à jour du statut de lecture", {
          description: "Impossible de sauvegarder le changement.",
        });
      } else {
        toast.success(newIsRead ? "Tome marqué comme lu !" : "Tome marqué comme non lu", {
          description: newIsRead ? "Ce tome a été ajouté à votre liste de lecture." : "Ce tome a été retiré de votre liste de lecture.",
          icon: newIsRead ? "✅" : "📖",
        });
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Erreur lors de la mise à jour du statut de lecture:", error);
      }
      // En cas d'erreur, remettre l'état précédent
      setMangas(prev => prev.map(manga => {
        if (manga.id === mangaId) {
          return {
            ...manga,
            tomes: manga.tomes.map(tome => 
              tome.id === tomeId 
                ? { ...tome, isRead: !mangas.find(m => m.id === mangaId)?.tomes.find(t => t.id === tomeId)?.isRead }
                : tome
            )
          };
        }
        return manga;
      }));
      toast.error("Erreur lors de la mise à jour du statut de lecture", {
        description: "Impossible de sauvegarder le changement.",
      });
    } finally {
      setLoadingActions(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  const handleRatingChange = async (mangaId: number, tomeId: number, rating: number) => {
    const actionKey = `rating-${tomeId}`;
    
    // Vérifier que l'utilisateur est connecté
    if (!session?.user?.id) {
      toast.error("Erreur d'authentification", {
        description: "Veuillez vous reconnecter.",
      });
      return;
    }
    
    try {
      setLoadingActions(prev => ({ ...prev, [actionKey]: true }));
      
      // Mettre à jour l'état local immédiatement pour un feedback instantané
      setMangas(prev => prev.map(manga => {
        if (manga.id === mangaId) {
          return {
            ...manga,
            tomes: manga.tomes.map(tome => 
              tome.id === tomeId 
                ? { ...tome, rating }
                : tome
            )
          };
        }
        return manga;
      }));

      // Envoyer la requête à l'API
      const response = await fetch("/api/readings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tomeId,
          rating
        }),
      });

      if (!response.ok) {
        // Récupérer le message d'erreur de l'API
        let errorMessage = "Impossible de sauvegarder la note.";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // Si on ne peut pas parser la réponse, utiliser le message par défaut
        }
        
        if (process.env.NODE_ENV === 'development') {
          console.error("Erreur lors de la mise à jour de la note:", {
            status: response.status,
            statusText: response.statusText,
            message: errorMessage
          });
        }
        // Si la requête échoue, remettre l'état précédent
        setMangas(prev => prev.map(manga => {
          if (manga.id === mangaId) {
            return {
              ...manga,
              tomes: manga.tomes.map(tome => 
                tome.id === tomeId 
                  ? { ...tome, rating: undefined }
                  : tome
              )
            };
          }
          return manga;
        }));
        
        toast.error("Erreur lors de la mise à jour de la note", {
          description: errorMessage,
        });
      } else {
        toast.success(`Note ${rating}/10 enregistrée !`, {
          description: "Votre évaluation a été sauvegardée.",
          icon: "⭐",
        });
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Erreur lors de la mise à jour de la note:", error);
      }
      // En cas d'erreur, remettre l'état précédent
      setMangas(prev => prev.map(manga => {
        if (manga.id === mangaId) {
          return {
            ...manga,
            tomes: manga.tomes.map(tome => 
              tome.id === tomeId 
                ? { ...tome, rating: undefined }
                : tome
            )
          };
        }
        return manga;
      }));
      toast.error("Erreur lors de la mise à jour de la note", {
        description: "Impossible de sauvegarder la note.",
      });
    } finally {
      setLoadingActions(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  // Mettre à jour selectedManga quand mangas change
  useEffect(() => {
    if (selectedManga) {
      const updatedManga = mangas.find(m => m.id === selectedManga.id);
      if (updatedManga) {
        setSelectedManga(updatedManga);
      }
    }
  }, [mangas, selectedManga]);

  if (status === "loading" || loading) {
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
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#CE6A6B] to-[#EBACA2] rounded-full flex items-center justify-center">
                <span className="text-white text-lg">🌸</span>
              </div>
              <h1 className="text-2xl font-bold text-white">Yomimono</h1>
            </div>

            <div className="flex items-center space-x-4">
              {session.user?.isadmin && (
                <Button 
                  className="bg-[#CE6A6B] hover:bg-[#B55A5B] text-white border-0"
                  onClick={() => router.push("/admin/add-manga")}
                >
                  Page Admin
                </Button>
              )}
              
              <Button 
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
                onClick={() => router.push("/profile")}
              >
                Mon Profil
              </Button>
              
              <Button 
                className="bg-[#CE6A6B] hover:bg-[#B55A5B] text-white border-0"
                onClick={handleSignOut}
              >
                Se déconnecter
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Message d'erreur */}
        {error && (
          <div className="mb-6 p-4 bg-[#CE6A6B]/20 border border-[#CE6A6B]/30 text-[#CE6A6B] rounded-lg">
            <p className="text-sm">{error}</p>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={fetchMangas}
              className="mt-2 text-[#CE6A6B] hover:bg-[#CE6A6B]/10"
            >
              Réessayer
            </Button>
          </div>
        )}

        {/* Statistiques de la collection */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm">Collection totale</p>
                    <p className="text-2xl font-bold text-white">{getCollectionTotalPrice().toFixed(2)}€</p>
                  </div>
                  <div className="w-12 h-12 bg-[#CE6A6B]/20 rounded-full flex items-center justify-center">
                    <Euro className="w-6 h-6 text-[#CE6A6B]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm">Total mangas</p>
                    <p className="text-2xl font-bold text-white">{mangas.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-[#4A919E]/20 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🌸</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm">Total tomes</p>
                    <p className="text-2xl font-bold text-white">{getTotalTomes()}</p>
                  </div>
                  <div className="w-12 h-12 bg-[#BED3C3]/20 rounded-full flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-[#BED3C3]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm">Tomes lus</p>
                    <p className="text-2xl font-bold text-white">{getReadTomes()}</p>
                    <p className="text-white/40 text-xs">
                      {getTotalTomes() > 0 ? `${((getReadTomes() / getTotalTomes()) * 100).toFixed(1)}%` : '0%'}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                    <span className="text-2xl">✅</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Search Bar et Bouton Aléatoire */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
              <Input
                placeholder="Rechercher un manga, auteur ou genre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#EBACA2] focus:ring-[#EBACA2]/20"
              />
            </div>
            <Button
              variant="outline"
              onClick={getRandomUnreadManga}
              className="border-purple-400/50 text-purple-300 hover:bg-purple-400/10 hover:border-purple-300 flex items-center space-x-2 whitespace-nowrap transition-colors"
            >
              <span>🎲</span>
              <span>Manga aléatoire</span>
            </Button>
          </div>
        </div>

        {/* Filtres et Tri */}
        <div className="mb-6">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Filter className="w-4 h-4 text-white/70" />
              <h3 className="text-sm font-medium text-white/70">Filtres et tri</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSortBy("title");
                  setSortOrder("asc");
                  setFilterStatus("all");
                  setFilterRead("all");
                  setFilterRating("all");
                  setSearchTerm("");
                  setRandomManga(null);
                }}
                className="ml-auto text-white/50 hover:text-white hover:bg-white/10 text-xs px-2 py-1 h-auto"
              >
                Réinitialiser
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {/* Tri */}
              <div className="space-y-1">
                <label className="text-white/60 text-xs">Trier par</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="title">Titre</SelectItem>
                    <SelectItem value="rating">Note</SelectItem>
                    <SelectItem value="tomesCount">Tomes</SelectItem>
                    <SelectItem value="price">Prix</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Ordre de tri */}
              <div className="space-y-1">
                <label className="text-white/60 text-xs">Ordre</label>
                <Select value={sortOrder} onValueChange={(value: "asc" | "desc") => setSortOrder(value)}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">↑ Croissant</SelectItem>
                    <SelectItem value="desc">↓ Décroissant</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtre par statut */}
              <div className="space-y-1">
                <label className="text-white/60 text-xs">Statut</label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="complete">Complet</SelectItem>
                    <SelectItem value="incomplete">Incomplet</SelectItem>
                    <SelectItem value="other">Autres</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtre par lecture */}
              <div className="space-y-1">
                <label className="text-white/60 text-xs">Lecture</label>
                <Select value={filterRead} onValueChange={setFilterRead}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="read">Lu</SelectItem>
                    <SelectItem value="partial">En cours</SelectItem>
                    <SelectItem value="unread">Non lu</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtre par note */}
              <div className="space-y-1">
                <label className="text-white/60 text-xs">Notes</label>
                <Select value={filterRating} onValueChange={setFilterRating}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="high">≥7/10</SelectItem>
                    <SelectItem value="low">&lt;7/10</SelectItem>
                    <SelectItem value="rated">Notés</SelectItem>
                    <SelectItem value="unrated">Non notés</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Résultats */}
        <div className="mb-6 flex justify-between items-center">
          <p className="text-white/70 text-sm">
            {filteredAndSortedMangas.length} manga{filteredAndSortedMangas.length !== 1 ? 's' : ''} trouvé{filteredAndSortedMangas.length !== 1 ? 's' : ''}
            {mangas.length > 0 && ` sur ${mangas.length} au total`}
          </p>
        </div>

        {/* Manga Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {filteredAndSortedMangas.map((manga) => (
            <Card 
              key={manga.id}
              data-manga-id={manga.id}
              ref={(el) => {
                if (el) {
                  mangaRefs.current[manga.id] = el;
                }
              }}
              className={`manga-card backdrop-blur-md hover:scale-105 transition-all cursor-pointer ${
                randomManga && randomManga.id === manga.id 
                  ? "manga-selected" 
                  : "bg-white/10 border-white/20"
              }`}
              onClick={() => setSelectedManga(manga)}
            >
              <CardHeader className="text-center pb-2 relative">
                {/* Indicateurs de statut de lecture */}
                <div className="absolute top-2 right-2 z-10 flex flex-col space-y-1">
                  {randomManga && randomManga.id === manga.id && (
                    <span className="inline-flex items-center px-3 py-1 bg-[#CE6A6B] text-white text-xs font-bold rounded-full shadow-lg animate-pulse border-2 border-white/20">
                      <span className="mr-1">🎲</span> Suggéré !
                    </span>
                  )}
                  {manga.tomes.length > 0 && manga.tomes.every(t => t.isRead) && (
                    <span className="inline-flex items-center px-2 py-1 bg-green-500/90 text-white text-xs font-bold rounded-full shadow-lg">
                      <span className="mr-1">✅</span> Tout lu
                    </span>
                  )}
                  {manga.tomes.length > 0 && manga.tomes.some(t => t.isRead) && !manga.tomes.every(t => t.isRead) && (
                    <span className="inline-flex items-center px-2 py-1 bg-yellow-500/90 text-white text-xs font-bold rounded-full shadow-lg">
                      <span className="mr-1">📖</span> En cours
                    </span>
                  )}
                </div>
                <div className="w-full h-64 bg-gradient-to-br from-[#CE6A6B] to-[#EBACA2] rounded-lg mb-4 flex items-center justify-center overflow-hidden relative">
                  {manga.coverImage ? (
                    <img 
                      src={manga.coverImage} 
                      alt={manga.title}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <BookOpen className={`w-16 h-16 text-white/50 ${manga.coverImage ? 'hidden' : ''}`} />
                </div>
                <CardTitle className="text-white text-lg">{manga.title}</CardTitle>
                <CardDescription className="text-white/70">
                  {manga.author}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="flex justify-center space-x-2 mb-2">
                  <Badge
                    variant="secondary"
                    className={
                      manga.status === 'Collection complète'
                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : manga.status === 'Collection incomplète'
                          ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                          : "bg-[#BED3C3]/20 text-white border-[#BED3C3]/30"
                    }
                  >
                    {manga.status}
                  </Badge>
                  <Badge variant="secondary" className="bg-[#4A919E]/20 text-white border-[#4A919E]/30">
                    {manga.tomes.length} tomes
                  </Badge>
                </div>
                <div className="flex items-center justify-center space-x-1 mb-2">
                  <Euro className="w-4 h-4 text-[#CE6A6B]" />
                  <span className="text-[#CE6A6B] font-semibold">
                    {getMangaTotalPrice(manga).toFixed(2)}€
                  </span>
                </div>
                {/* Score moyen du manga */}
                {getMangaAverageRating(manga) > 0 && (
                  <div className="flex items-center justify-center space-x-1 mb-2">
                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                    <span className="text-white/80 text-sm">
                      {getMangaAverageRating(manga).toFixed(1)}/10
                    </span>
                  </div>
                )}
                {/* Note globale du manga */}
                {getMangaGlobalAverageRating(manga) > 0 && (
                  <div className="flex items-center justify-center space-x-1 mb-2">
                    <Star className="w-3 h-3 text-blue-400 fill-current" />
                    <span className="text-white/60 text-xs">
                      {getMangaGlobalAverageRating(manga).toFixed(1)}/10
                    </span>
                  </div>
                )}
                <p className="text-white/60 text-sm line-clamp-2">
                  {manga.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredAndSortedMangas.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🌸</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {searchTerm || filterStatus !== "all" || filterRead !== "all" || filterRating !== "all" 
                ? "Aucun manga trouvé" 
                : "Aucun manga dans la collection"
              }
            </h3>
            <p className="text-white/60">
              {searchTerm || filterStatus !== "all" || filterRead !== "all" || filterRating !== "all"
                ? "Essayez de modifier vos critères de recherche ou filtres"
                : "La collection sera bientôt disponible !"
              }
            </p>
          </div>
        )}
      </main>

      {/* Manga Detail Modal */}
      {selectedManga && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-md rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-white mb-2">{selectedManga.title}</h2>
                  <p className="text-white/70 mb-1">Par {selectedManga.author}</p>
                  <p className="text-white/60 text-sm mb-2">{selectedManga.genre}</p>
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="flex items-center space-x-1">
                      <Euro className="w-5 h-5 text-[#CE6A6B]" />
                      <span className="text-[#CE6A6B] font-bold text-lg">
                        {getMangaTotalPrice(selectedManga).toFixed(2)}€
                      </span>
                    </div>
                    <Badge variant="secondary" className="bg-[#4A919E]/20 text-white border-[#4A919E]/30">
                      {selectedManga.tomes.length} tomes
                    </Badge>
                    {/* Score moyen du manga */}
                    {getMangaAverageRating(selectedManga) > 0 && (
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-white font-medium">
                          {getMangaAverageRating(selectedManga).toFixed(1)}/10
                        </span>
                      </div>
                    )}
                    {/* Note globale du manga */}
                    {getMangaGlobalAverageRating(selectedManga) > 0 && (
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-blue-400 fill-current" />
                        <span className="text-white/80 text-sm">
                          {getMangaGlobalAverageRating(selectedManga).toFixed(1)}/10
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  className="text-white hover:bg-white/10"
                  onClick={() => setSelectedManga(null)}
                >
                  ✕
                </Button>
              </div>

              <p className="text-white/80 mb-6">{selectedManga.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {selectedManga.tomes.map((tome) => (
                  <Card key={tome.id} className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
                    <CardContent className="p-4">
                      {/* Image de couverture du tome */}
                      <div className="w-full h-56 bg-gradient-to-br from-[#CE6A6B] to-[#EBACA2] rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                        {tome.coverImage ? (
                          <img 
                            src={tome.coverImage} 
                            alt={`Tome ${tome.numero} - ${selectedManga.title}`}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <BookOpen className={`w-12 h-12 text-white/50 ${tome.coverImage ? 'hidden' : ''}`} />
                      </div>

                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-white">Tome {tome.numero}</h4>
                        <div className="flex space-x-1">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => {
                            const isRatingLoading = loadingActions[`rating-${tome.id}`];
                            return (
                              <button
                                key={star}
                                onClick={() => handleRatingChange(selectedManga.id, tome.id, star)}
                                disabled={isRatingLoading}
                                className={`text-lg hover:scale-110 transition-transform ${
                                  isRatingLoading ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                              >
                                <Star 
                                  className={`w-3 h-3 ${
                                    tome.rating && star <= tome.rating 
                                      ? 'text-yellow-400 fill-current' 
                                      : 'text-white/30 hover:text-yellow-400/50'
                                  }`}
                                />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      
                      <p className="text-white/60 text-sm mb-3">{tome.editeur} - {tome.prix}€</p>

                      {/* Note globale affichée */}
                      {tome.globalRating && (
                        <div className="flex flex-wrap items-center mb-3 break-all">
                          <span className="text-white/70 text-sm min-w-[70px]">Moyenne:</span>
                          <div className="flex space-x-0.5 flex-shrink-0">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                              <Star 
                                key={star}
                                className={`w-5 h-5 ${
                                  star <= tome.globalRating! 
                                    ? 'text-blue-400 fill-current' 
                                    : 'text-white/20'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      <Button
                        variant={tome.isRead ? "default" : "outline"}
                        size="sm"
                        disabled={loadingActions[`tome-${tome.id}`]}
                        className={`w-full ${
                          tome.isRead 
                            ? 'bg-[#BED3C3] text-[#212E53] hover:bg-[#A8C3B3]' 
                            : 'border-white/30 text-white hover:bg-white/10'
                        } ${
                          loadingActions[`tome-${tome.id}`] ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        onClick={() => handleTomeToggle(selectedManga.id, tome.id)}
                      >
                        {loadingActions[`tome-${tome.id}`] ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                            <span>Sauvegarde...</span>
                          </div>
                        ) : (
                          tome.isRead ? '✓ Lu' : 'Marquer comme lu'
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
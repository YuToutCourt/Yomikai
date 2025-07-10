"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Plus, ArrowLeft } from "lucide-react";
import ImageUpload from "@/components/admin/ImageUpload";
import { toast } from "sonner";

interface Manga {
  id: number;
  title: string;
  author?: string;
  genre?: string;
  coverImage?: string;
  tomes: Tome[];
}

interface Tome {
  id: number;
  numero: number;
  prix: string;
  editeur: string;
  coverImage?: string;
}

export default function AddMangaPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("manga");
  const [loading, setLoading] = useState(false);
  const [mangas, setMangas] = useState<Manga[]>([]);
  const [selectedMangaId, setSelectedMangaId] = useState<string>("");

  // État pour nouveau manga
  const [mangaData, setMangaData] = useState({
    title: "",
    author: "",
    genre: "",
    description: "",
    status: "En cours",
    coverImage: ""
  });

  // État pour nouveau tome
  const [tomeData, setTomeData] = useState({
    numero: "",
    prix: "",
    editeur: "",
    coverImage: ""
  });

  // Charger les mangas existants
  useEffect(() => {
    fetchMangas();
  }, []);

  const fetchMangas = async () => {
    try {
      const response = await fetch("/api/mangas");
      const data = await response.json();
      
      if (response.ok) {
        setMangas(data.data);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Erreur lors du chargement des mangas:", error);
      }
      toast.error("Erreur lors du chargement des mangas", {
        description: "Une erreur inattendue s'est produite.",
      });
    }
  };

  const handleMangaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", mangaData.title);
      formData.append("author", mangaData.author);
      formData.append("genre", mangaData.genre);
      formData.append("description", mangaData.description);
      formData.append("status", mangaData.status);
      if (mangaData.coverImage) {
        formData.append("coverImage", mangaData.coverImage);
      }

      const response = await fetch("/api/admin/mangas", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();

        
        // Recharger la liste des mangas
        await fetchMangas();
        
        // Réinitialiser le formulaire
        setMangaData({
          title: "",
          author: "",
          genre: "",
          description: "",
          status: "En cours",
          coverImage: ""
        });
        
        // Passer à l'onglet des tomes
        setActiveTab("tome");
        setSelectedMangaId(result.data.id.toString());
        
        toast.success("Manga ajouté avec succès ! Vous pouvez maintenant ajouter des tomes.", {
          description: `"${mangaData.title}" a été créé avec succès.`,
          icon: "🌸",
        });
      } else {
        const error = await response.json();
        toast.error("Erreur lors de l'ajout du manga", {
          description: error.error,
        });
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Erreur lors de l'ajout du manga:", error);
      }
      toast.error("Erreur lors de l'ajout du manga", {
        description: "Une erreur inattendue s'est produite.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTomeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMangaId) {
      toast.error("Veuillez sélectionner un manga");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("mangaId", selectedMangaId);
      formData.append("numero", tomeData.numero);
      formData.append("prix", tomeData.prix);
      formData.append("editeur", tomeData.editeur);
      if (tomeData.coverImage) {
        formData.append("coverImage", tomeData.coverImage);
      }

      const response = await fetch("/api/admin/tomes", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();

        
        // Réinitialiser le formulaire du tome
        setTomeData({
          numero: "",
          prix: "",
          editeur: "",
          coverImage: ""
        });
        
        toast.success("Tome ajouté avec succès !", {
          description: `Tome ${tomeData.numero} ajouté à la collection.`,
          icon: "📚",
        });
      } else {
        const error = await response.json();
        toast.error("Erreur lors de l'ajout du tome", {
          description: error.error,
        });
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Erreur lors de l'ajout du tome:", error);
      }
      toast.error("Erreur lors de l'ajout du tome", {
        description: "Une erreur inattendue s'est produite.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#212E53] to-[#4A919E] p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Button
            variant="ghost"
            className="text-white hover:bg-white/10"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">Administration</h1>
            <p className="text-white/70">Gérer votre collection de mangas</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/10 backdrop-blur-md">
            <TabsTrigger value="manga" className="text-white data-[state=active]:bg-[#CE6A6B]">
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Manga
            </TabsTrigger>
            <TabsTrigger value="tome" className="text-white data-[state=active]:bg-[#CE6A6B]">
              <BookOpen className="w-4 h-4 mr-2" />
              Ajouter un Tome
            </TabsTrigger>
          </TabsList>

          {/* Tab Nouveau Manga */}
          <TabsContent value="manga" className="mt-6">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Ajouter un nouveau manga</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleMangaSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-white">Titre *</Label>
                      <Input
                        id="title"
                        value={mangaData.title}
                        onChange={(e) => setMangaData({...mangaData, title: e.target.value})}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        placeholder="Titre du manga"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="author" className="text-white">Auteur</Label>
                      <Input
                        id="author"
                        value={mangaData.author}
                        onChange={(e) => setMangaData({...mangaData, author: e.target.value})}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        placeholder="Nom de l'auteur"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="genre" className="text-white">Genre</Label>
                      <Input
                        id="genre"
                        value={mangaData.genre}
                        onChange={(e) => setMangaData({...mangaData, genre: e.target.value})}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        placeholder="Action, Romance, etc."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status" className="text-white">Statut</Label>
                      <Select 
                        value={mangaData.status} 
                        onValueChange={(value) => setMangaData({...mangaData, status: value})}
                      >
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Collection complète">Collection complète</SelectItem>
                          <SelectItem value="Collection incomplète">Collection incomplète</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-white">Description</Label>
                    <Textarea
                      id="description"
                      value={mangaData.description}
                      onChange={(e) => setMangaData({...mangaData, description: e.target.value})}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 min-h-[100px]"
                      placeholder="Description du manga..."
                    />
                  </div>

                  <div className="space-y-2">
                    <ImageUpload
                      onImageUpload={(imageUrl) => setMangaData({...mangaData, coverImage: imageUrl})}
                      uploadType="cover"
                      className="bg-white/10 border-white/20"
                      label="Image de couverture"
                      placeholder="URL de l'image ou upload"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-[#CE6A6B] hover:bg-[#B55A5B] text-white"
                  >
                    {loading ? "Ajout en cours..." : "Ajouter le manga"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Ajouter un Tome */}
          <TabsContent value="tome" className="mt-6">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Ajouter un tome à un manga existant</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTomeSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="manga-select" className="text-white">Sélectionner un manga *</Label>
                    <Select value={selectedMangaId} onValueChange={setSelectedMangaId}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="Choisissez un manga..." />
                      </SelectTrigger>
                      <SelectContent>
                        {mangas.map((manga) => (
                          <SelectItem key={manga.id} value={manga.id.toString()}>
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-[#CE6A6B] to-[#EBACA2] rounded overflow-hidden">
                                {manga.coverImage ? (
                                  <img 
                                    src={manga.coverImage} 
                                    alt={manga.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <BookOpen className="w-full h-full p-1 text-white" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">{manga.title}</div>
                                {manga.author && (
                                  <div className="text-xs text-muted-foreground truncate">
                                    {manga.author}
                                  </div>
                                )}
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                {manga.tomes.length} tomes
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator className="bg-white/20" />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="numero" className="text-white">Numéro du tome *</Label>
                      <Input
                        id="numero"
                        type="number"
                        value={tomeData.numero}
                        onChange={(e) => setTomeData({...tomeData, numero: e.target.value})}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        placeholder="1"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="prix" className="text-white">Prix *</Label>
                      <Input
                        id="prix"
                        type="number"
                        step="0.01"
                        value={tomeData.prix}
                        onChange={(e) => setTomeData({...tomeData, prix: e.target.value})}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        placeholder="7.50"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="editeur" className="text-white">Éditeur *</Label>
                      <Input
                        id="editeur"
                        value={tomeData.editeur}
                        onChange={(e) => setTomeData({...tomeData, editeur: e.target.value})}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        placeholder="Glénat, Ki-oon, etc."
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <ImageUpload
                      onImageUpload={(imageUrl) => setTomeData({...tomeData, coverImage: imageUrl})}
                      uploadType="tome"
                      className="bg-white/10 border-white/20"
                      label="Image de couverture du tome"
                      placeholder="URL de l'image ou upload"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loading || !selectedMangaId}
                    className="w-full bg-[#CE6A6B] hover:bg-[#B55A5B] text-white"
                  >
                    {loading ? "Ajout en cours..." : "Ajouter le tome"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 
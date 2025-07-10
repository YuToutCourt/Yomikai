"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search, 
  Edit, 
  Trash2, 
  Plus, 
  BookOpen, 
  Eye,
  MoreHorizontal 
} from "lucide-react";
import { toast } from "sonner";
import ImageUpload from "@/components/admin/ImageUpload";

interface Manga {
  id: number;
  title: string;
  author?: string;
  genre?: string;
  status: string;
  description?: string;
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

export default function ManageMangasPage() {
  const [mangas, setMangas] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedManga, setSelectedManga] = useState<Manga | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mangaToDelete, setMangaToDelete] = useState<Manga | null>(null);

  // État pour l'édition
  const [editData, setEditData] = useState({
    title: "",
    author: "",
    genre: "",
    status: "En cours",
    description: "",
    coverImage: ""
  });

  useEffect(() => {
    fetchMangas();
  }, []);

  const fetchMangas = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/mangas");
      const data = await response.json();
      
      if (response.ok) {
        setMangas(data.data);
      } else {
        toast.error("Erreur lors du chargement des mangas");
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Erreur:", error);
      }
      toast.error("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (manga: Manga) => {
    setSelectedManga(manga);
    setEditData({
      title: manga.title,
      author: manga.author || "",
      genre: manga.genre || "",
      status: manga.status,
      description: manga.description || "",
      coverImage: manga.coverImage || ""
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedManga) return;

    try {
      const formData = new FormData();
      formData.append("title", editData.title);
      formData.append("author", editData.author);
      formData.append("genre", editData.genre);
      formData.append("status", editData.status);
      formData.append("description", editData.description);
      if (editData.coverImage) {
        formData.append("coverImage", editData.coverImage);
      }

      const response = await fetch(`/api/admin/mangas/${selectedManga.id}`, {
        method: "PUT",
        body: formData,
      });

      if (response.ok) {
        toast.success("Manga modifié avec succès !");
        setEditDialogOpen(false);
        fetchMangas();
      } else {
        const error = await response.json();
        toast.error(`Erreur: ${error.error}`);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Erreur:", error);
      }
      toast.error("Erreur lors de la modification");
    }
  };

  const handleDelete = (manga: Manga) => {
    setMangaToDelete(manga);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!mangaToDelete) return;

    try {
      const response = await fetch(`/api/admin/mangas/${mangaToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Manga supprimé avec succès !");
        setDeleteDialogOpen(false);
        setMangaToDelete(null);
        fetchMangas();
      } else {
        const error = await response.json();
        toast.error(`Erreur: ${error.error}`);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Erreur:", error);
      }
      toast.error("Erreur lors de la suppression");
    }
  };

  const filteredMangas = mangas.filter(manga =>
    manga.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    manga.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    manga.genre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto"></div>
          <p className="mt-6 text-white text-lg font-medium">Chargement des mangas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white">Gérer les Mangas</h2>
          <p className="text-white/70 mt-1">
            {mangas.length} manga{mangas.length > 1 ? 's' : ''} dans la collection
          </p>
        </div>
        <Button 
          className="bg-[#CE6A6B] hover:bg-[#B55A5B] text-white"
          onClick={() => window.location.href = '/admin/add-manga'}
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un Manga
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
        <Input
          placeholder="Rechercher un manga..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
        />
      </div>

      {/* Manga Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredMangas.map((manga) => (
          <Card key={manga.id} className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-colors">
            <CardHeader className="text-center pb-2 relative">
              <div className="w-full h-48 bg-gradient-to-br from-[#CE6A6B] to-[#EBACA2] rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                {manga.coverImage ? (
                  <img 
                    src={manga.coverImage} 
                    alt={manga.title}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <BookOpen className="w-16 h-16 text-white/50" />
                )}
              </div>
              <CardTitle className="text-white text-lg">{manga.title}</CardTitle>
              <p className="text-white/70 text-sm">{manga.author}</p>
            </CardHeader>
            <CardContent className="text-center">
              <div className="flex justify-center space-x-2 mb-3">
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
              
              <div className="flex justify-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(manga)}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Modifier
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(manga)}
                  className="border-red-500/20 text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Supprimer
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredMangas.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🌸</div>
          <h3 className="text-xl font-semibold text-white mb-2">
            {searchTerm ? "Aucun manga trouvé" : "Aucun manga dans la collection"}
          </h3>
          <p className="text-white/60">
            {searchTerm 
              ? "Essayez de modifier vos critères de recherche"
              : "Commencez par ajouter votre premier manga !"
            }
          </p>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-white/10 backdrop-blur-md border-white/20 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier le manga</DialogTitle>
            <DialogDescription className="text-white/70">
              Modifiez les informations du manga "{selectedManga?.title}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title" className="text-white">Titre *</Label>
              <Input
                id="edit-title"
                value={editData.title}
                onChange={(e) => setEditData({...editData, title: e.target.value})}
                className="bg-white/10 border-white/20 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-author" className="text-white">Auteur</Label>
              <Input
                id="edit-author"
                value={editData.author}
                onChange={(e) => setEditData({...editData, author: e.target.value})}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-genre" className="text-white">Genre</Label>
              <Input
                id="edit-genre"
                value={editData.genre}
                onChange={(e) => setEditData({...editData, genre: e.target.value})}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status" className="text-white">Statut</Label>
              <Select 
                value={editData.status} 
                onValueChange={(value) => setEditData({...editData, status: value})}
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
            <Label htmlFor="edit-description" className="text-white">Description</Label>
            <Textarea
              id="edit-description"
              value={editData.description}
              onChange={(e) => setEditData({...editData, description: e.target.value})}
              className="bg-white/10 border-white/20 text-white min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <ImageUpload
              onImageUpload={(imageUrl) => setEditData({...editData, coverImage: imageUrl})}
              uploadType="cover"
              className="bg-white/10 border-white/20"
              label="Image de couverture"
              placeholder="URL de l'image ou upload"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSaveEdit}
              className="bg-[#CE6A6B] hover:bg-[#B55A5B] text-white"
            >
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-white/10 backdrop-blur-md border-white/20 text-white">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription className="text-white/70">
              Êtes-vous sûr de vouloir supprimer "{mangaToDelete?.title}" ? 
              Cette action est irréversible et supprimera également tous les tomes associés.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Annuler
            </Button>
            <Button
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
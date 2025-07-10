"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import ImageUpload from "@/components/admin/ImageUpload";

interface Tome {
  id: number;
  numero: number;
  prix: string;
  editeur: string;
  coverImage?: string;
  manga?: { title: string };
}

const PAGE_SIZE = 20;

export default function ManageTomesPage() {
  const [tomes, setTomes] = useState<Tome[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTome, setSelectedTome] = useState<Tome | null>(null);
  const [editData, setEditData] = useState({
    numero: "",
    prix: "",
    editeur: "",
    coverImage: ""
  });

  useEffect(() => {
    fetchTomes();
  }, [page]);

  const fetchTomes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/tomes?page=${page}&limit=${PAGE_SIZE}`);
      const data = await response.json();
      if (response.ok) {
        setTomes(data.data);
        setTotal(data.total || 0);
      } else {
        toast.error("Erreur lors du chargement des tomes");
      }
    } catch (error) {
      toast.error("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (tome: Tome) => {
    setSelectedTome(tome);
    setEditData({
      numero: tome.numero.toString(),
      prix: tome.prix.toString(),
      editeur: tome.editeur,
      coverImage: tome.coverImage || ""
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedTome) return;
    try {
      const formData = new FormData();
      formData.append("numero", editData.numero);
      formData.append("prix", editData.prix);
      formData.append("editeur", editData.editeur);
      if (editData.coverImage) {
        formData.append("coverImage", editData.coverImage);
      }
      const response = await fetch(`/api/admin/tomes/${selectedTome.id}`, {
        method: "PUT",
        body: formData,
      });
      if (response.ok) {
        toast.success("Tome modifié avec succès !");
        setEditDialogOpen(false);
        fetchTomes();
      } else {
        const error = await response.json();
        toast.error(`Erreur: ${error.error}`);
      }
    } catch (error) {
      toast.error("Erreur lors de la modification");
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-extrabold mb-6 text-white drop-shadow-lg">Gestion des Tomes</h1>
      {loading ? (
        <div className="text-white/90 text-lg">Chargement...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tomes.map((tome) => (
              <Card key={tome.id} className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-colors">
                <CardHeader className="text-center pb-2 relative">
                  <div className="w-full h-40 bg-gradient-to-br from-[#CE6A6B] to-[#EBACA2] rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                    {tome.coverImage ? (
                      <img src={tome.coverImage} alt={`Tome ${tome.numero}`} className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-white/50">Pas d'image</span>
                    )}
                  </div>
                  <CardTitle className="text-white text-lg">Tome {tome.numero}</CardTitle>
                  <p className="text-white/70 text-sm">{tome.manga?.title}</p>
                </CardHeader>
                <CardContent className="text-white/80 text-sm">
                  <div>Prix : {tome.prix} €</div>
                  <div>Éditeur : {tome.editeur}</div>
                  <Button 
                    className="mt-2 w-full bg-[#CE6A6B] text-white font-bold hover:bg-[#B55A5B] shadow-md transition-colors"
                    onClick={() => handleEdit(tome)}
                  >
                    Modifier
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="flex justify-center items-center gap-2 mt-8">
            <Button 
              disabled={page === 1} 
              onClick={() => setPage(page - 1)}
              className="bg-[#212E53] text-white hover:bg-[#4A919E] border-none"
            >Précédent</Button>
            <span className="text-white font-semibold">Page {page} / {totalPages}</span>
            <Button 
              disabled={page === totalPages} 
              onClick={() => setPage(page + 1)}
              className="bg-[#212E53] text-white hover:bg-[#4A919E] border-none"
            >Suivant</Button>
          </div>
        </>
      )}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-white/10 backdrop-blur-md border-white/20 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-bold">Modifier le tome</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Label className="text-white">Numéro</Label>
            <Input type="number" value={editData.numero} onChange={e => setEditData({ ...editData, numero: e.target.value })} className="bg-white/10 text-white border-white/20" />
            <Label className="text-white">Prix (€)</Label>
            <Input type="number" value={editData.prix} onChange={e => setEditData({ ...editData, prix: e.target.value })} className="bg-white/10 text-white border-white/20" />
            <Label className="text-white">Éditeur</Label>
            <Input value={editData.editeur} onChange={e => setEditData({ ...editData, editeur: e.target.value })} className="bg-white/10 text-white border-white/20" />
            <ImageUpload
              onImageUpload={url => setEditData({ ...editData, coverImage: url })}
              uploadType="tome"
              className="bg-white/10 border-white/20"
              label="Image de couverture du tome"
              placeholder="URL de l'image ou upload"
              currentImage={editData.coverImage}
            />
          </div>
          <DialogFooter>
            <Button 
              onClick={handleSaveEdit}
              className="w-full mt-4 bg-[#CE6A6B] text-white font-bold hover:bg-[#B55A5B] shadow-md transition-colors"
            >Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
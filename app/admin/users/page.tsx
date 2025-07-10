"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  Search, 
  Edit, 
  Trash2, 
  UserPlus, 
  Shield,
  User,
  Calendar,
  Mail
} from "lucide-react";
import { toast } from "sonner";

interface User {
  id: number;
  username: string;
  isadmin: boolean;
  userlogo?: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);

  // État pour l'édition
  const [editData, setEditData] = useState({
    username: "",
    isadmin: false,
    userlogo: ""
  });

  // État pour l'ajout
  const [addData, setAddData] = useState({
    username: "",
    password: "",
    isadmin: false,
    userlogo: ""
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/users");
      const data = await response.json();
      
      if (response.ok) {
        setUsers(data.data);
      } else {
        toast.error("Erreur lors du chargement des utilisateurs");
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

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setEditData({
      username: user.username,
      isadmin: user.isadmin,
      userlogo: user.userlogo || ""
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editData),
      });

      if (response.ok) {
        toast.success("Utilisateur modifié avec succès !");
        setEditDialogOpen(false);
        fetchUsers();
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

  const handleAddUser = async () => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(addData),
      });

      if (response.ok) {
        toast.success("Utilisateur créé avec succès !");
        setAddUserDialogOpen(false);
        setAddData({ username: "", password: "", isadmin: false, userlogo: "" });
        fetchUsers();
      } else {
        const error = await response.json();
        toast.error(`Erreur: ${error.error}`);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Erreur:", error);
      }
      toast.error("Erreur lors de la création");
    }
  };

  const handleDelete = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      const response = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Utilisateur supprimé avec succès !");
        setDeleteDialogOpen(false);
        setUserToDelete(null);
        fetchUsers();
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

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.isadmin ? "admin" : "user").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto"></div>
          <p className="mt-6 text-white text-lg font-medium">Chargement des utilisateurs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white">Gestion des Utilisateurs</h2>
          <p className="text-white/70 mt-1">
            {users.length} utilisateur{users.length > 1 ? 's' : ''} inscrit{users.length > 1 ? 's' : ''}
          </p>
        </div>
        <Button 
          className="bg-[#CE6A6B] hover:bg-[#B55A5B] text-white"
          onClick={() => setAddUserDialogOpen(true)}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Ajouter un Utilisateur
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
        <Input
          placeholder="Rechercher un utilisateur..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
        />
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user) => (
          <Card key={user.id} className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-colors">
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user.userlogo} alt={user.username} />
                  <AvatarFallback className="bg-gradient-to-br from-[#CE6A6B] to-[#EBACA2] text-white text-lg">
                    {user.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-white text-lg">{user.username}</CardTitle>
              <div className="flex items-center justify-center space-x-1 text-white/70 text-sm">
                <Mail className="w-3 h-3" />
                <span>{user.isadmin ? 'Administrateur' : 'Utilisateur'}</span>
              </div>
            </CardHeader>
            <CardContent className="text-center">
              <div className="flex justify-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(user)}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Modifier
                </Button>
                {!user.isadmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(user)}
                    className="border-red-500/20 text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Supprimer
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredUsers.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-xl font-semibold text-white mb-2">
            {searchTerm ? "Aucun utilisateur trouvé" : "Aucun utilisateur"}
          </h3>
          <p className="text-white/60">
            {searchTerm 
              ? "Essayez de modifier vos critères de recherche"
              : "Commencez par ajouter votre premier utilisateur !"
            }
          </p>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-white/10 backdrop-blur-md border-white/20 text-white">
          <DialogHeader>
            <DialogTitle>Modifier l'utilisateur</DialogTitle>
            <DialogDescription className="text-white/70">
              Modifiez les informations de "{selectedUser?.username}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-username" className="text-white">Nom d'utilisateur *</Label>
              <Input
                id="edit-username"
                value={editData.username}
                onChange={(e) => setEditData({...editData, username: e.target.value})}
                className="bg-white/10 border-white/20 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-isadmin" className="text-white">Rôle</Label>
              <Select 
                value={editData.isadmin ? "admin" : "user"} 
                onValueChange={(value) => setEditData({...editData, isadmin: value === "admin"})}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Utilisateur</SelectItem>
                  <SelectItem value="admin">Administrateur</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-userlogo" className="text-white">Logo de l'utilisateur</Label>
              <Input
                id="edit-userlogo"
                type="url"
                value={editData.userlogo}
                onChange={(e) => setEditData({...editData, userlogo: e.target.value})}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
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

      {/* Add User Dialog */}
      <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
        <DialogContent className="bg-white/10 backdrop-blur-md border-white/20 text-white">
          <DialogHeader>
            <DialogTitle>Ajouter un utilisateur</DialogTitle>
            <DialogDescription className="text-white/70">
              Créez un nouveau compte utilisateur
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-username" className="text-white">Nom d'utilisateur *</Label>
              <Input
                id="add-username"
                value={addData.username}
                onChange={(e) => setAddData({...addData, username: e.target.value})}
                className="bg-white/10 border-white/20 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-password" className="text-white">Mot de passe *</Label>
              <Input
                id="add-password"
                type="password"
                value={addData.password}
                onChange={(e) => setAddData({...addData, password: e.target.value})}
                className="bg-white/10 border-white/20 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-isadmin" className="text-white">Rôle</Label>
              <Select 
                value={addData.isadmin ? "admin" : "user"} 
                onValueChange={(value) => setAddData({...addData, isadmin: value === "admin"})}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Utilisateur</SelectItem>
                  <SelectItem value="admin">Administrateur</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-userlogo" className="text-white">Logo de l'utilisateur</Label>
              <Input
                id="add-userlogo"
                type="url"
                value={addData.userlogo}
                onChange={(e) => setAddData({...addData, userlogo: e.target.value})}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddUserDialogOpen(false)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Annuler
            </Button>
            <Button
              onClick={handleAddUser}
              className="bg-[#CE6A6B] hover:bg-[#B55A5B] text-white"
            >
              Créer
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
              Êtes-vous sûr de vouloir supprimer "{userToDelete?.username}" ? 
              Cette action est irréversible.
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
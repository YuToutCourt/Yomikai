# 🌸 Yomikai - Gestionnaire de Collection Manga

Une application web moderne pour gérer votre collection de mangas avec un système de notation avancé et une interface élégante.

## ✨ Fonctionnalités

### 📚 Gestion de Collection
- **Catalogue complet** : Ajoutez et gérez vos mangas avec couvertures, descriptions, auteurs
- **Suivi des tomes** : Marquez les tomes lus/non lus avec un système visuel intuitif
- **Statuts de collection** : Collection complète, incomplète, en cours d'acquisition
- **Informations détaillées** : Prix, éditeurs, genres, années de publication

### ⭐ Système de Notation Avancé
- **Notes sur 10** : Système de notation avec demi-points (7.5, 8.5, etc.)
- **Étoiles interactives** : Interface intuitive pour noter vos lectures
- **Notes globales** : Visualisez la moyenne des notes de tous les utilisateurs
- **Historique personnel** : Gardez une trace de vos évaluations

### 🔍 Recherche et Filtres
- **Recherche intelligente** : Par titre, auteur, genre
- **Filtres avancés** : Par statut, prix, notes, progression de lecture
- **Tri personnalisable** : Par titre, note, nombre de tomes, prix
- **Manga aléatoire** : Découvrez de nouvelles séries avec la fonction "Manga aléatoire"

### 🎨 Interface Moderne
- **Design responsive** : Optimisé pour desktop, tablette et mobile
- **Thème sombre élégant** : Interface moderne avec dégradés et transparences
- **Animations fluides** : Transitions et micro-interactions
- **Composants shadcn/ui** : Interface cohérente et accessible

## 🛠️ Technologies

### Frontend
- **Next.js 15+** avec App Router
- **TypeScript** pour la sécurité des types
- **TailwindCSS** pour le styling
- **shadcn/ui** pour les composants
- **Zustand** pour la gestion d'état client

### Backend
- **Next.js API Routes** pour l'API REST
- **Prisma ORM** pour la base de données
- **NextAuth.js** pour l'authentification
- **MySQL/MariaDB** pour la persistance

### Infrastructure
- **Docker** pour la base de données
- **MariaDB** comme SGBD
- **Upload de fichiers** pour les couvertures

## 🚀 Installation

### Prérequis
- Node.js 18+ 
- Docker et Docker Compose
- Git

### 1. Cloner le projet
```bash
git clone <repository-url>
cd Yomikai
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configuration de l'environnement
```bash
cp .env.example .env
```

Éditez le fichier `.env` avec vos configurations :
```env
DATABASE_URL="mysql://root:root@localhost:3306/yomikai"
NEXTAUTH_SECRET="votre-secret-ici"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Démarrer la base de données
```bash
docker-compose up -d
```

### 5. Configuration de la base de données
```bash
# Générer le client Prisma
npx prisma generate

# Appliquer les migrations
npx prisma migrate dev
```

### 6. Lancer l'application
```bash
npm run dev
```

L'application sera disponible sur [http://localhost:3000](http://localhost:3000)

## 📊 Structure de la Base de Données

### Tables Principales
- **User** : Utilisateurs et authentification
- **Manga** : Informations des séries manga
- **Tome** : Volumes individuels avec prix et éditeurs
- **Reading** : Suivi de lecture et notes des utilisateurs

### Relations
- Un manga peut avoir plusieurs tomes
- Un utilisateur peut lire plusieurs tomes
- Chaque lecture peut avoir une note personnelle

## 🔧 Scripts Disponibles

```bash
# Développement
npm run dev          # Lancer le serveur de développement
npm run build        # Build de production
npm run start        # Lancer en production
npm run lint         # Vérifier le code

# Base de données
npx prisma studio    # Interface graphique pour la DB
npx prisma migrate   # Gérer les migrations
npx prisma generate  # Générer le client Prisma
```

## 🎯 Fonctionnalités Avancées

### Système de Notation
- **Notes décimales** : Support des demi-points (7.5, 8.5)
- **Étoiles visuelles** : Interface intuitive avec étoiles jaunes (notes personnelles) et bleues (moyennes globales)
- **Calcul automatique** : Moyennes par manga et globales

### Gestion des Images
- **Upload de couvertures** : Interface d'upload pour les mangas et tomes
- **Stockage sécurisé** : Fichiers organisés dans `/public/uploads/`
- **Fallback visuel** : Icônes par défaut si pas d'image

### Sécurité
- **Authentification** : Système de connexion sécurisé
- **Validation** : Vérification des données côté serveur
- **Variables d'environnement** : Configuration sécurisée

## 🎨 Interface Utilisateur

### Dashboard Principal
- **Grille de mangas** : Affichage en cartes avec couvertures
- **Filtres dynamiques** : Recherche et tri en temps réel
- **Statuts visuels** : Badges colorés pour les statuts

### Modal de Détail
- **Informations complètes** : Détails du manga et de tous ses tomes
- **Actions rapides** : Marquer comme lu et noter en un clic
- **Notes comparatives** : Vos notes vs moyennes globales

## 🔄 Workflow de Développement

### Ajouter un Manga
1. Interface admin pour ajouter un nouveau manga
2. Upload de la couverture
3. Ajout des tomes avec prix et éditeurs
4. Disponible immédiatement dans le catalogue

### Système de Lecture
1. Cliquer sur un manga pour voir les détails
2. Marquer les tomes comme lus
3. Noter chaque tome avec le système d'étoiles
4. Visualiser les moyennes globales

## 🚀 Déploiement

### Variables d'Environnement Requises
```env
DATABASE_URL="mysql://user:password@host:port/database"
NEXTAUTH_SECRET="secret-long-et-securise"
NEXTAUTH_URL="https://votre-domaine.com"
```

### Commandes de Déploiement
```bash
npm run build
npm run start
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🙏 Remerciements

- **shadcn/ui** pour les composants
- **Next.js** pour le framework
- **Prisma** pour l'ORM
- **TailwindCSS** pour le styling

---

**Yomikai** - Gérer sa collection manga avec style ✨

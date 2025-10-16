#!/bin/bash

# Script de démarrage pour Yomikai avec Docker
echo "🚀 Démarrage de Yomikai avec Docker..."

# Vérifier si Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Veuillez installer Docker d'abord."
    exit 1
fi

# Vérifier si Docker Compose est installé
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé. Veuillez installer Docker Compose d'abord."
    exit 1
fi

# Vérifier si le fichier .env existe
if [ ! -f .env ]; then
    echo "⚠️  Fichier .env non trouvé. Copie du fichier .env.example..."
    cp env.example .env
    echo "📝 Veuillez modifier le fichier .env avec vos configurations avant de relancer."
    exit 1
fi

# Construire et démarrer les services
echo "🔨 Construction des images Docker..."
docker-compose build

echo "🚀 Démarrage des services..."
docker-compose up -d

# Attendre que la base de données soit prête
echo "⏳ Attente du démarrage de la base de données..."
sleep 10

# Exécuter les migrations Prisma
echo "🗄️  Exécution des migrations Prisma..."
docker-compose exec app npx prisma migrate deploy

echo "✅ Yomikai est maintenant disponible sur http://localhost:3000"
echo "📊 Base de données MariaDB disponible sur localhost:3306"
echo ""
echo "📋 Commandes utiles:"
echo "  - Arrêter: docker-compose down"
echo "  - Voir les logs: docker-compose logs -f"
echo "  - Redémarrer: docker-compose restart"
echo "  - Accéder au conteneur app: docker-compose exec app sh"

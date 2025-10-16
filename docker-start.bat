@echo off
echo 🚀 Démarrage de Yomikai avec Docker...

REM Vérifier si Docker est installé
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker n'est pas installé. Veuillez installer Docker d'abord.
    pause
    exit /b 1
)

REM Vérifier si le fichier .env existe
if not exist .env (
    echo ⚠️  Fichier .env non trouvé. Copie du fichier .env.example...
    copy env.example .env
    echo 📝 Veuillez modifier le fichier .env avec vos configurations avant de relancer.
    pause
    exit /b 1
)

REM Construire et démarrer les services
echo 🔨 Construction des images Docker...
docker-compose build

echo 🚀 Démarrage des services...
docker-compose up -d

REM Attendre que la base de données soit prête
echo ⏳ Attente du démarrage de la base de données...
timeout /t 10 /nobreak >nul

REM Exécuter les migrations Prisma
echo 🗄️  Exécution des migrations Prisma...
docker-compose exec app npx prisma migrate deploy

echo ✅ Yomikai est maintenant disponible sur http://localhost:3000
echo 📊 Base de données MariaDB disponible sur localhost:3306
echo.
echo 📋 Commandes utiles:
echo   - Arrêter: docker-compose down
echo   - Voir les logs: docker-compose logs -f
echo   - Redémarrer: docker-compose restart
echo   - Accéder au conteneur app: docker-compose exec app sh
pause

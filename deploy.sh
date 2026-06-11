#!/bin/bash

echo "🚀 Déploiement Aluatelier Pro en un clic..."
echo ""

# Vérifier que Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Installez Docker d'abord :"
    echo "   curl -fsSL https://get.docker.com -o get-docker.sh"
    echo "   sudo sh get-docker.sh"
    exit 1
fi

# Vérifier que Docker Compose est installé
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé. Installez-le d'abord :"
    echo "   sudo curl -L \"https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)\" -o /usr/local/bin/docker-compose"
    echo "   sudo chmod +x /usr/local/bin/docker-compose"
    exit 1
fi

echo "✅ Docker et Docker Compose sont installés"
echo ""

# Arrêter les anciens conteneurs s'ils existent
echo "🔄 Arrêt des anciens conteneurs..."
docker-compose down 2>/dev/null

# Construire et lancer les conteneurs
echo "🏗️  Construction et démarrage des conteneurs..."
docker-compose up -d --build

# Attendre que les services soient prêts
echo ""
echo "⏳ Attente du démarrage des services..."
sleep 5

# Vérifier que les conteneurs sont en cours d'exécution
if [ "$(docker-compose ps -q | wc -l)" -eq 2 ]; then
    echo ""
    echo "✅ Déploiement réussi !"
    echo ""
    echo "📱 L'application est accessible sur :"
    echo "   - http://localhost:3001"
    echo "   - http://$(hostname -I | awk '{print $1}'):3001"
    echo ""
    echo "📊 Vérifier les logs :"
    echo "   docker-compose logs -f"
    echo ""
    echo "🔧 Commandes utiles :"
    echo "   docker-compose restart    # Redémarrer"
    echo "   docker-compose down       # Arrêter"
    echo "   docker-compose logs -f    # Voir les logs"
else
    echo ""
    echo "❌ Erreur lors du déploiement. Vérifiez les logs :"
    echo "   docker-compose logs"
    exit 1
fi

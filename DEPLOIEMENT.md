# 🚀 Déploiement en Un Clic - Aluatelier Pro

## Déploiement Automatique sur VPS

### Prérequis
- Docker et Docker Compose installés sur votre VPS
- Git installé

### Commandes de déploiement

```bash
# 1. Cloner le dépôt
git clone https://github.com/tigapplab-boop/alluminium-.git
cd alluminium-

# 2. Lancer l'application (tout est déjà configuré !)
docker-compose up -d

# 3. Vérifier que tout fonctionne
docker-compose logs -f
```

C'est tout ! L'application sera accessible sur **http://votre-ip-vps:3001**

### Informations importantes

- **Port de l'application** : 3001 (changé depuis 3000 pour éviter les conflits)
- **Port PostgreSQL** : 5432
- **Base de données** : Déjà configurée avec des credentials sécurisés
- **JWT Secret** : Généré automatiquement avec une clé cryptographique sécurisée

### Commandes utiles

```bash
# Voir les logs en temps réel
docker-compose logs -f app

# Redémarrer l'application
docker-compose restart app

# Arrêter l'application
docker-compose down

# Mettre à jour l'application
git pull
docker-compose up -d --build
```

### Accès à l'application

Une fois déployé, accédez à l'application via :
- **URL locale** : http://localhost:3001
- **URL VPS** : http://votre-ip-vps:3001

### Compte par défaut

Les identifiants par défaut seront créés automatiquement lors du premier démarrage (si seed configuré).

### Sécurité

✅ JWT Secret cryptographiquement sécurisé (128 caractères hexadécimaux)
✅ Mot de passe de base de données fort généré automatiquement
✅ Variables d'environnement déjà configurées
✅ Pas besoin de configuration manuelle !

### Problèmes courants

**Port déjà utilisé ?**
```bash
# Vérifier quel processus utilise le port
sudo lsof -i :3001

# Changer le port dans .env si nécessaire
nano .env
# Modifier APP_PORT=3001 vers un autre port
```

**Base de données ne démarre pas ?**
```bash
# Vérifier les logs de la base de données
docker-compose logs db
```

---

💡 **Astuce** : Toutes les configurations sont déjà incluses dans le dépôt Git. Pas besoin de créer ou modifier de fichiers `.env` !

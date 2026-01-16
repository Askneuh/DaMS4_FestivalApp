# 🚀 Guide de Configuration - DaMS4 Festival App

Ce guide explique comment configurer et lancer le projet **DaMS4 Festival App** sur votre machine locale.

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **Node.js** (version 18 ou supérieure) - [Télécharger](https://nodejs.org/)
- **Docker Desktop** - [Télécharger](https://www.docker.com/products/docker-desktop/)
- **Git** - [Télécharger](https://git-scm.com/)
- **mkcert** - Outil pour générer des certificats SSL locaux

### Installation de mkcert

#### Windows (avec Chocolatey)
```powershell
choco install mkcert
```

#### Windows (avec Scoop)
```powershell
scoop bucket add extras
scoop install mkcert
```

#### macOS (avec Homebrew)
```bash
brew install mkcert
```

#### Linux
```bash
# Ubuntu/Debian
sudo apt install libnss3-tools
wget -O mkcert https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-linux-amd64
chmod +x mkcert
sudo mv mkcert /usr/local/bin/
```

---

## 🔧 Installation Initiale

### 1️⃣ Cloner le Projet

```bash
git clone https://github.com/Askneuh/DaMS4_FestivalApp.git
cd DaMS4_FestivalApp
```

### 2️⃣ Générer les Certificats SSL

Le projet utilise **HTTPS** pour le frontend et le backend. Vous devez générer des certificats SSL locaux avec `mkcert`.

#### Initialiser mkcert (une seule fois sur votre machine)
```bash
mkcert -install
```

Cette commande installe une autorité de certification (CA) locale dans votre système.

#### Générer les certificats pour le Backend

```bash
cd backend
mkdir certs
cd certs
mkcert localhost
cd ../..
```

Cela crée deux fichiers dans `backend/certs/` :
- `localhost.pem` (certificat)
- `localhost-key.pem` (clé privée)

#### Générer les certificats pour le Frontend

```bash
cd frontend
mkdir certs
cd certs
mkcert localhost
cd ../..
```

Cela crée deux fichiers dans `frontend/certs/` :
- `localhost.pem` (certificat)
- `localhost-key.pem` (clé privée)

> **⚠️ Important** : Les dossiers `backend/certs` et `frontend/certs` sont dans le `.gitignore`. Chaque développeur doit générer ses propres certificats.

### 3️⃣ Installer les Dépendances

#### Backend
```bash
cd backend
npm install
cd ..
```

#### Frontend
```bash
cd frontend
npm install
cd ..
```

### 4️⃣ Lancer la Base de Données PostgreSQL

Le projet utilise **Docker Compose** pour gérer la base de données PostgreSQL et l'interface Adminer.

```bash
docker-compose up -d
```

Cette commande :
- Lance un conteneur PostgreSQL sur le port **5439**
- Lance Adminer (interface web pour gérer la DB) sur le port **8080**
- Initialise automatiquement la base de données avec le script `backend/db/init.sql`

#### Vérifier que la base de données fonctionne

Accédez à Adminer : [http://localhost:8080](http://localhost:8080)

Connectez-vous avec les identifiants suivants :
- **Système** : PostgreSQL
- **Serveur** : `db:5432`
- **Utilisateur** : `festivalapp`
- **Mot de passe** : `festivalapp`
- **Base de données** : `festivalapp`

---

## 🚀 Lancer l'Application

### Démarrer le Backend (API)

```bash
cd backend
npm run dev
```

Le serveur API démarre sur **https://localhost:4000**

> **Note** : Le backend utilise HTTPS avec les certificats générés dans `backend/certs/`

### Démarrer le Frontend (Angular)

Dans un **nouveau terminal** :

```bash
cd frontend
npm start
```

Le frontend démarre sur **https://localhost:4200**

> **Note** : Le frontend utilise également HTTPS avec les certificats générés dans `frontend/certs/`

---

## 🔐 Connexion à l'Application

Par défaut, un utilisateur admin est créé automatiquement au démarrage du backend :

- **Login** : `admin`
- **Mot de passe** : `admin`

Vous pouvez vous connecter à l'application via [https://localhost:4200](https://localhost:4200)

---

## 📂 Structure du Projet

```
DaMS4_FestivalApp/
├── backend/
│   ├── certs/                  # Certificats SSL (à générer localement)
│   ├── db/
│   │   └── init.sql           # Script d'initialisation de la DB
│   ├── src/
│   │   ├── routes/            # Routes API
│   │   ├── middleware/        # Middlewares (auth, etc.)
│   │   └── server.ts          # Point d'entrée du serveur
│   └── package.json
├── frontend/
│   ├── certs/                  # Certificats SSL (à générer localement)
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/    # Composants Angular
│   │   │   ├── interfaces/    # Interfaces TypeScript
│   │   │   └── services/      # Services API
│   │   └── main.ts
│   ├── angular.json           # Configuration Angular (SSL)
│   └── package.json
└── docker-compose.yml         # Configuration Docker (PostgreSQL + Adminer)
```

---

## 🛠️ Commandes Utiles

### Base de Données

```bash
# Démarrer la base de données
docker-compose up -d

# Arrêter la base de données
docker-compose down

# Arrêter et supprimer les volumes (⚠️ supprime toutes les données)
docker-compose down -v

# Voir les logs de la base de données
docker-compose logs db
```

### Backend

```bash
# Lancer en mode développement (avec hot-reload)
npm run dev

# Lancer les tests
npm test
```

### Frontend

```bash
# Lancer en mode développement
npm start

# Builder pour la production
npm run build

# Lancer les tests
npm test
```

---

## 🐛 Dépannage

### Problème : "Certificate not trusted" dans le navigateur

Si votre navigateur affiche un avertissement de sécurité :
1. Assurez-vous d'avoir exécuté `mkcert -install`
2. Régénérez les certificats avec `mkcert localhost`
3. Redémarrez votre navigateur

### Problème : Le backend ne démarre pas (erreur de certificat)

Vérifiez que les fichiers suivants existent :
- `backend/certs/localhost.pem`
- `backend/certs/localhost-key.pem`

Si ce n'est pas le cas, suivez les instructions de la section **2️⃣ Générer les Certificats SSL**.

### Problème : Le frontend ne démarre pas (erreur de certificat)

Vérifiez que les fichiers suivants existent :
- `frontend/certs/localhost.pem`
- `frontend/certs/localhost-key.pem`

Si ce n'est pas le cas, suivez les instructions de la section **2️⃣ Générer les Certificats SSL**.

### Problème : Impossible de se connecter à la base de données

1. Vérifiez que Docker Desktop est lancé
2. Vérifiez que les conteneurs sont actifs : `docker-compose ps`
3. Vérifiez les logs : `docker-compose logs db`
4. Redémarrez les conteneurs : `docker-compose restart`

### Problème : Port déjà utilisé

Si un port est déjà utilisé (4000, 4200, 5439, 8080), vous pouvez :
- Arrêter le processus qui utilise le port
- Modifier le port dans la configuration correspondante

---

## 📚 Technologies Utilisées

- **Frontend** : Angular 20, TypeScript, Angular Material
- **Backend** : Node.js, Express, TypeScript
- **Base de données** : PostgreSQL 16
- **Sécurité** : HTTPS (mkcert), JWT, bcrypt
- **Outils** : Docker, Docker Compose, tsx (TypeScript runner)

---

## 🤝 Contribution

1. Créez une branche pour votre fonctionnalité : `git checkout -b feature/ma-fonctionnalite`
2. Committez vos changements : `git commit -m "Ajout de ma fonctionnalité"`
3. Pushez vers la branche : `git push origin feature/ma-fonctionnalite`
4. Créez une Pull Request

---

## 📞 Support

En cas de problème, contactez l'équipe ou ouvrez une issue sur le dépôt GitHub.

**Bon développement ! 🎉**

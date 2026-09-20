
# AFOR Emploi Frontend

Application frontend React + TypeScript construite avec Vite pour l'interface AFOR Emploi.

## Prerequis

- Node.js 22 ou plus recent
- npm
- Docker, uniquement pour lancer l'application en conteneur

## Configuration

Créer un fichier `.env` a partir de `.env.example` si besoin :

```env
VITE_API_URL=http://localhost:8000/api
```

`VITE_API_URL` doit pointer vers l'API backend. Avec Docker, cette valeur est injectee au moment du build.

## Lancer en local

Installer les dependances :

```bash
npm install
```

Demarrer le serveur de developpement :

```bash
npm run dev
```

Par defaut, Vite expose l'application sur `http://localhost:5173`.

## Build local

Generer le build de production :

```bash
npm run build
```

Previsualiser le build :

```bash
npm run preview
```

## Lancer avec Docker

Construire l'image :

```bash
docker build --build-arg VITE_API_URL=http://localhost:8000/api -t afor-emploi-frontend .
```

Lancer le conteneur en local :

```bash
docker run --rm -p 8080:8080 --name afor-emploi-frontend afor-emploi-frontend
```

L'application sera disponible sur `http://localhost:8080`.

Pour arreter le conteneur :

```bash
docker stop afor-emploi-frontend
```

## Architecture

```text
.
├── public/                 Fichiers statiques publics
├── src/
│   ├── assets/             Donnees et assets utilises par l'application
│   ├── components/         Composants reutilisables
│   ├── context/            Contextes React, notamment l'authentification
│   ├── hooks/              Hooks React reutilisables
│   ├── pages/              Pages principales par profil utilisateur
│   ├── services/           Clients API et services metier
│   ├── styles/             Feuilles CSS par page ou composant
│   ├── types/              Types TypeScript partages
│   └── utils/              Fonctions utilitaires
├── docker/
│   └── nginx.conf          Configuration Nginx de l'image Docker
├── Dockerfile              Build multi-stage de production
├── package.json            Scripts et dependances npm
└── vite.config.ts          Configuration Vite
```

## Scripts

- `npm run dev` : lance Vite en mode developpement.
- `npm run build` : compile TypeScript puis genere le build Vite.
- `npm run preview` : sert localement le build de production.
- `npm run lint` : lance ESLint.

## Securite

Les dependances doivent etre controlees regulierement :

```bash
npm audit
```

Le token d'authentification est stocke en `sessionStorage`, ce qui limite sa persistance a la session du navigateur. En production, le backend doit aussi appliquer CORS, validation serveur, expiration des tokens et controles d'autorisation.
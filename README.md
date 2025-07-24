# 🚀 Pipely

**Générateur de fichiers CI/CD simplifié**

Pipely est une application web moderne qui vous permet de générer facilement des configurations CI/CD pour vos projets. Fini les heures passées à écrire des fichiers YAML complexes - créez vos pipelines en quelques clics !

## ✨ Fonctionnalités

- 🔧 **Interface intuitive** : Générateur visuel avec interface drag-and-drop
- 🎯 **Multi-plateforme** : Support pour GitHub Actions et GitLab CI
- ⚡ **Configuration rapide** : Créez des pipelines complets en minutes
- 📋 **Templates prêts** : Configurations pré-définies pour les cas d'usage courants
- 💾 **Export facile** : Téléchargez vos fichiers de configuration directement
- 🎨 **Interface moderne** : Design élégant avec animations fluides

## 🛠️ Technologies utilisées

- **Frontend** : Next.js 15, React 19, TypeScript
- **UI/UX** : Tailwind CSS, Radix UI, Lucide Icons
- **Animations** : Framer Motion, CSS Animations
- **Formulaires** : React Hook Form, Zod validation

## 🚀 Démarrage rapide

### Prérequis

- Node.js 18+ 
- npm, yarn, pnpm ou bun

### Installation

1. Clonez le repository :
```bash
git clone <repository-url>
cd pipely/my-app
```

2. Installez les dépendances :
```bash
npm install
# ou
yarn install
# ou
pnpm install
```

3. Lancez le serveur de développement :
```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
```

4. Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur

## 📖 Utilisation

1. **Choisissez votre plateforme** : GitHub Actions ou GitLab CI
2. **Configurez vos déclencheurs** : Push, Pull Request, Tags, Cron
3. **Ajoutez vos jobs** : Définissez les tâches à exécuter
4. **Personnalisez les étapes** : Scripts, actions, variables d'environnement
5. **Exportez** : Téléchargez votre fichier de configuration prêt à l'emploi

## 🏗️ Structure du projet

```
my-app/
├── app/                    # Pages Next.js (App Router)
├── components/            # Composants React
│   ├── ui/               # Composants UI réutilisables
│   └── CIConfigGenerator.tsx # Composant principal
├── hooks/                # Hooks personnalisés
├── lib/                  # Utilitaires et helpers
├── public/               # Assets statiques
└── styles/               # Styles globaux
```

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :

1. Fork le projet
2. Créer une branche pour votre fonctionnalité (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit vos changements (`git commit -m 'Ajout d'une nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvrir une Pull Request

## 📝 Scripts disponibles

- `npm run dev` : Lance le serveur de développement
- `npm run build` : Build l'application pour la production
- `npm run start` : Lance l'application en mode production
- `npm run lint` : Vérifie le code avec ESLint


**Développé avec ❤️ pour simplifier vos workflows CI/CD**

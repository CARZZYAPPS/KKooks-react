# KKooks

KKooks is a React/Vite kosher cooking platform with recipe discovery, recipe creation, favorites, menu planning, newsletter signup, Firebase authentication, Firestore persistence, and an admin publishing workspace.

## Included In This Folder

- React/Vite frontend source
- Firebase Authentication integration
- Firestore helpers and security rules
- Admin homepage and recipe publishing tools
- Recipe, favorites, and menu workflows
- `.env.example` configuration template
- `package.json` and `package-lock.json`
- `firebase.json` for Firestore rules deployment
- `setup-checklist.txt` with the full setup order

## Run Locally

```powershell
Set-Location "C:\Users\avish\Downloads\KKooks\Frontend"
& "C:\Program Files\nodejs\npm.cmd" install
& "C:\Program Files\nodejs\npm.cmd" run dev
```

Open `http://localhost:5173`.

## Configure Firebase

1. Copy `.env.example` to `.env`.
2. Add the Firebase web app values from Firebase Console.
3. Set `VITE_ADMIN_EMAILS` to the comma-separated email addresses allowed to administer the site.
4. Enable Email/Password Authentication.
5. Create Firestore.
6. Deploy `firestore.rules` from the Firebase Console Rules tab.
7. Give the first administrator a Firestore user document field named `role` with the value `admin`.

Never commit `.env`. It is excluded by `.gitignore`.

## Verify A Production Build

```powershell
& "C:\Program Files\nodejs\npm.cmd" run build
```

## Upload This Folder To GitHub

Create an empty GitHub repository, then run these commands from this folder:

```powershell
git init
git add .
git commit -m "Initial KKooks app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

Replace the remote URL with your repository URL. Do not upload `node_modules`, `dist`, or `.env`; the included `.gitignore` excludes them.

## Deploy

For Vercel or Netlify:

- Build command: `npm run build`
- Output directory: `dist`
- Add the same `VITE_` variables from `.env` in the hosting provider settings.

For GitHub Pages, the included `.github/workflows/deploy.yml` automatically builds and publishes `dist` whenever you push to `main`.

## GitHub Pages Setup

1. Push the entire `Frontend` folder, including `.github/workflows/deploy.yml`.
2. In GitHub, open **Settings → Pages**.
3. Set **Source** to **GitHub Actions**.
4. Open **Settings → Secrets and variables → Actions → Variables**.
5. Add these repository variables:
	- `VITE_FIREBASE_API_KEY`
	- `VITE_FIREBASE_AUTH_DOMAIN`
	- `VITE_FIREBASE_PROJECT_ID`
	- `VITE_FIREBASE_STORAGE_BUCKET`
	- `VITE_FIREBASE_MESSAGING_SENDER_ID`
	- `VITE_FIREBASE_APP_ID`
	- `VITE_ADMIN_EMAILS`
6. Push a new commit or run the **Deploy KKooks to GitHub Pages** workflow manually.
7. Check the **Actions** tab for the deployment result.

Do not upload `.env` or `firebase-config.txt`. Delete them from the GitHub repository if they are already present, then rotate any exposed credentials if necessary.

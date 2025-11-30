# Guide de Déploiement Vercel - PWA Covoit

## 📱 Configuration PWA Complétée

✅ **Manifest PWA** : `/public/manifest.json`  
✅ **Icônes** : 192x192 et 512x512 dans `/public/icons/`  
✅ **Métadonnées iPhone** : Apple Web App tags configurés  
✅ **CSS Mobile** : Safe areas, anti-zoom, smooth scrolling

---

## 🚀 Déploiement sur Vercel

### Étape 1 : Préparer les Variables d'Environnement

Avant de déployer, assure-toi d'avoir tes variables Supabase :

```
NEXT_PUBLIC_SUPABASE_URL=https://ton-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ton_anon_key
```

### Étape 2 : Déployer sur Vercel

**Option A : Via le Dashboard Vercel (Recommandé)**

1. Va sur [vercel.com](https://vercel.com)
2. Clique sur **"Add New Project"**
3. Importe ton repo GitHub
4. Configure les variables d'environnement :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Clique sur **"Deploy"**

**Option B : Via CLI**

```bash
# Installe Vercel CLI
npm i -g vercel

# Déploie
vercel

# Ajoute les variables d'environnement
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY

# Redéploie avec les variables
vercel --prod
```

---

## 📲 Installation sur iPhone

### 1. Ouvre Safari sur ton iPhone
Va sur l'URL Vercel (ex: `https://covoit-hm.vercel.app`)

### 2. Ajoute à l'écran d'accueil
1. Appuie sur le bouton **Partager** (icône carré avec flèche)
2. Scroll vers le bas et sélectionne **"Sur l'écran d'accueil"**
3. Personnalise le nom si besoin
4. Appuie sur **"Ajouter"**

### 3. Lance l'app
L'icône apparaît sur ton écran d'accueil. L'app se lance en plein écran sans la barre Safari ! 🎉

---

## ✅ Checklist Post-Déploiement

- [ ] L'app se charge correctement sur Vercel
- [ ] Les variables d'environnement Supabase sont configurées
- [ ] L'authentification fonctionne
- [ ] L'icône apparaît correctement sur l'écran d'accueil iPhone
- [ ] L'app se lance en mode standalone (sans barre Safari)
- [ ] Les formulaires sont utilisables (pas de zoom intempestif)
- [ ] La navigation fonctionne

---

## 🔧 Résolution de Problèmes

### L'icône ne s'affiche pas
- Vide le cache Safari : Réglages > Safari > Effacer historique et données
- Supprime l'app de l'écran d'accueil et réajoute-la

### Erreur Supabase
- Vérifie que les variables d'environnement sont bien configurées dans Vercel
- Redéploie après avoir ajouté les variables

### L'app ne se lance pas en plein écran
- Assure-toi d'utiliser **Safari** (pas Chrome)
- Vérifie que le manifest.json est accessible : `https://ton-url.vercel.app/manifest.json`

---

*Prêt pour la production ! 🚀*

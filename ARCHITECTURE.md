# Documentation Technique - Architecture du Projet Covoiturage (PWA)
**Hôpital Marin de Hendaye**

**Version :** 1.0  
**Date :** 29 Novembre 2025  
**Destinataires :** DSI, Développeurs, Chefs de projet

---

## 1. Résumé Exécutif et Périmètre

### 1.1. Objectif du Projet
Cette application est une **Progressive Web App (PWA)** destinée à faciliter le covoiturage entre les membres du personnel de l'Hôpital Marin de Hendaye. L'objectif est de réduire l'empreinte carbone, de pallier les difficultés de stationnement et de renforcer la cohésion sociale au sein de l'établissement.

### 1.2. Philosophie d'Architecture
Nous avons opté pour une architecture **"Serverless-like"** moderne, privilégiant la rapidité de développement et la performance.
- **Frontend :** Une interface réactive et typée.
- **Backend :** Une approche "Backend-as-a-Service" (BaaS) déléguant la gestion de la base de données, de l'authentification et du temps réel à Supabase (PostgreSQL).

Cette approche permet à une équipe réduite de maintenir une application complexe (géolocalisation, temps réel, chat) sans gérer d'infrastructure lourde.

---

## 2. Stack Technique Détaillée

### 2.1. Frontend (L'Interface)
*   **Framework : Next.js 16 (App Router)**
    *   *Justification :* Standard actuel de l'industrie React. Le "App Router" permet de mélanger composants serveur (pour la performance et le SEO) et composants clients (pour l'interactivité).
*   **Langage : TypeScript**
    *   *Justification :* Indispensable pour la maintenabilité. Le typage strict évite 80% des bugs courants (erreurs de type, props manquantes).
*   **Styling : Tailwind CSS v4**
    *   *Justification :* Permet un développement UI extrêmement rapide sans quitter le fichier HTML/JSX.
*   **Composants UI : Shadcn UI**
    *   *Justification :* Une collection de composants accessibles et personnalisables (basés sur Radix UI) qui sont copiés dans le code source plutôt qu'installés comme dépendance lourde.

### 2.2. Backend (La Logique et les Données)
*   **Cœur : Supabase**
    *   *Justification :* Fournit une base de données PostgreSQL complète avec des APIs générées automatiquement, un système d'authentification et des capacités temps réel.
*   **Logique Métier : Server Actions & RPC**
    *   *Server Actions (Next.js) :* Pour les mutations de données (création de trajets, demandes) exécutées côté serveur.
    *   *RPC (Remote Procedure Calls) :* Fonctions SQL stockées dans PostgreSQL pour les logiques complexes (ex: calculs géographiques).

### 2.3. Géospatial (La Carte)
*   **Moteur : PostGIS**
    *   *Justification :* Extension spatiale pour PostgreSQL. C'est le standard mondial pour stocker et requêter des données géographiques (points GPS, distances, polygones).

---

## 3. Modèle de Données et Sécurité

### 3.1. Schéma de Base de Données (Simplifié)
L'intégrité des données est garantie par des clés étrangères strictes.

*   **`profiles`** : Extension de la table `auth.users`. Contient les infos publiques (Prénom, Service, Avatar).
*   **`rides`** : Les offres de covoiturage.
    *   *Clés :* `driver_id`, `origin_coords` (Point GPS), `origin_address`, `ride_date` (Date précise), `start_time`, `return_time`.
*   **`ride_requests`** : Les demandes de passagers.
    *   *Clés :* `ride_id`, `passenger_id`, `status` (PENDING, ACCEPTED, REJECTED).
*   **`conversations`** & **`messages`** : Système de messagerie interne.

### 3.2. Sécurité : Row Level Security (RLS)
C'est la pierre angulaire de la sécurité dans Supabase. Au lieu de gérer la sécurité dans le code API, nous la gérons **directement dans la base de données**.

*   *Principe :* Même si un développeur fait une requête `SELECT * FROM messages`, la base de données ne retournera **que** les lignes que l'utilisateur a le droit de voir.
*   *Exemple de Règle :* "Un utilisateur ne peut voir un message que s'il est l'expéditeur OU le destinataire."

### 3.3. Authentification
*   **Actuel :** Email/Mot de passe (pour le développement).
*   **Cible :** SSO (Single Sign-On) via OpenID Connect ou SAML connecté à l'Active Directory de l'AP-HP. Cela permettra aux agents d'utiliser leurs identifiants hospitaliers habituels.

---

## 4. L'Intelligence : Algorithme de Matching

Le cœur de l'application réside dans sa capacité à connecter un conducteur et un passager compatible. Cela est géré par la fonction PostgreSQL `find_matching_rides`.

### 4.1. Logique de Filtrage
L'algorithme effectue une recherche multicritères stricte :

1.  **Date Exacte :** Le trajet doit correspondre à la date recherchée (ex: `2025-12-04`).
2.  **Filtre Temporel (±30 min) :**
    *   On compare l'heure de départ du conducteur et celle souhaitée par le passager.
    *   Formule : `ABS(driver_time - passenger_time) <= 30 minutes`.
3.  **Filtre Spatial (Proximité) :**
    *   Utilisation de la fonction PostGIS `ST_Distance`.
    *   On vérifie si le point de départ du conducteur est dans un rayon de **15 km** autour du point de départ du passager.
    *   *Tri :* Les résultats sont triés par distance (le plus proche d'abord), puis par différence d'horaire.
    *   *Note :* Le système est conçu pour évoluer vers un matching de type "Corridor" (vérifier si le passager est sur la route du conducteur) si nous intégrons le tracé complet GPS à l'avenir.

---

## 5. Flux Utilisateur et UX

### 5.1. Tableau de Bord (`/dashboard`)
Le centre de contrôle.
*   **Conducteur :** Voit ses trajets futurs et les demandes en attente (avec badges de notification).
*   **Passager :** Voit l'état de ses demandes (En attente, Validée, Refusée).
*   **UX :** Les cartes de demandes affichent désormais le détail complet : Date, Heure, et Trajet (Départ → Hôpital).

### 5.2. Recherche (`/search`)
*   **Multi-Dates :** Le passager peut sélectionner plusieurs jours (ex: Lundi, Mardi et Jeudi).
*   **Parallélisme :** Le frontend lance plusieurs appels RPC en parallèle pour chaque date sélectionnée, agrège les résultats, et les trie par pertinence temporelle.

### 5.3. Communication (Chat)
*   **Confidentialité :** Aucun numéro de téléphone n'est partagé.
*   **Temps Réel :** Utilisation des WebSockets (Supabase Realtime) pour une messagerie instantanée fluide.
*   **Contexte :** Le bouton "Contacter" sur une carte de trajet ouvre directement une conversation avec le conducteur concerné.

---

## 6. Déploiement et Maintenance

### 6.1. Infrastructure
*   **Frontend :** Hébergé sur Vercel (recommandé pour Next.js) ou via conteneur Docker sur serveur interne.
*   **Backend :** Instance Supabase (Cloud ou Self-Hosted via Docker). Nécessite une base PostgreSQL persistante.

### 6.2. Montée en charge (Scalabilité)
*   **Base de données :** PostgreSQL gère nativement des millions de lignes. L'indexation spatiale (GIST index) sur `origin_coords` assure que les recherches restent rapides même avec beaucoup de trajets.
*   **Stateless :** Le frontend Next.js est "stateless", ce qui permet d'ajouter des serveurs/conteneurs à la volée si le trafic augmente.

---

*Document rédigé par l'Architecte Technique - Projet Covoit Hôpital Marin*

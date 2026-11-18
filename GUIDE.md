# KUKA MUSIC - Espace artiste V1 : guide complet

## Fichiers (tous à la racine du dépôt GitHub)
index.html (mis à jour, Premium retiré) · config.js · artist.js · admin.html · sw.js (mis à jour)
Ne touche pas : manifest.json, icon-192.png, icon-512.png (déjà dans ton dépôt).
schema.sql sert uniquement à Supabase (inutile sur GitHub).

## A. Créer le projet Supabase (gratuit)
1. Va sur supabase.com, crée un compte, touche **New project**.
2. Nom : kuka-music. Choisis un mot de passe de base de données (garde-le), la région la plus proche de tes artistes, plan **Free**. Attends 2 minutes.
3. Menu **SQL Editor** > **New query**. Ouvre schema.sql, copie TOUT, colle, touche **Run**. Message "Success" attendu.
4. Menu **Authentication > URL Configuration** : Site URL = ton site (ex. https://sarwiseman0-dot.github.io/kuka-bf/). Ajoute-le aussi dans Redirect URLs.
5. Menu **Authentication > Providers > Email** : laisse "Confirm email" activé (recommandé).

## B. Clés publiques
1. **Project Settings > API** (ou API Keys).
2. Copie **Project URL** et la clé **anon public** (onglet "Legacy API Keys" si besoin, elle commence par eyJ).
3. Ouvre config.js, remplace COLLE_ICI_URL_SUPABASE et COLLE_ICI_CLE_ANON_PUBLIQUE. 
4. NE JAMAIS copier la clé **service_role** nulle part dans le code.

## C. Ton compte administrateur
1. Sur le site, touche **Espace artiste > Créer un compte artiste** avec TON e-mail, confirme l'e-mail, connecte-toi.
2. Supabase > SQL Editor, exécute (avec ton e-mail) :
   insert into public.admins (user_id) select id from auth.users where email = 'TON_EMAIL';
3. Ouvre https://sarwiseman0-dot.github.io/kuka-bf/admin.html : seul ce compte y accède (vérifié par le serveur, pas par le navigateur).

## D. Déployer sur GitHub Pages
Dans ton dépôt : supprime d'abord index.html, sw.js (et config.js, artist.js, admin.html s'ils existent), puis **Add file > Upload files** avec les 5 fichiers, **Commit changes**. Attends 1 minute, recharge (navigation privée si l'ancienne version s'affiche).

## E. Mettre à jour l'APK
Dans ton dépôt kuka-android : remplace index.html par le nouveau, ajoute config.js et artist.js. Puis modifie .github/workflows/android.yml (et android-signed.yml) :
- ligne `cp index.html android.js www/` devient `cp index.html android.js config.js artist.js www/`
- juste après cette ligne, ajoute : `sed -i 's#</body>#<script src="android.js"></script></body>#' www/index.html`
Lance Actions > Build APK debug, puis télécharge l'APK dans Releases.
Dans Supabase > Authentication > URL Configuration, ajoute aussi https://localhost dans Redirect URLs.

## F. Ce qui est réellement connecté à Supabase
Comptes artistes, profils, soumission MP3 + pochette, dossier privé par utilisateur, statut en attente/accepté/refusé, motif de refus, admin (accepter, refuser, retirer, modifier titre/genre, suspendre un artiste), signalements, catalogue public des chansons acceptées.
Tant que config.js n'est pas rempli, rien de cela ne fonctionne : le site affiche un message de configuration.

## G. Limites connues (honnêtes)
- Pas testé en conditions réelles : fais la liste de tests ci-dessous avant d'ouvrir au public.
- Les liens d'écoute (URL signées) durent 6 h ; une chanson retirée reste écoutable par ceux qui ont déjà son lien jusqu'à expiration.
- Les favoris et playlists ne gardent pas les chansons du catalogue en ligne (elles sont recréées à chaque chargement).
- Anglais : les textes sont en français dans artist.js ; la traduction sera à faire en V1.1.
- Pas de statistiques d'écoute (aucune donnée inventée).
- Plan gratuit Supabase : 1 Go de fichiers, 50 Mo max par fichier ; un projet inactif peut être mis en pause.
- Droits d'auteur : l'artiste déclare détenir les droits ; vérifie toujours avant d'accepter et retire vite en cas de signalement.

## H. Liste de tests
1. Sans config : "Espace artiste" affiche le message de configuration, le reste du site marche.
2. Créer un compte, confirmer l'e-mail, se connecter.
3. Créer le profil (nom, pays, genre, e-mail, photo). Le modifier ensuite.
4. Envoyer un MP3 + pochette, droits cochés : statut "En attente".
5. Refus : un fichier .wav ou > 25 Mo est refusé ; sans case "droits", refusé.
6. Avec un 2e compte artiste : il ne voit pas la chanson en attente du 1er (ni via la recherche, ni en ouvrant un lien de fichier).
7. Hors compte (navigation privée) : la chanson en attente n'apparaît nulle part.
8. Admin : écouter, voir pochette, refuser avec motif -> l'artiste voit "Refusée" + motif.
9. Admin : accepter -> la chanson apparaît dans la recherche, sur le profil public de l'artiste et se lit dans le lecteur.
10. Admin : retirer -> disparaît du catalogue après rechargement.
11. Un compte non admin qui ouvre admin.html voit "Accès refusé".
12. Signaler une chanson depuis le profil public -> visible dans Admin > Signalements.
13. Suspendre un artiste -> ses chansons disparaissent du public.
14. Couper internet : le site s'ouvre, message de reconnexion dans l'APK, aucune erreur bloquante.

---
# MISE À JOUR : Auditeur / Artiste + Communauté (nouveaux fichiers)

## 1. Supabase
SQL Editor > New query > colle TOUT schema-v2.sql > Run (après schema.sql ; peut être relancé).
Les artistes déjà inscrits deviennent automatiquement des membres "artiste".

## 2. GitHub (racine du dépôt)
Remplace : index.html, artist.js, admin.html, sw.js. Ajoute : community.js. Garde config.js (déjà rempli) : ne le remplace pas.
APK : dans kuka-android, remplace index.html, artist.js, ajoute community.js, puis dans android.yml (et android-signed.yml) la ligne cp devient :
`cp index.html android.js config.js artist.js community.js www/`

## 3. Ce qui change
- Premier lancement : choix Auditeur ou Artiste. Le profil est fixé à la création du compte (le serveur refuse tout changement de rôle).
- Auditeur : écoute, recherche, favoris, playlists, suivre des artistes, communauté, idées. Aucune publication de chanson, aucun revenu.
- Artiste : espace artiste (profil, chansons, stats, revenus, paiements) + communauté + idées. Lecteur et catalogue masqués ; le serveur refuse aussi de lui délivrer les fichiers audio des autres.
- Communauté : fil, commentaires et réponses, j'aime, partage, suivre, bloquer, signaler (⚑), limite anti-spam de 5 messages/minute.
- Idées : catégories (collaboration, idée de chanson, style, défi, amélioration de l'app), vote ▲ et commentaires, classement par votes.
- Revenus : lecture seule pour l'artiste (ses montants uniquement). Seul l'admin les saisit (admin.html > Artistes > Ajouter un revenu). Personne d'autre ne peut les modifier (RLS).
- Moyens de paiement : l'artiste enregistre un identifiant (Mobile Money, virement, PayPal) visible de lui et de l'admin seulement.
- Admin.html : onglet Communauté (masquer un contenu, bloquer un membre, ignorer).

## 4. Ce qui nécessite une configuration ou n'est pas encore là
- Paiement réel des artistes : non automatisé. Il faut un prestataire (Mobile Money, Stripe, PayPal...) et des conditions légales ; pour l'instant l'admin saisit les revenus à la main.
- Calcul des revenus : aucun système de revenus n'existe (pas de pubs réelles ni d'abonnements). Aucun montant n'est inventé.
- Statistiques d'écoute : non incluses (aucune donnée inventée). Les stats affichées : chansons par statut, abonnés, j'aime reçus.
- Favoris et playlists d'auditeur : toujours enregistrés sur l'appareil (pas de synchronisation entre appareils).
- Proposer des idées musicales, discussions : même rubrique "Idées" et "Fil" (pas de salons séparés).
- Notifications, messages privés, photo de profil auditeur : non inclus.
- Modération : pas de filtre automatique d'insultes ; elle repose sur les signalements et l'admin. Pense à relire les signalements régulièrement.
- Un artiste peut techniquement créer un 2e compte "auditeur" avec un autre e-mail : la séparation protège les revenus et les données, pas l'accès au catalogue.

## 5. Tests supplémentaires
1. Premier lancement : l'écran de choix s'affiche ; "Artiste" masque le lecteur et Recherche/Favoris/Playlists.
2. Un compte auditeur n'a pas de bouton de publication de chanson ; un compte artiste a l'espace artiste.
3. Inscription avec pseudo : le pseudo apparaît sur les publications.
4. Publier, aimer, commenter, répondre, supprimer sa publication.
5. Proposer une idée et voter : le classement change ; un 2e vote du même compte retire le vote.
6. Signaler un contenu : il apparaît dans admin.html > Communauté ; "Masquer" le retire du fil.
7. Bloquer un membre : ses publications disparaissent pour toi uniquement.
8. Envoyer 6 messages en 1 minute : le 6e est refusé (anti-spam).
9. Admin ajoute un revenu à l'artiste A : A le voit ; l'artiste B et un auditeur ne voient rien ; A ne peut pas le modifier.
10. Dans Supabase Table Editor, vérifie que la table earnings n'est lisible que par l'artiste concerné (test avec 2 comptes).

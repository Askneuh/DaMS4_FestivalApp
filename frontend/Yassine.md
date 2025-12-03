Resume de mes fonctionnalités:(FestivalService, FestivalList, FestivalForm)

1️⃣ FestivalService (Le Stockage)
Un service :Pourquoi ?

Éviter de dupliquer le code
Partager des données entre composants non liés
Séparer les responsabilités


Rôle : Garde tous les festivals en mémoire
Avec:festivalList = signal<Festival[]>([...]);  // Liste de tous les festivals

Méthodes importantes :CRUD

addFestival(festival) → Ajoute un nouveau festival
updateFestival(name, festival) → Modifie un festival existant
removeFestival(name) → Supprime un festival
findByName(name) → Cherche un festival par son nom

2️⃣ FestivalList (Le Coordinateur)
Rôle : Affiche tous les festivals et gère la communication
festivals = this.svc.festivalList;        // Référence aux festivals du service
festivalToEdit = signal<Festival | null>; // Festival en cours d'édition
lastRemoved = signal<Festival | null>;    // Dernier festival supprimé

Méthodes importantes :

onEditFestival(festival) → Quand on clique "Modifier", passe le festival au formulaire
onFormClosed() → Réinitialise après création/modification
removeFestival(name) → Supprime un festival (appelle le service)
À retenir : C'est le chef d'orchestre qui lie le service et le formulaire.

3️⃣ FestivalForm (L'Interface)
Rôle : Permet de créer ou modifier un festival
showForm = signal(false);            // Formulaire visible ou caché
festivalToEdit = input<Festival | null>; // Festival à modifier (vient du parent)

Méthodes importantes :

OpenCloseForm() → Affiche/cache le formulaire (toggle)
addTariffZone() → Ajoute une zone tarifaire au formulaire
removeTariffZone(index) → Supprime une zone tarifaire
onSubmit() → Valide et envoie les données au service
loadFestivalData(festival) → Remplit le formulaire pour modifier
resetForm() → Vide le formulaire
isEditMode() → Vérifie si on modifie ou on crée
À retenir : C'est l'interface utilisateur qui gère les formulaires.

🔄 Flux de Création d'un Festival:
1. Utilisateur clique "Ajouter un Festival"
   📁 festival-form.html (ligne 2)
   ↓

2. FestivalForm.OpenCloseForm() → showForm = true
   📁 festival-form.ts (ligne 79-84)
   ↓

3. Formulaire s'affiche (vide)
   📁 festival-form.html (ligne 6 - @if)
   ↓

4. Utilisateur remplit et clique "Créer"
   📁 festival-form.html (ligne 11 - <form>)
   📁 festival-form.html (ligne 93 - bouton submit)
   ↓

5. FestivalForm.onSubmit() :
   - Copie formValue
   - Ajoute festivalName aux zones
   - Appelle festivalService.addFestival()
   📁 festival-form.ts (ligne 110-135)
   ↓

6. FestivalService.addFestival() :
   - festivalList.update([...old, new])
   📁 festival.service.ts (ligne 46-48)
   ↓

7. FestivalList détecte le changement (signal réactif)
   📁 festival-list.ts (ligne 16 - festivals)
   ↓

8. Nouvelle carte apparaît automatiquement
   📁 festival-list.html (ligne 11 - @for)


🔄 Flux de Modification d'un Festival:
1. Utilisateur clique "Modifier" sur une carte
   📁 festival-card-component.html (ligne 26)
   ↓

2. FestivalCardComponent.onEdit() :
   - editFestival.emit(festival)
   📁 festival-card-component.ts (ligne 15-20)
   ↓

3. FestivalList reçoit l'événement
   📁 festival-list.html (ligne 14 - (editFestival))
   ↓

4. FestivalList.onEditFestival() :
   - festivalToEdit.set(festival)
   📁 festival-list.ts (ligne 32-34)
   ↓

5. FestivalForm reçoit festivalToEdit via [input]
   📁 festival-list.html (ligne 6 - [festivalToEdit])
   📁 festival-form.ts (ligne 21 - input)
   ↓

6. Effect détecte le changement
   📁 festival-form.ts (ligne 38-45 - constructor effect)
   ↓

7. FestivalForm.loadFestivalData() :
   - Remplit le formulaire avec les données existantes
   - showForm.set(true)
   📁 festival-form.ts (ligne 53-76)
   ↓

8. Utilisateur modifie et clique "Mettre à jour"
   📁 festival-form.html (ligne 93 - bouton submit)
   ↓

9. FestivalForm.onSubmit() :
   - Appelle festivalService.updateFestival()
   📁 festival-form.ts (ligne 124-126)
   ↓

10. FestivalService.updateFestival() :
    - Remplace l'ancien festival
    📁 festival.service.ts (ligne 50-54)
    ↓

11. FestivalList détecte le changement (signal réactif)
    📁 festival-list.ts (ligne 16 - festivals)
    ↓

12. Carte se met à jour automatiquement
    📁 festival-list.html (ligne 11 - @for)


🔄 Flux de Suppression d'un Festival:
1. Utilisateur clique "Supprimer"
   📁 festival-card-component.html (ligne 29)
   ↓

2. FestivalCardComponent.onDelete() :
   - Affiche confirmation
   - Émet deleteFestival(name)
   📁 festival-card-component.ts (ligne 22-33)
   ↓

3. FestivalList reçoit l'événement
   📁 festival-list.html (ligne 15 - (deleteFestival))
   ↓

4. FestivalList.removeFestival() :
   - Sauvegarde dans lastRemoved
   - Appelle festivalService.removeFestival()
   📁 festival-list.ts (ligne 41-50)
   ↓

5. FestivalService.removeFestival() :
   - Filtre la liste
   📁 festival.service.ts (ligne 40-42)
   ↓

6. FestivalList détecte le changement (signal réactif)
   📁 festival-list.ts (ligne 16 - festivals)
   ↓

7. Carte disparaît automatiquement
   📁 festival-list.html (ligne 11 - @for)
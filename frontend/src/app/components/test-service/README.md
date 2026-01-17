# Test Service Component - Enhanced Version

## Description
Le composant `test-service` est maintenant une **interface de test complète et interactive** qui permet de tester chaque fonction spécifique de chaque service de l'application.

## Fonctionnalités

### 🎯 Tests Interactifs
- **Interface à onglets** pour naviguer entre les 5 services
- **Champs de saisie** pour les paramètres de test (IDs, noms, etc.)
- **Boutons de test** pour exécuter chaque méthode
- **Affichage des résultats** en temps réel

### 📊 Suivi des Résultats
- **Panneau de résultats** affichant le dernier test exécuté
- **Historique complet** de tous les tests avec horodatage
- **Statistiques** : nombre de tests réussis/échoués/total
- **Durée d'exécution** pour chaque test
- **Affichage JSON** des données retournées

### 🧪 Services Testés

#### 1. FestivalService (2 méthodes)
- `findByName(name: string)` - Recherche par nom
- `loadFestivalsFromBD()` - Chargement de tous les festivals

#### 2. GameService (6 méthodes)
- `findById(id: number)` - Recherche par ID
- `getGamesByEditor(idEditor: number)` - Jeux d'un éditeur
- `getGamesThatEditorDontHave(idEditor: number)` - Jeux que l'éditeur n'a pas
- `getMechanismsByGame(idGame: number)` - Mécanismes d'un jeu
- `getGameTypeLabel(idGameType: number)` - Libellé du type de jeu
- `loadGamesFromBD()` - Chargement de tous les jeux

#### 3. EditorService (2 méthodes)
- `findById(id: number)` - Recherche par ID
- `loadEditorsFromBD()` - Chargement de tous les éditeurs

#### 4. ReservationService (3 méthodes)
- `getReservationById(id: number)` - Recherche par ID
- `getReservationsByEditor(idEditor: number)` - Réservations d'un éditeur
- `getReservationsByFestival(festivalName: string)` - Réservations d'un festival

#### 5. TariffZoneService (3 méthodes)
- `findById(idTZ: number)` - Recherche par ID
- `findByFestivalName(festivalName: string)` - Zones d'un festival
- `loadTariffZonesByFestival(festivalName: string)` - Chargement dans le signal

## Utilisation

### Accès
Naviguez vers `/test-service` dans votre application.

### Interface
1. **Sélectionnez un service** via les onglets en haut
2. **Choisissez une méthode** à tester
3. **Remplissez les paramètres** requis (ID, nom, etc.)
4. **Cliquez sur "Tester"** pour exécuter
5. **Consultez les résultats** dans le panneau de droite

### Exemples de Tests

**Tester la recherche d'un festival :**
- Onglet : Festivals
- Méthode : `findByName`
- Paramètre : `Festival-Rose`
- Résultat : Données du festival

**Tester les jeux d'un éditeur :**
- Onglet : Jeux
- Méthode : `getGamesByEditor`
- Paramètre : `1` (ID de l'éditeur)
- Résultat : Liste des jeux de cet éditeur

**Tester les zones tarifaires :**
- Onglet : Zones Tarifaires
- Méthode : `findByFestivalName`
- Paramètre : `Festival-Rose`
- Résultat : Liste des zones tarifaires

## Fonctionnalités Avancées

### Historique des Tests
- Chaque test est enregistré avec :
  - ✅/❌ Statut de réussite
  - Service et méthode testés
  - Horodatage
  - Durée d'exécution
  - Données retournées (cliquable pour voir les détails)
  - Message d'erreur en cas d'échec

### Statistiques
- Compteur de tests réussis (vert)
- Compteur de tests échoués (rouge)
- Total de tests exécutés

### Bouton "Effacer les résultats"
Permet de réinitialiser l'historique et les statistiques.

## Design
- **Interface moderne** avec dégradés et animations
- **Layout en 2 colonnes** : tests à gauche, résultats à droite
- **Responsive** : s'adapte aux petits écrans
- **Onglets colorés** pour une navigation intuitive
- **Affichage JSON** avec coloration syntaxique

## Utilité pour le Développement
- ✅ Vérifier que chaque service fonctionne correctement
- ✅ Tester les différents cas d'usage (IDs valides/invalides, etc.)
- ✅ Déboguer les problèmes de communication avec le backend
- ✅ Valider les données retournées par l'API
- ✅ Mesurer les temps de réponse
- ✅ Documenter le comportement de chaque méthode

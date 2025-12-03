import { Injectable, signal } from '@angular/core';
import { Editor } from '../interfaces/editor';
import { Contact } from '../interfaces/contact';
import { Game } from '../interfaces/game';

@Injectable({
  providedIn: 'root',
})
export class EditorService {
  private readonly _editors = signal<Editor[]>([
  {
    id: 1,
    name: 'Asmodee',
    exposant: true,
    distributeur: true,
    logo: 'https://www.asmodee.com/img/asmodee-logo.svg',
    contacts: [
      {
        id: 1,
        name: 'Marie Dupont',
        email: 'marie.dupont@asmodee.com',
        phone: '+33 1 23 45 67 89',
        role: 'Responsable Commercial'
      },
      {
        id: 2,
        name: 'Pierre Martin',
        email: 'pierre.martin@asmodee.com',
        phone: '+33 1 23 45 67 90',
        role: 'Directeur Marketing'
      }
    ],
    games: [
      {
        id: 1,
        name: 'Dobble',
        author: 'Denis Blanchot',
        nbMinPlayer: 2,
        nbMaxPlayer: 8,
        gameNotice: 'https://www.asmodee.com/dobble-rules.pdf',
        gameType: { id: 1, gameTypeLabel: 'Ambiance', idZone: 1 },
        minimumAge: 6,
        prototype: false,
        duration: 15,
        theme: 'Observation',
        description: 'Un jeu d\'observation et de rapidité où il faut trouver le symbole commun entre deux cartes.',
        gameImage: 'https://www.asmodee.com/img/dobble.jpg',
        rulesTutorial: 'https://www.youtube.com/watch?v=dobble',
        edition: 2009,
        editor: { id: 1, name: 'Asmodee', exposant: true, distributeur: true, logo: '', contacts: [], games: [] },
        mechanisms: [
          { id: 1, name: 'Reconnaissance de motifs', description: 'Les joueurs doivent identifier rapidement des éléments visuels.' },
          { id: 2, name: 'Rapidité', description: 'Le premier à réagir gagne un avantage.' }
        ]
      },
      {
        id: 2,
        name: 'Dixit',
        author: 'Jean-Louis Roubira',
        nbMinPlayer: 3,
        nbMaxPlayer: 8,
        gameNotice: 'https://www.asmodee.com/dixit-rules.pdf',
        gameType: { id: 2, gameTypeLabel: 'Famille', idZone: 2 },
        minimumAge: 8,
        prototype: false,
        duration: 30,
        theme: 'Créativité',
        description: 'Un jeu d\'imagination où les joueurs doivent deviner quelle carte correspond à l\'énigme du conteur.',
        gameImage: 'https://www.asmodee.com/img/dixit.jpg',
        rulesTutorial: 'https://www.youtube.com/watch?v=dixit',
        edition: 2008,
        editor: { id: 1, name: 'Asmodee', exposant: true, distributeur: true, logo: '', contacts: [], games: [] },
        mechanisms: [
          { id: 3, name: 'Communication', description: 'Les joueurs communiquent par indices créatifs.' },
          { id: 4, name: 'Vote', description: 'Les joueurs votent pour deviner la bonne réponse.' }
        ]
      },
      {
        id: 3,
        name: 'Splendor',
        author: 'Marc André',
        nbMinPlayer: 2,
        nbMaxPlayer: 4,
        gameNotice: 'https://www.asmodee.com/splendor-rules.pdf',
        gameType: { id: 3, gameTypeLabel: 'Stratégie', idZone: 3 },
        minimumAge: 10,
        prototype: false,
        duration: 30,
        theme: 'Renaissance',
        description: 'Devenez un riche marchand de la Renaissance en achetant des mines et en développant votre commerce.',
        gameImage: 'https://www.asmodee.com/img/splendor.jpg',
        rulesTutorial: 'https://www.youtube.com/watch?v=splendor',
        edition: 2014,
        editor: { id: 1, name: 'Asmodee', exposant: true, distributeur: true, logo: '', contacts: [], games: [] },
        mechanisms: [
          { id: 5, name: 'Gestion de ressources', description: 'Collectez et gérez des ressources pour acheter des cartes.' },
          { id: 6, name: 'Collection de sets', description: 'Construisez des combos en collectionnant des cartes.' }
        ]
      }
    ]
  },
  {
    id: 2,
    name: 'Days of Wonder',
    exposant: true,
    distributeur: false,
    logo: 'https://www.daysofwonder.com/img/dow-logo.png',
    contacts: [
      {
        id: 3,
        name: 'Sophie Bernard',
        email: 'sophie.bernard@daysofwonder.com',
        phone: '+33 1 34 56 78 90',
        role: 'CEO'
      }
    ],
    games: [
      {
        id: 4,
        name: 'Les Aventuriers du Rail',
        author: 'Alan R. Moon',
        nbMinPlayer: 2,
        nbMaxPlayer: 5,
        gameNotice: 'https://www.daysofwonder.com/rail-rules.pdf',
        gameType: { id: 2, gameTypeLabel: 'Famille', idZone: 2 },
        minimumAge: 8,
        prototype: false,
        duration: 60,
        theme: 'Trains',
        description: 'Construisez des lignes de chemin de fer à travers l\'Amérique du Nord pour relier les villes.',
        gameImage: 'https://www.daysofwonder.com/img/ticket-to-ride.jpg',
        rulesTutorial: 'https://www.youtube.com/watch?v=rail',
        edition: 2004,
        editor: { id: 2, name: 'Days of Wonder', exposant: true, distributeur: false, logo: '', contacts: [], games: [] },
        mechanisms: [
          { id: 7, name: 'Collection de cartes', description: 'Collectez des cartes wagon pour construire des routes.' },
          { id: 8, name: 'Construction de routes', description: 'Construisez des connexions ferroviaires entre les villes.' },
          { id: 9, name: 'Objectifs secrets', description: 'Accomplissez des objectifs cachés pour marquer des points.' }
        ]
      },
      {
        id: 5,
        name: 'Small World',
        author: 'Philippe Keyaerts',
        nbMinPlayer: 2,
        nbMaxPlayer: 5,
        gameNotice: 'https://www.daysofwonder.com/smallworld-rules.pdf',
        gameType: { id: 3, gameTypeLabel: 'Stratégie', idZone: 3 },
        minimumAge: 8,
        prototype: false,
        duration: 80,
        theme: 'Fantasy',
        description: 'Contrôlez des peuples fantastiques pour conquérir un monde trop petit pour tout le monde.',
        gameImage: 'https://www.daysofwonder.com/img/smallworld.jpg',
        rulesTutorial: 'https://www.youtube.com/watch?v=smallworld',
        edition: 2009,
        editor: { id: 2, name: 'Days of Wonder', exposant: true, distributeur: false, logo: '', contacts: [], games: [] },
        mechanisms: [
          { id: 10, name: 'Contrôle de territoire', description: 'Conquérez et contrôlez des régions du plateau.' },
          { id: 11, name: 'Pouvoirs variables', description: 'Chaque peuple a des capacités spéciales uniques.' }
        ]
      }
    ]
  },
  {
    id: 3,
    name: 'Gigamic',
    exposant: true,
    distributeur: true,
    logo: 'https://www.gigamic.com/img/gigamic-logo.svg',
    contacts: [
      {
        id: 4,
        name: 'Laurent Petit',
        email: 'laurent.petit@gigamic.com',
        phone: '+33 1 45 67 89 01',
        role: 'Responsable Festivals'
      },
      {
        id: 5,
        name: 'Julie Moreau',
        email: 'julie.moreau@gigamic.com',
        role: 'Assistante Commercial'
      }
    ],
    games: [
      {
        id: 6,
        name: 'Quarto',
        author: 'Blaise Müller',
        nbMinPlayer: 2,
        nbMaxPlayer: 2,
        gameNotice: 'https://www.gigamic.com/quarto-rules.pdf',
        gameType: { id: 4, gameTypeLabel: 'Abstrait', idZone: 4 },
        minimumAge: 8,
        prototype: false,
        duration: 15,
        theme: 'Abstrait',
        description: 'Alignez 4 pièces ayant un point commun, mais attention c\'est votre adversaire qui choisit la pièce que vous jouez !',
        gameImage: 'https://www.gigamic.com/img/quarto.jpg',
        rulesTutorial: 'https://www.youtube.com/watch?v=quarto',
        edition: 1991,
        editor: { id: 3, name: 'Gigamic', exposant: true, distributeur: true, logo: '', contacts: [], games: [] },
        mechanisms: [
          { id: 12, name: 'Placement', description: 'Placez stratégiquement des pièces sur le plateau.' },
          { id: 13, name: 'Alignement', description: 'Créez des alignements de pièces partageant une caractéristique.' }
        ]
      },
      {
        id: 7,
        name: 'Quoridor',
        author: 'Mirko Marchesi',
        nbMinPlayer: 2,
        nbMaxPlayer: 4,
        gameNotice: 'https://www.gigamic.com/quoridor-rules.pdf',
        gameType: { id: 4, gameTypeLabel: 'Abstrait', idZone: 4 },
        minimumAge: 8,
        prototype: false,
        duration: 15,
        theme: 'Abstrait',
        description: 'Atteignez le côté opposé du plateau tout en bloquant vos adversaires avec des barrières.',
        gameImage: 'https://www.gigamic.com/img/quoridor.jpg',
        rulesTutorial: 'https://www.youtube.com/watch?v=quoridor',
        edition: 1997,
        editor: { id: 3, name: 'Gigamic', exposant: true, distributeur: true, logo: '', contacts: [], games: [] },
        mechanisms: [
          { id: 14, name: 'Déplacement', description: 'Déplacez votre pion sur le plateau.' },
          { id: 15, name: 'Blocage', description: 'Placez des barrières pour ralentir vos adversaires.' }
        ]
      },
      {
        id: 8,
        name: 'Pylos',
        author: 'David G. Royffe',
        nbMinPlayer: 2,
        nbMaxPlayer: 2,
        gameNotice: 'https://www.gigamic.com/pylos-rules.pdf',
        gameType: { id: 4, gameTypeLabel: 'Abstrait', idZone: 4 },
        minimumAge: 8,
        prototype: false,
        duration: 10,
        theme: 'Pyramide',
        description: 'Construisez une pyramide en plaçant vos boules, le dernier à jouer gagne.',
        gameImage: 'https://www.gigamic.com/img/pylos.jpg',
        rulesTutorial: 'https://www.youtube.com/watch?v=pylos',
        edition: 1994,
        editor: { id: 3, name: 'Gigamic', exposant: true, distributeur: true, logo: '', contacts: [], games: [] },
        mechanisms: [
          { id: 16, name: 'Construction verticale', description: 'Empilez des éléments pour construire en hauteur.' },
          { id: 17, name: 'Gestion de stock', description: 'Économisez vos pièces pour les utiliser au bon moment.' }
        ]
      },
      {
        id: 9,
        name: 'Katamino',
        author: 'André Perriolat',
        nbMinPlayer: 1,
        nbMaxPlayer: 2,
        gameNotice: 'https://www.gigamic.com/katamino-rules.pdf',
        gameType: { id: 5, gameTypeLabel: 'Casse-tête', idZone: 5 },
        minimumAge: 3,
        prototype: false,
        duration: 10,
        theme: 'Puzzle',
        description: 'Remplissez l\'espace avec les pentaminos dans ce casse-tête évolutif.',
        gameImage: 'https://www.gigamic.com/img/katamino.jpg',
        rulesTutorial: 'https://www.youtube.com/watch?v=katamino',
        edition: 2003,
        editor: { id: 3, name: 'Gigamic', exposant: true, distributeur: true, logo: '', contacts: [], games: [] },
        mechanisms: [
          { id: 18, name: 'Puzzle', description: 'Assemblez des pièces pour remplir un espace.' },
          { id: 19, name: 'Résolution de problèmes', description: 'Trouvez la bonne configuration.' }
        ]
      }
    ]
  },
  {
    id: 4,
    name: 'Iello',
    exposant: true,
    distributeur: false,
    logo: 'https://www.iello.fr/img/iello-logo.png',
    contacts: [
      {
        id: 6,
        name: 'Thomas Lefebvre',
        email: 'thomas.lefebvre@iello.fr',
        phone: '+33 1 56 78 90 12',
        role: 'Directeur des Ventes'
      }
    ],
    games: [
      {
        id: 10,
        name: 'King of Tokyo',
        author: 'Richard Garfield',
        nbMinPlayer: 2,
        nbMaxPlayer: 6,
        gameNotice: 'https://www.iello.fr/king-of-tokyo-rules.pdf',
        gameType: { id: 2, gameTypeLabel: 'Famille', idZone: 2 },
        minimumAge: 8,
        prototype: false,
        duration: 30,
        theme: 'Monstres',
        description: 'Incarnez un monstre géant et battez-vous pour devenir le roi de Tokyo !',
        gameImage: 'https://www.iello.fr/img/king-of-tokyo.jpg',
        rulesTutorial: 'https://www.youtube.com/watch?v=kingtokyo',
        edition: 2011,
        editor: { id: 4, name: 'Iello', exposant: true, distributeur: false, logo: '', contacts: [], games: [] },
        mechanisms: [
          { id: 20, name: 'Lancer de dés', description: 'Lancez des dés pour déterminer vos actions.' },
          { id: 21, name: 'Élimination', description: 'Éliminez vos adversaires pour gagner.' },
          { id: 22, name: 'King of the Hill', description: 'Contrôlez Tokyo pour gagner des points.' }
        ]
      },
      {
        id: 11,
        name: 'Biblios',
        author: 'Steve Finn',
        nbMinPlayer: 2,
        nbMaxPlayer: 4,
        gameNotice: 'https://www.iello.fr/biblios-rules.pdf',
        gameType: { id: 3, gameTypeLabel: 'Stratégie', idZone: 3 },
        minimumAge: 10,
        prototype: false,
        duration: 30,
        theme: 'Médiéval',
        description: 'Devenez le meilleur bibliothécaire en collectionnant des manuscrits précieux.',
        gameImage: 'https://www.iello.fr/img/biblios.jpg',
        rulesTutorial: 'https://www.youtube.com/watch?v=biblios',
        edition: 2007,
        editor: { id: 4, name: 'Iello', exposant: true, distributeur: false, logo: '', contacts: [], games: [] },
        mechanisms: [
          { id: 23, name: 'Enchères', description: 'Enchérissez pour obtenir les meilleures cartes.' },
          { id: 24, name: 'Collection de sets', description: 'Collectionnez des manuscrits de différentes catégories.' },
          { id: 7, name: 'Collection de cartes', description: 'Gérez votre main de cartes stratégiquement.' }
        ]
      }
    ]
  },
  {
    id: 5,
    name: 'Blackrock Games',
    exposant: true,
    distributeur: false,
    logo: 'https://www.blackrockgames.fr/img/blackrock-logo.svg',
    contacts: [
      {
        id: 7,
        name: 'Alexandre Noir',
        email: 'alexandre.noir@blackrockgames.fr',
        role: 'Fondateur'
      }
    ],
    games: [
      {
        id: 12,
        name: 'Kingdomino',
        author: 'Bruno Cathala',
        nbMinPlayer: 2,
        nbMaxPlayer: 4,
        gameNotice: 'https://www.blackrockgames.fr/kingdomino-rules.pdf',
        gameType: { id: 2, gameTypeLabel: 'Famille', idZone: 2 },
        minimumAge: 8,
        prototype: false,
        duration: 15,
        theme: 'Médiéval',
        description: 'Construisez le plus beau royaume en plaçant des dominos avec différents types de terrains.',
        gameImage: 'https://www.blackrockgames.fr/img/kingdomino.jpg',
        rulesTutorial: 'https://www.youtube.com/watch?v=kingdomino',
        edition: 2016,
        editor: { id: 5, name: 'Blackrock Games', exposant: true, distributeur: false, logo: '', contacts: [], games: [] },
        mechanisms: [
          { id: 25, name: 'Placement de tuiles', description: 'Placez des dominos pour construire votre royaume.' },
          { id: 26, name: 'Drafting', description: 'Choisissez vos tuiles dans un ordre de tour.' }
        ]
      }
    ]
  },
  {
    id: 6,
    name: 'Matagot',
    exposant: false,
    distributeur: true,
    logo: 'https://www.matagot.com/img/matagot-logo.png',
    contacts: [
      {
        id: 8,
        name: 'Claire Rousseau',
        email: 'claire.rousseau@matagot.com',
        phone: '+33 1 67 89 01 23',
        role: 'Responsable Distribution'
      }
    ],
    games: [
      {
        id: 13,
        name: 'Cyclades',
        author: 'Bruno Cathala, Ludovic Maublanc',
        nbMinPlayer: 2,
        nbMaxPlayer: 5,
        gameNotice: 'https://www.matagot.com/cyclades-rules.pdf',
        gameType: { id: 3, gameTypeLabel: 'Stratégie', idZone: 3 },
        minimumAge: 13,
        prototype: false,
        duration: 90,
        theme: 'Mythologie grecque',
        description: 'Avec l\'aide des dieux grecs, développez votre civilisation et conquérez les Cyclades.',
        gameImage: 'https://www.matagot.com/img/cyclades.jpg',
        rulesTutorial: 'https://www.youtube.com/watch?v=cyclades',
        edition: 2009,
        editor: { id: 6, name: 'Matagot', exposant: false, distributeur: true, logo: '', contacts: [], games: [] },
        mechanisms: [
          { id: 23, name: 'Enchères', description: 'Enchérissez pour obtenir la faveur des dieux.' },
          { id: 10, name: 'Contrôle de territoire', description: 'Conquérez et contrôlez des îles.' },
          { id: 27, name: 'Développement', description: 'Construisez des bâtiments pour développer votre cité.' }
        ]
      },
      {
        id: 14,
        name: 'Kemet',
        author: 'Jacques Bariot, Guillaume Montiage',
        nbMinPlayer: 2,
        nbMaxPlayer: 5,
        gameNotice: 'https://www.matagot.com/kemet-rules.pdf',
        gameType: { id: 3, gameTypeLabel: 'Stratégie', idZone: 3 },
        minimumAge: 13,
        prototype: false,
        duration: 120,
        theme: 'Égypte antique',
        description: 'Menez vos troupes égyptiennes au combat avec l\'aide de créatures divines.',
        gameImage: 'https://www.matagot.com/img/kemet.jpg',
        rulesTutorial: 'https://www.youtube.com/watch?v=kemet',
        edition: 2012,
        editor: { id: 6, name: 'Matagot', exposant: false, distributeur: true, logo: '', contacts: [], games: [] },
        mechanisms: [
          { id: 10, name: 'Contrôle de territoire', description: 'Contrôlez des temples pour gagner des points.' },
          { id: 28, name: 'Combat', description: 'Affrontez vos adversaires dans des batailles tactiques.' },
          { id: 11, name: 'Pouvoirs variables', description: 'Améliorez vos pouvoirs divins.' }
        ]
      }
    ]
  }
  ]);
  
  readonly editors = this._editors.asReadonly()

  findById(id: number): Editor | undefined { return this._editors().find(e => e.id === id) }
  
  addEditor(editor: Editor): void { this._editors.update(list => [...list, editor]) }
  
  removeEditor(id: number): void { this._editors.update(list => list.filter(e => e.id !== id)) }
  
  removeAllEditors(): void { this._editors.set([]) }

  update(partial: Partial<Editor> & { id: number }): void { this._editors.update(list => list.map(e => (e.id === partial.id ? { ...e, ...partial } : e)))}
  
  // ============ Recherche et filtres ============
  
  searchByName(query: string): Editor[] {
    if (!query.trim()) return this._editors();
    const lower = query.toLowerCase();
    return this._editors().filter(e => 
      e.name.toLowerCase().includes(lower)
    );
  }

  sortBy(criteria: 'name' | 'gamesCount' | 'contactsCount'): Editor[] {
    const editors = [...this._editors()];
    switch (criteria) {
      case 'name':
        return editors.sort((a, b) => a.name.localeCompare(b.name));
      case 'gamesCount':
        return editors.sort((a, b) => b.games.length - a.games.length);
      case 'contactsCount':
        return editors.sort((a, b) => b.contacts.length - a.contacts.length);
      default:
        return editors;
    }
  }

  getExposants(): Editor[] {
    return this._editors().filter(e => e.exposant);
  }

  getDistributeurs(): Editor[] {
    return this._editors().filter(e => e.distributeur);
  }

  // ============ Gestion des contacts ============

  addContact(editorId: number, contact: Omit<Contact, 'id'>): void {
    const editor = this.findById(editorId);
    if (!editor) return;
    
    const newContactId = Math.max(...editor.contacts.map(c => c.id), 0) + 1;
    const newContact = { ...contact, id: newContactId };
    
    this.update({
      id: editorId,
      contacts: [...editor.contacts, newContact]
    });
  }

  removeContact(editorId: number, contactId: number): void {
    const editor = this.findById(editorId);
    if (!editor) return;
    
    this.update({
      id: editorId,
      contacts: editor.contacts.filter(c => c.id !== contactId)
    });
  }

  updateContact(editorId: number, contactId: number, updates: Partial<Contact>): void {
    const editor = this.findById(editorId);
    if (!editor) return;
    
    this.update({
      id: editorId,
      contacts: editor.contacts.map(c => 
        c.id === contactId ? { ...c, ...updates } : c
      )
    });
  }

  // ============ Gestion des jeux ============

  addGame(editorId: number, game: Omit<Game, 'id'>): void {
    const editor = this.findById(editorId);
    if (!editor) return;
    
    const newGameId = Math.max(...editor.games.map(g => g.id), 0) + 1;
    const newGame = { ...game, id: newGameId };
    
    this.update({
      id: editorId,
      games: [...editor.games, newGame]
    });
  }

  removeGame(editorId: number, gameId: number): void {
    const editor = this.findById(editorId);
    if (!editor) return;
    
    this.update({
      id: editorId,
      games: editor.games.filter(g => g.id !== gameId)
    });
  }

  updateGame(editorId: number, gameId: number, updates: Partial<Game>): void {
    const editor = this.findById(editorId);
    if (!editor) return;
    
    this.update({
      id: editorId,
      games: editor.games.map(g => 
        g.id === gameId ? { ...g, ...updates } : g
      )
    });
  }
}



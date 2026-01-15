import { Injectable, signal, inject } from '@angular/core';
import { Editor } from '../interfaces/editor';
import { Contact } from '../interfaces/contact';
import { Game } from '../interfaces/game';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class EditorService {
  private readonly http = inject(HttpClient)
  private readonly _editors = signal<Editor[]>([
    {
      id: 1,
      name: 'Asmodee',
      exposant: false,
      distributeur: true,
      logo: 'whatever',
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
          gameNotice: 'Repérez le symbole commun le plus vite possible !',
          gameType: { id: 1, gameTypeLabel: 'ambiance', idZone: 12 },
          minimumAge: 6,
          prototype: false,
          duration: 15,
          theme: 'Observation',
          description: 'Le jeu qui met vos réflexes à rude épreuve.',
          gameImage: 'https://exemple.com/dobble.jpg',
          rulesTutorial: 'https://youtube.com/video-dobble',
          edition: 2009,
          idEditor: 1,
          editor: {
            id: 1,
            name: 'Asmodee',
            exposant: true,
            distributeur: false,
            logo: 'asmodee_logo.png',
            contacts: [],
            games: []
          }
        },
        {
          id: 2,
          name: 'Dixit',
          author: 'Jean-Louis Roubira',
          nbMinPlayer: 3,
          nbMaxPlayer: 6,
          gameNotice: 'Une image vaut mille mots.',
          gameType: { id: 2, gameTypeLabel: 'cartes', idZone: 13 },
          minimumAge: 8,
          prototype: false,
          duration: 30,
          theme: 'Poésie / Onirique',
          description: 'Utilisez votre imagination pour deviner la carte du conteur.',
          gameImage: 'https://exemple.com/dixit.jpg',
          rulesTutorial: 'https://youtube.com/video-dixit',
          edition: 2008,
          mechanisms: [],
          idEditor: 1,
          editor: {
            id: 1,
            name: 'Asmodee',
            exposant: true,
            distributeur: false,
            logo: 'asmodee_logo.png',
            contacts: [],
            games: []
          }
        },
        {
          id: 3,
          name: 'Splendor',
          author: 'Marc André',
          nbMinPlayer: 2,
          nbMaxPlayer: 4,
          gameNotice: 'Devenez le plus riche marchand de la Renaissance.',
          gameType: { id: 3, gameTypeLabel: 'stratégie', idZone: 14 },
          minimumAge: 10,
          prototype: false,
          duration: 30,
          theme: 'Renaissance / Joyaux',
          description: 'Collectez des gemmes pour acquérir des développements.',
          gameImage: 'https://exemple.com/splendor.jpg',
          rulesTutorial: 'https://youtube.com/video-splendor',
          edition: 2014,
          mechanisms: [],
          idEditor: 1,
          editor: {
            id: 1,
            name: 'Asmodee',
            exposant: true,
            distributeur: false,
            logo: 'asmodee_logo.png',
            contacts: [],
            games: []
          }
        }
      ]
    },
    {
      id: 2,
      name: 'Days of Wonder',
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
          gameNotice: 'Voyagez à travers l’Amérique en train !',
          gameType: { id: 3, gameTypeLabel: 'stratégie', idZone: 14 }, // À adapter selon ton enum
          minimumAge: 8,
          prototype: false,
          duration: 45,
          theme: 'Train / Voyage',
          description: 'Prenez le contrôle des rails pour relier les villes et gagner des points.',
          gameImage: 'https://exemple.com/ttr.jpg',
          rulesTutorial: 'https://youtube.com/video-ttr',
          edition: 2004,
          mechanisms: [],
          idEditor: 2,
          editor: {
            id: 2,
            name: 'Days of Wonder',
            exposant: true,
            distributeur: true,
            logo: 'dow_logo.png',
            contacts: [],
            games: []
          }
        },
        {
          id: 5,
          name: 'Small World',
          author: 'Philippe Keyaerts',
          nbMinPlayer: 2,
          nbMaxPlayer: 5,
          gameNotice: 'C\'est un monde trop petit pour tout le monde !',
          gameType: { id: 3, gameTypeLabel: 'stratégie', idZone: 14 },
          minimumAge: 8,
          prototype: false,
          duration: 60,
          theme: 'Fantaisie / Conquête',
          description: 'Choisissez des combinaisons de peuples et de pouvoirs pour conquérir le territoire.',
          gameImage: 'https://exemple.com/smallworld.jpg',
          rulesTutorial: 'https://youtube.com/video-smallworld',
          edition: 2009,
          mechanisms: [],
          idEditor: 2,
          editor: {
            id: 2,
            name: 'Days of Wonder',
            exposant: true,
            distributeur: true,
            logo: 'dow_logo.png',
            contacts: [],
            games: []
          }
        }
      ],
      exposant: false,
      distributeur: false,
      logo: ''
    },
    {
      id: 3,
      name: 'Gigamic',
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
          gameNotice: 'Alignez quatre pièces ayant au moins un point commun.',
          gameType: { id: 2, gameTypeLabel: 'stratégie', idZone: 13 },
          minimumAge: 8,
          prototype: false,
          duration: 15,
          theme: 'Abstrait',
          description: 'Un jeu de réflexion pur où c\'est l\'adversaire qui choisit la pièce que vous devez jouer.',
          gameImage: 'https://exemple.com/quarto.jpg',
          rulesTutorial: 'https://youtube.com/video-quarto',
          edition: 1991,
          mechanisms: [],
          idEditor: 3,
          editor: {
            id: 3,
            name: 'Gigamic',
            exposant: true,
            distributeur: true,
            logo: 'gigamic_logo.png',
            contacts: [],
            games: []
          }
        },
        {
          id: 7,
          name: 'Quoridor',
          author: 'Mirko Marchesi',
          nbMinPlayer: 2,
          nbMaxPlayer: 4,
          gameNotice: 'Atteignez la ligne adverse en posant des barrières.',
          gameType: { id: 2, gameTypeLabel: 'stratégie', idZone: 13 },
          minimumAge: 8,
          prototype: false,
          duration: 15,
          theme: 'Abstrait / Labyrinthe',
          description: 'Un jeu tactique intense : allez-vous avancer ou bloquer votre adversaire ?',
          gameImage: 'https://exemple.com/quoridor.jpg',
          rulesTutorial: 'https://youtube.com/video-quoridor',
          edition: 1997,
          mechanisms: [],
          idEditor: 3,
          editor: {
            id: 3,
            name: 'Gigamic',
            exposant: true,
            distributeur: true,
            logo: 'gigamic_logo.png',
            contacts: [],
            games: []
          }
        },
        {
          id: 8,
          name: 'Pylos',
          author: 'David G. Royffe',
          nbMinPlayer: 2,
          nbMaxPlayer: 2,
          gameNotice: 'Soyez celui qui pose la dernière bille au sommet de la pyramide.',
          gameType: { id: 2, gameTypeLabel: 'stratégie', idZone: 13 },
          minimumAge: 8,
          prototype: false,
          duration: 15,
          theme: 'Abstrait / Construction',
          description: 'Économisez vos billes pour dominer la pyramide dans ce duel vertical.',
          gameImage: 'https://exemple.com/pylos.jpg',
          rulesTutorial: 'https://youtube.com/video-pylos',
          edition: 1994,
          mechanisms: [],
          idEditor: 3,
          editor: {
            id: 3,
            name: 'Gigamic',
            exposant: true,
            distributeur: true,
            logo: 'gigamic_logo.png',
            contacts: [],
            games: []
          }
        },
        {
          id: 9,
          name: 'Katamino',
          author: 'André Perriolat',
          nbMinPlayer: 1,
          nbMaxPlayer: 2,
          gameNotice: 'Réalisez des ensembles appelés Penthas.',
          gameType: { id: 4, gameTypeLabel: 'puzzle', idZone: 15 },
          minimumAge: 3,
          prototype: false,
          duration: 10,
          theme: 'Casse-tête / Géométrie',
          description: 'Un puzzle évolutif qui aide à comprendre la géométrie dans l\'espace.',
          gameImage: 'https://exemple.com/katamino.jpg',
          rulesTutorial: 'https://youtube.com/video-katamino',
          edition: 2003,
          mechanisms: [],
          idEditor: 3,
          editor: {
            id: 3,
            name: 'Gigamic',
            exposant: true,
            distributeur: true,
            logo: 'gigamic_logo.png',
            contacts: [],
            games: []
          }
        }
      ],
      exposant: false,
      distributeur: false,
      logo: ''
    },
    {
      id: 4,
      name: 'Iello',
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
          gameNotice: 'Devenez le roi de la ville en écrasant vos adversaires !',
          gameType: { id: 1, gameTypeLabel: 'ambiance', idZone: 12 }, // Ou GameType.Strategie selon tes enums
          minimumAge: 8,
          prototype: false,
          duration: 30,
          theme: 'Monstres / Science-Fiction',
          description: 'Incarnez des monstres géants qui se battent pour le contrôle de Tokyo à coups de dés.',
          gameImage: 'https://exemple.com/king-of-tokyo.jpg',
          rulesTutorial: 'https://youtube.com/video-kot',
          edition: 2011,
          mechanisms: [],
          idEditor: 4,
          editor: {
            id: 4,
            name: 'Iello',
            exposant: true,
            distributeur: true,
            logo: 'iello_logo.png',
            contacts: [],
            games: []
          }
        },
        {
          id: 11,
          name: 'Biblios',
          author: 'Steve Finn',
          nbMinPlayer: 2,
          nbMaxPlayer: 4,
          gameNotice: 'Constituez la plus prestigieuse bibliothèque du monastère.',
          gameType: { id: 2, gameTypeLabel: 'cartes', idZone: 13 },
          minimumAge: 10,
          prototype: false,
          duration: 30,
          theme: 'Médiéval / Monastère',
          description: 'Un jeu d\'enchères et de gestion de main où vous devez accumuler des ressources sacrées.',
          gameImage: 'https://exemple.com/biblios.jpg',
          rulesTutorial: 'https://youtube.com/video-biblios',
          edition: 2007,
          mechanisms: [],
          idEditor: 4,
          editor: {
            id: 4,
            name: 'Iello',
            exposant: true,
            distributeur: true,
            logo: 'iello_logo.png',
            contacts: [],
            games: []
          }
        }
      ],
      exposant: false,
      distributeur: false,
      logo: ''
    },
    {
      id: 5,
      name: 'Blackrock Games',
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
          gameNotice: 'Développez le plus beau royaume en connectant vos dominos.',
          gameType: { id: 2, gameTypeLabel: 'stratégie', idZone: 13 }, // Souvent classé en "Famille" ou "Stratégie"
          minimumAge: 8,
          prototype: false,
          duration: 15,
          theme: 'Médiéval / Construction de territoire',
          description: 'Un jeu de pose de dominos où vous devez construire un royaume de 5x5 cases en optimisant vos types de terrains.',
          gameImage: 'https://exemple.com/kingdomino.jpg',
          rulesTutorial: 'https://youtube.com/video-kingdomino',
          edition: 2016,
          mechanisms: [], // Ex: Placement de tuiles, Draft
          idEditor: 5,
          editor: {
            id: 5,
            name: 'Blackrock Games',
            exposant: true,
            distributeur: true,
            logo: 'blackrock_logo.png',
            contacts: [],
            games: []
          }
        }
      ],
      exposant: false,
      distributeur: false,
      logo: ''
    }
  ])

  readonly editors = this._editors.asReadonly()


  findById(id: number) {
    return this.http.get<Editor>(`https://localhost:4000/api/editeurs/${id}`, { withCredentials: true })
  }


  addEditor(editor: Editor) {
    // 1. On prépare l'objet sans l'ID d'origine (optionnel car le SQL l'ignore, mais plus propre)
    const { id, ...editorToSend } = editor;

    this.http.post<Editor>('https://localhost:4000/api/editeurs', editorToSend, { withCredentials: true })
      .subscribe({
        next: (newEditorFromBD) => {

          this._editors.update(list => [...list, newEditorFromBD]);

          console.log(`✅ ${newEditorFromBD.name} a été ajouté avec l'ID n°${newEditorFromBD.id}`);
          alert(`Éditeur "${newEditorFromBD.name}" créé avec succès dans la base de données !`);
        },
        error: (err) => {
          console.error('Erreur lors de la création dans la BDD :', err);
          alert('Erreur lors de la création. Vérifiez la console.');
        }
      });
  }


  updateEditor(partial: Partial<Editor>, id: number) {
    this.http.post<Editor>(`https://localhost:4000/api/editeurs/update/${id}`, partial, { withCredentials: true })
      .subscribe({
        next: (updatedEditor) => {
          // Mise à jour du signal avec l'objet exact provenant de la BDD
          this._editors.update(list =>
            list.map(e => (e.id === id ? updatedEditor : e))
          );

          console.log(`Éditeur "${updatedEditor.name}" mis à jour avec succès.`);
        },
        error: (err) => {
          console.error('Erreur lors de la mise à jour :', err);
          alert('Erreur lors de la modification en base de données.');
        }
      });
  }

  //pas encore de route pour la suppression
  removeEditor(id: number): void { this._editors.update(list => list.filter(e => e.id !== id)) }


  //pareil
  removeAllEditors(): void { this._editors.set([]) }

}

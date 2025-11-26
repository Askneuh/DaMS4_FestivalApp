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
            edition: 2009,
            editor: { id: 1, name: 'Asmodee', contacts: [], games: [] }
          },
          {
            id: 2,
            name: 'Dixit',
            author: 'Jean-Louis Roubira',
            edition: 2008,
            editor: { id: 1, name: 'Asmodee', contacts: [], games: [] }
          },
          {
            id: 3,
            name: 'Splendor',
            author: 'Marc André',
            edition: 2014,
            editor: { id: 1, name: 'Asmodee', contacts: [], games: [] }
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
            edition: 2004,
            editor: { id: 2, name: 'Days of Wonder', contacts: [], games: [] }
          },
          {
            id: 5,
            name: 'Small World',
            author: 'Philippe Keyaerts',
            edition: 2009,
            editor: { id: 2, name: 'Days of Wonder', contacts: [], games: [] }
          }
        ]
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
            edition: 1991,
            editor: { id: 3, name: 'Gigamic', contacts: [], games: [] }
          },
          {
            id: 7,
            name: 'Quoridor',
            author: 'Mirko Marchesi',
            edition: 1997,
            editor: { id: 3, name: 'Gigamic', contacts: [], games: [] }
          },
          {
            id: 8,
            name: 'Pylos',
            author: 'David G. Royffe',
            edition: 1994,
            editor: { id: 3, name: 'Gigamic', contacts: [], games: [] }
          },
          {
            id: 9,
            name: 'Katamino',
            author: 'André Perriolat',
            edition: 2003,
            editor: { id: 3, name: 'Gigamic', contacts: [], games: [] }
          }
        ]
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
            edition: 2011,
            editor: { id: 4, name: 'Iello', contacts: [], games: [] }
          },
          {
            id: 11,
            name: 'Biblios',
            author: 'Steve Finn',
            edition: 2007,
            editor: { id: 4, name: 'Iello', contacts: [], games: [] }
          }
        ]
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
            edition: 2016,
            editor: { id: 5, name: 'Blackrock Games', contacts: [], games: [] }
          }
        ]
      }
  ])

  readonly editors = this._editors.asReadonly()

  findById(id: number): Editor | undefined { return this._editors().find(e => e.id === id) }
  
  addEditor(editor: Editor): void { this._editors.update(list => [...list, editor]) }
  
  removeEditor(id: number): void { this._editors.update(list => list.filter(e => e.id !== id)) }
  
  removeAllEditors(): void { this._editors.set([]) }

  update(partial: Partial<Editor> & { id: number }): void { this._editors.update(list => list.map(e => (e.id === partial.id ? { ...e, ...partial } : e)))}
  

}

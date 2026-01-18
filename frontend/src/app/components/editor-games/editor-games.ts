import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GameService } from '../../services/game-service';
import { EditorService } from '../../services/editor-service';
import { Game } from '../../interfaces/game';
import { Editor } from '../../interfaces/editor';
import { GameFormComponent } from '../game-form/game-form';

@Component({
  selector: 'app-editor-games',
  imports: [GameFormComponent],
  templateUrl: './editor-games.html',
  styleUrl: './editor-games.css',
})
export class EditorGamesComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private gameService = inject(GameService);
  private editorService = inject(EditorService);

  games = signal<Game[]>([]);
  editor = signal<Editor | null>(null);
  loading = signal(true);
  editorId = signal<number>(0);
  gameToEdit = signal<Game | null>(null);

  sortBy = signal<'name' | 'author' | 'duration' | 'players'>('name');

  sortedGames = computed(() => {
    const result = [...this.games()];
    const sort = this.sortBy();
    
    if (sort === 'name') {
      return result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'author') {
      return result.sort((a, b) => a.author.localeCompare(b.author));
    } else if (sort === 'duration') {
      return result.sort((a, b) => a.duration - b.duration);
    } else if (sort === 'players') {
      return result.sort((a, b) => a.nbMinPlayer - b.nbMinPlayer);
    }
    return result;
  });

  constructor() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const editorId = parseInt(idParam, 10);
      this.editorId.set(editorId);
      this.loadEditor(editorId);
      this.loadGames(editorId);
    }
  }

  loadEditor(id: number) {
    this.editorService.findById(id).subscribe({
      next: (editor) => this.editor.set(editor),
      error: (err) => console.error('Erreur chargement éditeur:', err)
    });
  }

  loadGames(editorId: number) {
    this.gameService.getGamesByEditor(editorId).subscribe({
      next: (games) => {
        this.games.set(games);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erreur chargement jeux:', err);
        this.loading.set(false);
      }
    });
  }

  onEditGame(game: Game) {
    this.gameToEdit.set(game);
  }

  onFormClosed() {
    this.gameToEdit.set(null);
    this.loadGames(this.editorId());
  }

  deleteGame(id: number) {
    const confirmDelete = confirm('Êtes-vous sûr de vouloir supprimer ce jeu ?');
    if (confirmDelete) {
      this.gameService.deleteGame(id).subscribe({
        next: () => this.loadGames(this.editorId()),
        error: (err) => console.error('Erreur suppression:', err)
      });
    }
  }

  getGameTypeLabel(id: number): string {
    const types: Record<number, string> = {
      1: 'Ambiance',
      2: 'Cartes',
      3: 'Stratégie',
      4: 'Puzzle'
    };
    return types[id] || 'Autre';
  }

  goBack() {
    this.router.navigate(['/editor-list']);
  }
}

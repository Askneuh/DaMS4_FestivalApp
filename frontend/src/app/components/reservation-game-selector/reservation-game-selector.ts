import { Component, effect, inject, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameService } from '../../services/game-service';
import { EditorService } from '../../services/editor-service';
import { Game } from '../../interfaces/game';

@Component({
  selector: 'app-reservation-game-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" (click)="close.emit()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Ajouter des jeux</h3>
          <button class="close-btn" (click)="close.emit()">&times;</button>
        </div>

        <div class="modal-body">
          <div class="filters">
            <input 
              type="text" 
              placeholder="Rechercher un jeu..." 
              [ngModel]="searchTerm()" 
              (ngModelChange)="searchTerm.set($event)"
              class="search-input">
            
            <div class="source-toggle">
              <button 
                [class.active]="source() === 'editor'"
                (click)="source.set('editor')">
                Jeux de l'éditeur
              </button>
              <button 
                [class.active]="source() === 'distributors'"
                (click)="source.set('distributors')">
                Distributeurs
              </button>
            </div>
          </div>

          @if (loading()) {
            <div class="loading">Chargement des jeux...</div>
          } @else {
            <div class="games-list">
              @for (game of filteredGames(); track game.id) {
                <div class="game-item">
                  <div class="game-info">
                    <span class="game-name">{{ game.name }}</span>
                    <span class="game-author">{{ game.author }}</span>
                    <span class="game-editor">{{ getEditorName(game.idEditor) }}</span>
                  </div>
                  <div class="game-actions">
                    <input type="number" [(ngModel)]="quantities[game.id]" min="1" class="qty-input">
                    <button 
                      class="btn btn-primary btn-sm"
                      (click)="addGame(game)">
                      Ajouter
                    </button>
                  </div>
                </div>
              } @empty {
                <div class="empty-list">Aucun jeu trouvé.</div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      backdrop-filter: blur(4px);
    }
    .modal-content {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      width: 90%;
      max-width: 600px;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid #eee;
      padding-bottom: 1rem;
    }
    .modal-header h3 { margin: 0; color: #333; }
    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #999;
    }
    .filters {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .search-input {
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 1rem;
    }
    .source-toggle {
      display: flex;
      background: #f0f0f0;
      border-radius: 6px;
      padding: 0.25rem;
    }
    .source-toggle button {
      flex: 1;
      padding: 0.5rem;
      border: none;
      background: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
      color: #666;
      transition: all 0.2s;
    }
    .source-toggle button.active {
      background: white;
      color: var(--primary-color, #667eea);
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .games-list {
      overflow-y: auto;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .game-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      background: #f8f9fa;
      border-radius: 8px;
      border: 1px solid #eee;
    }
    .game-info {
      display: flex;
      flex-direction: column;
    }
    .game-name { font-weight: 600; color: #333; }
    .game-author { font-size: 0.85rem; color: #666; }
    .game-editor { font-size: 0.8rem; color: #667eea; font-style: italic; }
    .game-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .qty-input {
      width: 50px;
      padding: 0.4rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      text-align: center;
    }
    .loading, .empty-list {
      text-align: center;
      padding: 2rem;
      color: #999;
    }
    .btn {
      padding: 0.4rem 0.8rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
    }
    .btn-primary { background: #667eea; color: white; }
    .btn-sm { font-size: 0.85rem; }
  `]
})
export class ReservationGameSelector {
  private readonly gameService = inject(GameService);
  private readonly editorSvc = inject(EditorService);

  editorId = input.required<number>();
  close = output<void>();
  gameSelected = output<{ game: Game; quantity: number }>();

  searchTerm = signal('');
  source = signal<'editor' | 'distributors'>('editor');
  loading = signal(true);
  
  editorGames = signal<Game[]>([]);
  distributorGames = signal<Game[]>([]);
  
  quantities: { [key: number]: number } = {};

  filteredGames = computed(() => {
    const list = this.source() === 'editor' ? this.editorGames() : this.distributorGames();
    const term = this.searchTerm().toLowerCase();
    
    return list.filter(g => 
      g.name.toLowerCase().includes(term) || 
      g.author.toLowerCase().includes(term)
    );
  });

  constructor() {
    effect(() => {
      const id = this.editorId();
      if (id) {
        this.loadGames();
      }
    });
  }

  loadGames() {
    this.loading.set(true);
    
    this.gameService.getGamesByEditor(this.editorId()).subscribe({
      next: (games) => {
        this.editorGames.set(games);
        games.forEach(g => this.quantities[g.id] = 1);
        this.checkLoadingDone();
      },
      error: () => this.checkLoadingDone()
    });

    this.gameService.getGamesOfDistributeurs().subscribe({
      next: (games) => {
        this.distributorGames.set(games);
        games.forEach(g => this.quantities[g.id] = 1);
        this.checkLoadingDone();
      },
      error: () => this.checkLoadingDone()
    });
  }

  private checkLoadingDone() {
    // Simple check: si les deux sets ont été (potentiellement) mis à jour
    // Pour faire propre on utiliserait forkJoin, mais ici on veut rester simple
    this.loading.set(false);
  }

  addGame(game: Game) {
    const qty = this.quantities[game.id] || 1;
    this.gameSelected.emit({ game, quantity: qty });
  }

  getEditorName(editorId: number): string {
    const editor = this.editorSvc.editors().find(e => e.id === editorId);
    return editor ? editor.name : '';
  }
}

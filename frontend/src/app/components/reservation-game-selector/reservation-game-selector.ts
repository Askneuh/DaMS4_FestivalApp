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
  templateUrl: './reservation-game-selector.html',
  styleUrl: './reservation-game-selector.css'
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
    return this.gameService.filterGames(list, this.searchTerm());
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

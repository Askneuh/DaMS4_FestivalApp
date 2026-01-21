import { Component, computed, inject, Signal, signal, effect } from '@angular/core';
import { FestivalService } from '../../services/festival-service';
import { FestivalGameRow } from '../../interfaces/festival-game-row';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type SortColumn = 'name' | 'author' | 'editorName' | 'gameTypeLabel' | 'reservedQuantity' | 'zoneName';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-festival-games',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './festival-games.html',
  styleUrl: './festival-games.css'
})
export class FestivalGamesComponent {
  private festivalService = inject(FestivalService);

  games = signal<FestivalGameRow[]>([]);
  sortColumn = signal<SortColumn>('name');
  sortDirection = signal<SortDirection>('asc');

  constructor() {
    effect(() => {
      const currentFestival = this.festivalService.currentFestival();
      if (currentFestival) {
        this.loadGames(currentFestival.name);
      }
    });
  }

  loadGames(festivalName: string) {
    this.festivalService.getFestivalGames(festivalName).subscribe({
      next: (data) => this.games.set(data),
      error: (err) => console.error('Erreur chargement jeux festival', err)
    });
  }

  sortedGames = computed(() => {
    const list = this.games();
    const col = this.sortColumn();
    const dir = this.sortDirection();

    return [...list].sort((a, b) => {
      let valA: any = a[col as keyof FestivalGameRow];
      let valB: any = b[col as keyof FestivalGameRow];

      // Special handling for zone names (array)
      if (col === 'zoneName') {
        valA = a.planAreas.map(z => z.name).join(', ');
        valB = b.planAreas.map(z => z.name).join(', ');
      }

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return dir === 'asc' ? -1 : 1;
      if (valA > valB) return dir === 'asc' ? 1 : -1;
      return 0;
    });
  });

  sort(column: SortColumn) {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  getSortIcon(column: SortColumn): string {
    if (this.sortColumn() !== column) return '↕';
    return this.sortDirection() === 'asc' ? '↑' : '↓';
  }
}

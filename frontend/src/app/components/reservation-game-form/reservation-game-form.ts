import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservationGame } from '../../interfaces/reservation-game';
import { ReservationGameSelector } from '../reservation-game-selector/reservation-game-selector';
import { Game } from '../../interfaces/game';

@Component({
  selector: 'app-reservation-game-form',
  standalone: true,
  imports: [CommonModule, ReservationGameSelector],
  templateUrl: './reservation-game-form.html',
  styleUrl: './reservation-game-form.css',
})
export class ReservationGameForm {
  readonly games = input.required<ReservationGame[]>();
  readonly editorId = input.required<number>();

  readonly gameAdded = output<{ game: Game; quantity: number }>();
  readonly gameRemoved = output<number>();
  readonly quantityChanged = output<{ gameId: number; quantity: number }>();
  readonly placementToggled = output<ReservationGame>();

  showGameSelector = signal(false);

  onAddGame(event: { game: Game; quantity: number }) {
    this.gameAdded.emit(event);
    this.showGameSelector.set(false);
  }

  onRemoveGame(gameId: number) {
    if (confirm("Retirer ce jeu de la réservation ?")) {
      this.gameRemoved.emit(gameId);
    }
  }

  onQuantityChange(gameId: number, event: Event) {
    const qty = +(event.target as HTMLInputElement).value;
    this.quantityChanged.emit({ gameId, quantity: qty });
  }

  onTogglePlaced(game: ReservationGame) {
    this.placementToggled.emit(game);
  }
}

import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Game } from '../../interfaces/game';
import { GameService } from '../../services/game-service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-game-form',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './game-form.html',
  styleUrl: './game-form.css',
})
export class GameFormComponent {
  private gameService = inject(GameService);
  gameToEdit = input<Game | null>(null);
  idEditor = input.required<number>();
  formClosed = output<void>();

  showForm = signal(false);

  gameForm = new FormGroup({
    id: new FormControl<number>(0, { nonNullable: true }),
    name: new FormControl<string>('', { 
      nonNullable: true, 
      validators: [Validators.required, Validators.minLength(2)] 
    }),
    author: new FormControl<string>('', { 
      nonNullable: true, 
      validators: [Validators.required] 
    }),
    nbMinPlayer: new FormControl<number>(1, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
    nbMaxPlayer: new FormControl<number>(4, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
    idGameType: new FormControl<number>(1, { nonNullable: true, validators: [Validators.required] }),
    minimumAge: new FormControl<number>(6, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    duration: new FormControl<number>(30, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
    prototype: new FormControl<boolean>(false, { nonNullable: true }),
    theme: new FormControl<string>('', { nonNullable: true }),
    description: new FormControl<string>('', { nonNullable: true }),
    gameNotice: new FormControl<string>('', { nonNullable: true }),
    gameImage: new FormControl<string>('', { nonNullable: true }),
    rulesTutorial: new FormControl<string>('', { nonNullable: true }),
    edition: new FormControl<number>(2024, { nonNullable: true }),
    idEditor: new FormControl<number>(0, { nonNullable: true })
  });

  constructor() {
    effect(() => {
      const game = this.gameToEdit();
      if (game) {
        this.gameForm.patchValue({
          id: game.id,
          name: game.name,
          author: game.author,
          nbMinPlayer: game.nbMinPlayer,
          nbMaxPlayer: game.nbMaxPlayer,
          idGameType: game.idGameType,
          minimumAge: game.minimumAge,
          duration: game.duration,
          prototype: game.prototype,
          theme: game.theme || '',
          description: game.description || '',
          gameNotice: game.gameNotice || '',
          gameImage: game.gameImage || '',
          rulesTutorial: game.rulesTutorial || '',
          edition: game.edition || 2024,
          idEditor: game.idEditor
        });
        this.showForm.set(true);
      }
    });

    effect(() => {
      const editorId = this.idEditor();
      if (editorId) {
        this.gameForm.patchValue({ idEditor: editorId });
      }
    });
  }

  OpenCloseForm() {
    this.showForm.update(v => !v);
    if (!this.showForm()) {
      this.resetForm();
    }
  }

  onSubmit() {
    if (this.gameForm.valid) {
      const formValue = this.gameForm.getRawValue();
      const game: Game = {
        id: formValue.id,
        name: formValue.name,
        author: formValue.author,
        nbMinPlayer: formValue.nbMinPlayer,
        nbMaxPlayer: formValue.nbMaxPlayer,
        idGameType: formValue.idGameType,
        minimumAge: formValue.minimumAge,
        duration: formValue.duration,
        prototype: formValue.prototype,
        theme: formValue.theme,
        description: formValue.description,
        gameNotice: formValue.gameNotice,
        gameImage: formValue.gameImage,
        rulesTutorial: formValue.rulesTutorial,
        edition: formValue.edition,
        idEditor: formValue.idEditor
      };

      if (this.gameToEdit() && this.gameToEdit()!.id !== 0) {
        this.gameService.updateGame(game.id, game).subscribe({
          next: () => {
            this.resetForm();
            this.showForm.set(false);
            this.formClosed.emit();
          },
          error: (err) => {
            console.error('Erreur mise à jour:', err);
            alert('Erreur MAJ: ' + (err.error?.error || 'Erreur inconnue'));
          }
        });
      } else {
        this.gameService.addGame(game).subscribe({
          next: () => {
            this.resetForm();
            this.showForm.set(false);
            this.formClosed.emit();
          },
          error: (err: any) => {
            console.error('Erreur création:', err);
            alert('Erreur Création: ' + (err.error?.error || JSON.stringify(err.error) || 'Erreur inconnue'));
          }
        });
      }
    }
  }

  resetForm() {
    this.gameForm.reset({
      id: 0,
      name: '',
      author: '',
      nbMinPlayer: 1,
      nbMaxPlayer: 4,
      idGameType: 1,
      minimumAge: 6,
      duration: 30,
      prototype: false,
      theme: '',
      description: '',
      gameNotice: '',
      gameImage: '',
      rulesTutorial: '',
      edition: 2024,
      idEditor: this.idEditor()
    });
  }

  isEditMode(): boolean {
    return this.gameToEdit() !== null && this.gameToEdit()!.id !== 0;
  }
}

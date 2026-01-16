import { Component, Input, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Game } from '../../interfaces/game';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FestivalService } from '../../services/festival-service';
import { EditorService } from '../../services/editor-service';
import { GameServiceTemp } from '../../services/game-service-temp';
import { ReservationService } from '../../services/reservation-service';
import { Editor } from '../../interfaces/editor';
import { Reservation } from '../../interfaces/reservation';

export interface ContactEntry {
  date: Date;
  comment: string;
}

@Component({
  selector: 'app-reservation-workflow',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatFormField, MatLabel, MatInputModule],
  templateUrl: './reservation-workflow.html',
  styleUrl: './reservation-workflow.css',
})
export class ReservationWorkflow implements OnInit {
  private fb = inject(FormBuilder);
  editeurName: string = "Éditeur de test";
  readonly festival_svc = inject(FestivalService);
  readonly editor_svc = inject(EditorService);
  readonly game_svc = inject(GameServiceTemp);
  readonly reservation_svc = inject(ReservationService);

  reservation: Reservation | null = null; // Will hold the actual ReservationDAO data
  editeur: Editor | null = null; // Will hold the actual EditorDAO data

  reservationForm!: FormGroup;
  isEditing = signal(false);

  // On utilise des signaux pour la réactivité du calcul sans ngModel
  smallTablesPrice = 10;
  bigTablesPrice = 20;
  mairieTablesPrice = 5;

  contactDates: ContactEntry[] = [
    { date: new Date('2025-11-20'), comment: 'Premier contact par mail' }
  ];
  newContactComment: string = '';

  games: Game[] = []; // Array to hold games for this reservation

  constructor() { }

  private initializeFormWithDefaults(): void {
    this.reservationForm = this.fb.group({
      status: ['Discussion'],
      listeDemandee: [false],
      listeRecue: [false],
      jeuxRecus: [false],
      nbPetitesTables: [0],
      nbGrandesTables: [0],
      nbTablesMairie: [0],
      typeAnimateur: ['editeur']
    });
  }

  ngOnInit(): void {
    // Subscribe to the observable to get the actual reservation data
    this.reservation_svc.getReservationById(1).subscribe({
      next: (data) => {
        this.reservation = data;

        // Initialize the form with the fetched data
        this.reservationForm = this.fb.group({
          status: [this.reservation.status],
          listeDemandee: [this.reservation.listeDemandee],
          listeRecue: [this.reservation.listeRecue],
          jeuxRecus: [this.reservation.jeuxRecus],
          nbPetitesTables: [this.reservation.nbSmallTables],
          nbGrandesTables: [this.reservation.nbLargeTables],
          nbTablesMairie: [this.reservation.nbCityHallTables],
          typeAnimateur: ['editeur']
        });

        // Load the editor for this reservation
        this.editor_svc.findById(this.reservation.idEditor).subscribe({
          next: (editorData) => {
            this.editeur = editorData;
          },
          error: (err) => {
            console.error('Error fetching editor:', err);
          }
        });
      },
      error: (err) => {
        console.error('❌ Error fetching reservation:', err);
        console.error('❌ Error status:', err.status);
        console.error('❌ Error message:', err.message);
        // Initialize form with default values if fetch fails
        this.initializeFormWithDefaults();
      }
    });
  }


  // Getter pour faciliter l'accès aux valeurs du formulaire dans le template
  get formValues() {
    return this.reservationForm.value;
  }

  onSubmitLogistics() {
    const v = this.reservationForm.value;
    this.isEditing.set(false);

    // Ensure reservation exists and has required IDs
    if (!this.reservation?.idReservation || !this.reservation?.idEditor) {
      console.error('❌ Impossible de mettre à jour: réservation invalide');
      return;
    }

    const updatedReservation: Reservation = {
      idReservation: this.reservation.idReservation,
      idEditor: this.reservation.idEditor,
      status: v.status,
      listeDemandee: v.listeDemandee,
      listeRecue: v.listeRecue,
      jeuxRecus: v.jeuxRecus,
      nbSmallTables: v.nbPetitesTables,
      nbLargeTables: v.nbGrandesTables,
      nbCityHallTables: v.nbTablesMairie,
      remise: this.reservation.remise,
      typeAnimateur: v.typeAnimateur === 'editeur' ? 1 : 0,
      festivalName: this.reservation.festivalName,
      idTZ: this.reservation.idTZ
    };

    this.reservation_svc.updateReservation(this.reservation.idReservation, updatedReservation).subscribe({
      next: () => {
        // Update local reservation object
        this.reservation = updatedReservation;
        console.log('✅ Réservation mise à jour avec succès');
      },
      error: (err) => {
        console.error('❌ Erreur lors de la mise à jour:', err);
      }
    });
  }

  toggleEdit() {
    this.isEditing.set(true);
    // Synchronize form with current reservation data
    this.reservationForm.patchValue({
      status: this.reservation?.status,
      listeDemandee: this.reservation?.listeDemandee,
      listeRecue: this.reservation?.listeRecue,
      jeuxRecus: this.reservation?.jeuxRecus,
      nbPetitesTables: this.reservation?.nbSmallTables,
      nbGrandesTables: this.reservation?.nbLargeTables,
      nbTablesMairie: this.reservation?.nbCityHallTables,
      typeAnimateur: this.reservation?.typeAnimateur === 0 ? 'benevole' : 'editeur'
    });
  }

  addContactDate() {
    this.contactDates.push({
      date: new Date(),
      comment: this.newContactComment || 'Relance sans commentaire'
    });
    this.newContactComment = ''; // Reset le champ
    // TODO: Update backend (table suiviReservation)
  }

  onStatusChange() {
    const status = this.reservationForm.get('status')?.value;
    console.log("Nouveau statut :", status);
    // TODO: Trigger logique de facturation si statut === 'Facture'
  }
}

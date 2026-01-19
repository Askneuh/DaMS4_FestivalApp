import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FestivalService } from '../../services/festival-service';
import { GameService } from '../../services/game-service';
import { ReservationService } from '../../services/reservation-service';
import { EditorService } from '../../services/editor-service';
import { TariffZoneService } from '../../services/tariff-zone-service';
import { FestivalGameService } from '../../services/festival-game-service';
import { ContactService } from '../../services/contact-service';
import { Festival } from '../../interfaces/festival';
import { Game } from '../../interfaces/game';
import { ReservationDAO } from '../../interfaces/reservationDAO';
import { Reservation } from '../../interfaces/reservation';
import { Editor } from '../../interfaces/editor';
import { TariffZone } from '../../interfaces/tariff-zone';
import { Mechanism } from '../../interfaces/mechanism';

interface TestResult {
    serviceName: string;
    methodName: string;
    timestamp: Date;
    success: boolean;
    data?: any;
    error?: string;
    duration?: number;
}

@Component({
    selector: 'app-test-service',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './test-service.html',
    styleUrls: ['./test-service.css']
})
export class TestService {
  readonly festivalSvc = inject(FestivalService);
  readonly gameSvc = inject(GameService);
  readonly reservationSvc = inject(ReservationService);
  readonly editorSvc = inject(EditorService);
  readonly tariffZoneSvc = inject(TariffZoneService);
  readonly festivalGameSvc = inject(FestivalGameService);
  readonly contactSvc = inject(ContactService);

    // Test results and logs
    testResults = signal<TestResult[]>([]);
    activeSection = signal<string>('festivals');

    // Input parameters for tests
    festivalNameInput = signal<string>('Festival-Rose');
    gameIdInput = signal<number>(1);
    editorIdInput = signal<number>(1);
    reservationIdInput = signal<number>(1);
    tariffZoneIdInput = signal<number>(1);

    // Test data storage
    lastTestData = signal<any>(null);
    isLoading = signal<boolean>(false);

    totalTests = computed(() => this.testResults().length);
    passedTests = computed(() => this.testResults().filter(r => r.success).length);
    failedTests = computed(() => this.testResults().filter(r => !r.success).length);

    setActiveSection(section: string) {
        this.activeSection.set(section);
    }

    clearResults() {
        this.testResults.set([]);
        this.lastTestData.set(null);
    }

    private logTestResult(serviceName: string, methodName: string, success: boolean, data?: any, error?: string, duration?: number) {
        const result: TestResult = {
            serviceName,
            methodName,
            timestamp: new Date(),
            success,
            data,
            error,
            duration
        };
        this.testResults.update(results => [result, ...results]);
        this.lastTestData.set(data);
        console.log(`${success ? '✅' : '❌'} ${serviceName}.${methodName}`, data || error);
    }

    // ==================== FESTIVAL SERVICE TESTS ====================

    testFindFestivalByName() {
        const name = this.festivalNameInput();
        this.isLoading.set(true);
        const startTime = Date.now();

        this.festivalSvc.findByName(name).subscribe({
            next: (data) => {
                const duration = Date.now() - startTime;
                this.logTestResult('FestivalService', 'findByName', true, data, undefined, duration);
                this.isLoading.set(false);
            },
            error: (err) => {
                const duration = Date.now() - startTime;
                this.logTestResult('FestivalService', 'findByName', false, undefined, err.message, duration);
                this.isLoading.set(false);
            }
        });
    }

    testLoadAllFestivals() {
        this.isLoading.set(true);
        const startTime = Date.now();

        this.festivalSvc.loadFestivalsFromBD();

        // Wait a bit for the data to load
        setTimeout(() => {
            const data = this.festivalSvc.festivalList();
            const duration = Date.now() - startTime;
            this.logTestResult('FestivalService', 'loadFestivalsFromBD', true, data, undefined, duration);
            this.isLoading.set(false);
        }, 500);
    }

    // ==================== GAME SERVICE TESTS ====================

    testFindGameById() {
        const id = this.gameIdInput();
        this.isLoading.set(true);
        const startTime = Date.now();

        this.gameSvc.findById(id).subscribe({
            next: (data) => {
                const duration = Date.now() - startTime;
                this.logTestResult('GameService', 'findById', true, data, undefined, duration);
                this.isLoading.set(false);
            },
            error: (err) => {
                const duration = Date.now() - startTime;
                this.logTestResult('GameService', 'findById', false, undefined, err.message, duration);
                this.isLoading.set(false);
            }
        });
    }

    testGetGamesByEditor() {
        const idEditor = this.editorIdInput();
        this.isLoading.set(true);
        const startTime = Date.now();

        this.gameSvc.getGamesByEditor(idEditor).subscribe({
            next: (data) => {
                const duration = Date.now() - startTime;
                this.logTestResult('GameService', 'getGamesByEditor', true, data, undefined, duration);
                this.isLoading.set(false);
            },
            error: (err) => {
                const duration = Date.now() - startTime;
                this.logTestResult('GameService', 'getGamesByEditor', false, undefined, err.message, duration);
                this.isLoading.set(false);
            }
        });
    }

    testGetGamesThatEditorDontHave() {
        const idEditor = this.editorIdInput();
        this.isLoading.set(true);
        const startTime = Date.now();

        this.gameSvc.getGamesThatEditorDontHave(idEditor).subscribe({
            next: (data) => {
                const duration = Date.now() - startTime;
                this.logTestResult('GameService', 'getGamesThatEditorDontHave', true, data, undefined, duration);
                this.isLoading.set(false);
            },
            error: (err) => {
                const duration = Date.now() - startTime;
                this.logTestResult('GameService', 'getGamesThatEditorDontHave', false, undefined, err.message, duration);
                this.isLoading.set(false);
            }
        });
    }

    testGetMechanismsByGame() {
        const idGame = this.gameIdInput();
        this.isLoading.set(true);
        const startTime = Date.now();

        this.gameSvc.getMechanismsByGame(idGame).subscribe({
            next: (data) => {
                const duration = Date.now() - startTime;
                this.logTestResult('GameService', 'getMechanismsByGame', true, data, undefined, duration);
                this.isLoading.set(false);
            },
            error: (err) => {
                const duration = Date.now() - startTime;
                this.logTestResult('GameService', 'getMechanismsByGame', false, undefined, err.message, duration);
                this.isLoading.set(false);
            }
        });
    }

    testGetGameTypeLabel() {
        const idGameType = 1; // Default game type
        this.isLoading.set(true);
        const startTime = Date.now();

        this.gameSvc.getGameTypeLabel(idGameType).subscribe({
            next: (data) => {
                const duration = Date.now() - startTime;
                this.logTestResult('GameService', 'getGameTypeLabel', true, data, undefined, duration);
                this.isLoading.set(false);
            },
            error: (err) => {
                const duration = Date.now() - startTime;
                this.logTestResult('GameService', 'getGameTypeLabel', false, undefined, err.message, duration);
                this.isLoading.set(false);
            }
        });
    }

    testLoadAllGames() {
        this.isLoading.set(true);
        const startTime = Date.now();

        this.gameSvc.loadGamesFromBD();

        setTimeout(() => {
            const data = this.gameSvc.gameList();
            const duration = Date.now() - startTime;
            this.logTestResult('GameService', 'loadGamesFromBD', true, data, undefined, duration);
            this.isLoading.set(false);
        }, 500);
    }

    // ==================== EDITOR SERVICE TESTS ====================

    testFindEditorById() {
        const id = this.editorIdInput();
        this.isLoading.set(true);
        const startTime = Date.now();

        this.editorSvc.findById(id).subscribe({
            next: (data) => {
                const duration = Date.now() - startTime;
                this.logTestResult('EditorService', 'findById', true, data, undefined, duration);
                this.isLoading.set(false);
            },
            error: (err) => {
                const duration = Date.now() - startTime;
                this.logTestResult('EditorService', 'findById', false, undefined, err.message, duration);
                this.isLoading.set(false);
            }
        });
    }

    testLoadAllEditors() {
        this.isLoading.set(true);
        const startTime = Date.now();

        this.editorSvc.loadEditorsFromBD();

        setTimeout(() => {
            const data = this.editorSvc.editors();
            const duration = Date.now() - startTime;
            this.logTestResult('EditorService', 'loadEditorsFromBD', true, data, undefined, duration);
            this.isLoading.set(false);
        }, 500);
    }

    // ==================== RESERVATION SERVICE TESTS ====================

    testGetReservationById() {
        const id = this.reservationIdInput();
        this.isLoading.set(true);
        const startTime = Date.now();

        this.reservationSvc.getReservationById(id).subscribe({
            next: (data) => {
                const duration = Date.now() - startTime;
                this.logTestResult('ReservationService', 'getReservationById', true, data, undefined, duration);
                this.isLoading.set(false);
            },
            error: (err) => {
                const duration = Date.now() - startTime;
                this.logTestResult('ReservationService', 'getReservationById', false, undefined, err.message, duration);
                this.isLoading.set(false);
            }
        });
    }

    testGetReservationsByEditor() {
        const idEditor = this.editorIdInput();
        this.isLoading.set(true);
        const startTime = Date.now();

        this.reservationSvc.getReservationsByEditor(idEditor).subscribe({
            next: (data) => {
                const duration = Date.now() - startTime;
                this.logTestResult('ReservationService', 'getReservationsByEditor', true, data, undefined, duration);
                this.isLoading.set(false);
            },
            error: (err) => {
                const duration = Date.now() - startTime;
                this.logTestResult('ReservationService', 'getReservationsByEditor', false, undefined, err.message, duration);
                this.isLoading.set(false);
            }
        });
    }

    testGetReservationsByFestival() {
        const festivalName = this.festivalNameInput();
        this.isLoading.set(true);
        const startTime = Date.now();

        this.reservationSvc.getReservationsByFestival(festivalName).subscribe({
            next: (data) => {
                const duration = Date.now() - startTime;
                this.logTestResult('ReservationService', 'getReservationsByFestival', true, data, undefined, duration);
                this.isLoading.set(false);
            },
            error: (err) => {
                const duration = Date.now() - startTime;
                this.logTestResult('ReservationService', 'getReservationsByFestival', false, undefined, err.message, duration);
                this.isLoading.set(false);
            }
        });
    }

    // ==================== TARIFF ZONE SERVICE TESTS ====================

    testFindTariffZoneById() {
        const id = this.tariffZoneIdInput();
        this.isLoading.set(true);
        const startTime = Date.now();

        this.tariffZoneSvc.findById(id).subscribe({
            next: (data) => {
                const duration = Date.now() - startTime;
                this.logTestResult('TariffZoneService', 'findById', true, data, undefined, duration);
                this.isLoading.set(false);
            },
            error: (err) => {
                const duration = Date.now() - startTime;
                this.logTestResult('TariffZoneService', 'findById', false, undefined, err.message, duration);
                this.isLoading.set(false);
            }
        });
    }

    testFindTariffZonesByFestival() {
        const festivalName = this.festivalNameInput();
        this.isLoading.set(true);
        const startTime = Date.now();

        this.tariffZoneSvc.findByFestivalName(festivalName).subscribe({
            next: (data) => {
                const duration = Date.now() - startTime;
                this.logTestResult('TariffZoneService', 'findByFestivalName', true, data, undefined, duration);
                this.isLoading.set(false);
            },
            error: (err) => {
                const duration = Date.now() - startTime;
                this.logTestResult('TariffZoneService', 'findByFestivalName', false, undefined, err.message, duration);
                this.isLoading.set(false);
            }
        });
    }

    testLoadTariffZonesByFestival() {
        const festivalName = this.festivalNameInput();
        this.isLoading.set(true);
        const startTime = Date.now();

        this.tariffZoneSvc.loadTariffZonesByFestival(festivalName);

        setTimeout(() => {
            const data = this.tariffZoneSvc.tariffZoneList();
            const duration = Date.now() - startTime;
            this.logTestResult('TariffZoneService', 'loadTariffZonesByFestival', true, data, undefined, duration);
            this.isLoading.set(false);
        }, 500);
    }

    // ==================== FESTIVAL GAME SERVICE TESTS ====================

    testGetGamesByFestival() {
        const festivalName = this.festivalNameInput();
        this.isLoading.set(true);
        const startTime = Date.now();

        this.festivalGameSvc.getGamesByFestival(festivalName).subscribe({
            next: (data) => {
                const duration = Date.now() - startTime;
                this.logTestResult('FestivalGameService', 'getGamesByFestival', true, data, undefined, duration);
                this.isLoading.set(false);
            },
            error: (err) => {
                const duration = Date.now() - startTime;
                this.logTestResult('FestivalGameService', 'getGamesByFestival', false, undefined, err.message, duration);
                this.isLoading.set(false);
            }
        });
    }

    testGetGamesByReservation() {
        const reservationId = this.reservationIdInput();
        this.isLoading.set(true);
        const startTime = Date.now();

        this.festivalGameSvc.getGamesByReservation(reservationId).subscribe({
            next: (data) => {
                const duration = Date.now() - startTime;
                this.logTestResult('FestivalGameService', 'getGamesByReservation', true, data, undefined, duration);
                this.isLoading.set(false);
            },
            error: (err) => {
                const duration = Date.now() - startTime;
                this.logTestResult('FestivalGameService', 'getGamesByReservation', false, undefined, err.message, duration);
                this.isLoading.set(false);
            }
        });
    }

    testAddGameToReservation() {
        const reservationId = this.reservationIdInput();
        const gameId = this.gameIdInput();
        this.isLoading.set(true);
        const startTime = Date.now();

        this.festivalGameSvc.addGameToReservation(reservationId, gameId).subscribe({
            next: (data) => {
                const duration = Date.now() - startTime;
                this.logTestResult('FestivalGameService', 'addGameToReservation', true, data, undefined, duration);
                this.isLoading.set(false);
            },
            error: (err) => {
                const duration = Date.now() - startTime;
                this.logTestResult('FestivalGameService', 'addGameToReservation', false, undefined, err.message, duration);
                this.isLoading.set(false);
            }
        });
    }

    testRemoveGameFromReservation() {
        const reservationId = this.reservationIdInput();
        const gameId = this.gameIdInput();
        this.isLoading.set(true);
        const startTime = Date.now();

        this.festivalGameSvc.removeGameFromReservation(reservationId, gameId).subscribe({
            next: (data) => {
                const duration = Date.now() - startTime;
                this.logTestResult('FestivalGameService', 'removeGameFromReservation', true, data, undefined, duration);
                this.isLoading.set(false);
            },
            error: (err) => {
                const duration = Date.now() - startTime;
                this.logTestResult('FestivalGameService', 'removeGameFromReservation', false, undefined, err.message, duration);
                this.isLoading.set(false);
            }
        });
    }

    // ==================== CONTACT SERVICE TESTS ====================

    testGetContactsByEditor() {
        const idEditor = this.editorIdInput();
        this.isLoading.set(true);
        const startTime = Date.now();

        this.contactSvc.getContactsByEditor(idEditor);

        setTimeout(() => {
            const data = this.contactSvc.contacts();
            const duration = Date.now() - startTime;
            this.logTestResult('ContactService', 'getContactsByEditor', true, data, undefined, duration);
            this.isLoading.set(false);
        }, 500);
    }

/*     testGetPriorityContact() {
        const idEditor = this.editorIdInput();
        this.isLoading.set(true);
        const startTime = Date.now();

        this.contactSvc.getPriorityContact(idEditor).subscribe({
            next: (data) => {
                const duration = Date.now() - startTime;
                this.logTestResult('ContactService', 'getPriorityContact', true, data, undefined, duration);
                this.isLoading.set(false);
            },
            error: (err) => {
                const duration = Date.now() - startTime;
                this.logTestResult('ContactService', 'getPriorityContact', false, undefined, err.message, duration);
                this.isLoading.set(false);
            }
        });
    } */
}

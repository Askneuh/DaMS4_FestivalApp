import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FestivalService } from '../../services/festival-service';
import { GameService } from '../../services/game-service';
import { ReservationService } from '../../services/reservation-service';
import { EditorService } from '../../services/editor-service';
import { TariffZoneService } from '../../services/tariff-zone-service';
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
    // Services
    private festivalService = inject(FestivalService);
    private gameService = inject(GameService);
    private reservationService = inject(ReservationService);
    private editorService = inject(EditorService);
    private tariffZoneService = inject(TariffZoneService);

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

    // Statistics
    get totalTests(): number {
        return this.testResults().length;
    }

    get passedTests(): number {
        return this.testResults().filter(r => r.success).length;
    }

    get failedTests(): number {
        return this.testResults().filter(r => !r.success).length;
    }

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

        this.festivalService.findByName(name).subscribe({
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

        this.festivalService.loadFestivalsFromBD();

        // Wait a bit for the data to load
        setTimeout(() => {
            const data = this.festivalService.festivalList();
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

        this.gameService.findById(id).subscribe({
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

        this.gameService.getGamesByEditor(idEditor).subscribe({
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

        this.gameService.getGamesThatEditorDontHave(idEditor).subscribe({
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

        this.gameService.getMechanismsByGame(idGame).subscribe({
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

        this.gameService.getGameTypeLabel(idGameType).subscribe({
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

        this.gameService.loadGamesFromBD();

        setTimeout(() => {
            const data = this.gameService.gameList();
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

        this.editorService.findById(id).subscribe({
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

        this.editorService.loadEditorsFromBD();

        setTimeout(() => {
            const data = this.editorService.editors();
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

        this.reservationService.getReservationById(id).subscribe({
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

        this.reservationService.getReservationsByEditor(idEditor).subscribe({
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

        this.reservationService.getReservationsByFestival(festivalName).subscribe({
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

        this.tariffZoneService.findById(id).subscribe({
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

        this.tariffZoneService.findByFestivalName(festivalName).subscribe({
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

        this.tariffZoneService.loadTariffZonesByFestival(festivalName);

        setTimeout(() => {
            const data = this.tariffZoneService.tariffZoneList();
            const duration = Date.now() - startTime;
            this.logTestResult('TariffZoneService', 'loadTariffZonesByFestival', true, data, undefined, duration);
            this.isLoading.set(false);
        }, 500);
    }
}

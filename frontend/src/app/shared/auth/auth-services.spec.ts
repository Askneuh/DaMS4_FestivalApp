import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth-services';
import { environment } from '../../../environment/environment';

describe('AuthService', () => {
    let service: AuthService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [AuthService]
        });
        service = TestBed.inject(AuthService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should have initial state', () => {
        expect(service.currentUser()).toBeNull();
        expect(service.isLoggedIn()).toBe(false);
        expect(service.isAdmin()).toBe(false);
        expect(service.isLoading()).toBe(false);
    });

    it('should login successfully', () => {
        const mockUser = { login: 'test', role: 'organizer' };
        service.login('test', 'password');

        const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
        expect(req.request.method).toBe('POST');
        req.flush({ user: mockUser });

        expect(service.currentUser()).toEqual(mockUser as any);
        expect(service.isLoggedIn()).toBe(true);
        expect(service.isLoading()).toBe(false);
    });

    it('should logout correctly', () => {
        service.logout();
        const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
        expect(req.request.method).toBe('POST');
        req.flush({});
        expect(service.currentUser()).toBeNull();
    });
});

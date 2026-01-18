import { Injectable, inject, signal, WritableSignal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserDto } from '../interfaces/user-dto';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly http = inject(HttpClient)
  private readonly base = 'https://localhost:4000/api/users'

  private readonly _users: WritableSignal<UserDto[]> = signal<UserDto[]>([])
  readonly users = this._users.asReadonly();

  loadAll(): void {
    this.http.get<UserDto[]>(this.base, { withCredentials: true }).subscribe(data => this._users.set(data))
  }

  createUser(login: string, password: string, role: string = 'visiteur') {
    return this.http.post(
      this.base,
      { login, password, role },
      { withCredentials: true }
    );
  }

  updateUserRole(userId: number, role: string) {
    return this.http.put(
      `${this.base}/${userId}/role`,
      { role },
      { withCredentials: true }
    );
  }

  deleteUser(userId: number) {
    return this.http.delete(
      `${this.base}/${userId}`,
      { withCredentials: true }
    );
  }
}

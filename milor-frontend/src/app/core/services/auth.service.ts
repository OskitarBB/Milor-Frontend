import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { WebSocketService } from './websocket.service';

export type RolUsuario = 'MESERO' | 'ADMIN' | 'SOPORTE' | null;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly webSocketService = inject(WebSocketService);
  private readonly apiUrl = 'https://milor-backend.onrender.com/api/usuarios';

  readonly usuarioActivo = signal<any>(this.obtenerUsuarioInicial());
  readonly rolActual = signal<RolUsuario>(this.usuarioActivo()?.rol || null);

  private obtenerUsuarioInicial() {
    const usr = localStorage.getItem('milor_user');
    return usr ? JSON.parse(usr) : null;
  }

  login(username: string, password: string) {
    return this.http.post<any>(`${this.apiUrl}/login`, { username, password }).pipe(
      tap(user => {
        localStorage.setItem('milor_user', JSON.stringify(user));
        localStorage.setItem('milor_rol', user.rol);
        this.usuarioActivo.set(user);
        this.rolActual.set(user.rol);
        
        this.webSocketService.conectar();
      })
    );
  }

  cerrarSesion(): void {
    this.webSocketService.desconectar();

    localStorage.removeItem('milor_user');
    localStorage.removeItem('milor_rol');
    this.usuarioActivo.set(null);
    this.rolActual.set(null);
  }

  estaAutenticado(): boolean {
    return this.rolActual() !== null;
  }

  listarUsuarios() {
    return this.http.get<any[]>(this.apiUrl);
  }

  crearUsuario(data: { username: string, password: string, rol: string }) {
    return this.http.post<any>(this.apiUrl, data);
  }

  eliminarUsuario(id: number) {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
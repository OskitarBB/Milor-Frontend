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
  private readonly webSocketService = inject(WebSocketService); // <--- Inyectamos el servicio WebSocket
  private readonly apiUrl = 'http://localhost:8080/api/usuarios';

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
      })
    );
  }

  cerrarSesion(): void {
    // 1. Apagamos y cerramos el WebSocket limpiamente al terminar la sesión
    this.webSocketService.desconectar();

    // 2. Limpiamos el almacenamiento y los estados locales
    localStorage.removeItem('milor_user');
    localStorage.removeItem('milor_rol');
    this.usuarioActivo.set(null);
    this.rolActual.set(null);
  }

  estaAutenticado(): boolean {
    return this.rolActual() !== null;
  }

  // Métodos para que el Admin o Soporte gestionen cuentas
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
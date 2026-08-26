import { Injectable, inject, signal, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { Router } from '@angular/router';
import { WebSocketService } from './websocket.service';

export type RolUsuario = 'MESERO' | 'ADMIN' | 'SOPORTE' | null;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly webSocketService = inject(WebSocketService);
  private readonly router = inject(Router);
  private readonly ngZone = inject(NgZone);
  private readonly apiUrl = 'http://localhost:8080/api/usuarios';

  readonly usuarioActivo = signal<any>(this.obtenerUsuarioInicial());
  readonly rolActual = signal<RolUsuario>(this.usuarioActivo()?.rol || null);
  
  // Señal global para mostrar el modal en cualquier vista actual
  readonly sesionExpiradaModal = signal<boolean>(false);

  private idleTimeout: any;
  private readonly INACTIVITY_LIMIT = 20 * 60 * 1000; 

  constructor() {
    if (this.estaAutenticado()) {
      this.iniciarControlInactividad();
    }
  }

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
        this.iniciarControlInactividad();
      })
    );
  }

  cambiarPassword(passwordActual: string, nuevaPassword: string) {
    const usuario = this.usuarioActivo();
    if (!usuario || !usuario.id) {
      throw new Error('No hay una sesión activa');
    }
    return this.http.patch<any>(`${this.apiUrl}/${usuario.id}/password`, {
      passwordActual,
      nuevaPassword
    });
  }

  cerrarSesion(): void {
    this.detenerControlInactividad();
    this.webSocketService.desconectar();
    localStorage.removeItem('milor_user');
    localStorage.removeItem('milor_rol');
    this.usuarioActivo.set(null);
    this.rolActual.set(null);
    this.router.navigate(['/login']);
  }

  confirmarExpiracion(): void {
    this.sesionExpiradaModal.set(false);
    this.cerrarSesion();
  }

  estaAutenticado(): boolean {
    return this.rolActual() !== null;
  }

  private iniciarControlInactividad() {
    this.detenerControlInactividad();
    
    this.ngZone.runOutsideAngular(() => {
      let lastReset = 0;
      const resetTimer = () => {
        const now = Date.now();
        if (now - lastReset > 1000) { // Throttle de 1 segundo
          lastReset = now;
          this.ngZone.run(() => {
            this.reiniciarTimerInactividad();
          });
        }
      };

      window.addEventListener('mousedown', resetTimer);
      window.addEventListener('keydown', resetTimer);
      window.addEventListener('click', resetTimer);
      window.addEventListener('scroll', resetTimer);
      window.addEventListener('touchstart', resetTimer);
    });

    this.reiniciarTimerInactividad();
  }

  private reiniciarTimerInactividad() {
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
    }
    
    if (!this.estaAutenticado()) return;

    this.idleTimeout = setTimeout(() => {
      this.ngZone.run(() => {
        this.sesionExpiradaModal.set(true);
        this.webSocketService.desconectar();
      });
    }, this.INACTIVITY_LIMIT);
  }

  private detenerControlInactividad() {
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
      this.idleTimeout = null;
    }
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
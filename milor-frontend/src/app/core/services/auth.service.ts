import { Injectable, signal } from '@angular/core';

export type RolUsuario = 'MESERO' | 'ADMIN' | 'SOPORTE' | null;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  readonly rolActual = signal<RolUsuario>(this.obtenerRolInicial());

  private obtenerRolInicial(): RolUsuario {
    return (localStorage.getItem('milor_rol') as RolUsuario) || null;
  }

  iniciarSesion(rol: RolUsuario): void {
    if (rol) {
      localStorage.setItem('milor_rol', rol);
      this.rolActual.set(rol);
    }
  }

  cerrarSesion(): void {
    localStorage.removeItem('milor_rol');
    this.rolActual.set(null);
  }

  estaAutenticado(): boolean {
    return this.rolActual() !== null;
  }
}
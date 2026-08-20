import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // 1. Validar si hay sesión activa
  if (!auth.estaAutenticado()) {
    router.navigate(['/login']);
    return false;
  }

  const rol = auth.rolActual();
  const url = state.url;

  // 2. Proteger rutas administrativas (/admin/*)
  if (url.startsWith('/admin')) {
    if (rol === 'MESERO') {
      router.navigate(['/operador']);
      return false;
    }
  }

  // 3. Proteger la ruta del operador
  if (url.startsWith('/operador')) {
    if (rol === 'ADMIN') {
      router.navigate(['/admin/dashboard']);
      return false;
    }
  }

  // 4. Verificación robusta de vigencia del token contra el backend[cite: 1]
  return auth.listarUsuarios().pipe(
    map(() => true),
    catchError(() => {
      localStorage.removeItem('milor_user');
      router.navigate(['/login']);
      return of(false);
    })
  );
};
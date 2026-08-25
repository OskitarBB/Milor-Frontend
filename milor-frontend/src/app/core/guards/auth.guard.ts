// auth.guard.ts
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // 1. Validar si hay sesión activa en el cliente
  if (!auth.estaAutenticado()) {
    router.navigate(['/login']);
    return false;
  }

  const rol = auth.rolActual();
  const url = state.url;

  // 2. Proteger rutas administrativas (/admin/*)
  // Únicamente el rol MESERO tiene prohibido entrar aquí. ADMIN y SOPORTE tienen acceso.
  if (url.startsWith('/admin')) {
    if (rol === 'MESERO') {
      router.navigate(['/operador']);
      return false;
    }
  }

  // 3. Proteger la ruta del operador (/operador)
  // Únicamente el rol ADMIN tiene prohibido entrar aquí. SOPORTE y MESERO tienen acceso.
  if (url.startsWith('/operador')) {
    if (rol === 'ADMIN') {
      router.navigate(['/admin/dashboard']);
      return false;
    }
  }

  // 4. Si pasa todas las validaciones de roles locales, permitimos el acceso
  return true;
};
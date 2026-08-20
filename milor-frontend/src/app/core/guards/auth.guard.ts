import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

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
    // Si es mesero, tiene prohibido entrar a administración
    if (rol === 'MESERO') {
      router.navigate(['/operador']);
      return false;
    }
  }

  // 3. Proteger la ruta del operador
  if (url.startsWith('/operador')) {
    // Si es admin puro (sin soporte), no suele vender, pero si quieres que solo el mesero y soporte tengan operador:
    // (El admin solo ve carta, dashboard e historial, por lo que el admin no entra a operador)
    if (rol === 'ADMIN') {
      router.navigate(['/admin/dashboard']);
      return false;
    }
  }

  return true;
};
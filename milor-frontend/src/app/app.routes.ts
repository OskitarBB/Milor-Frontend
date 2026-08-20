import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login').then(m => m.Login)
  },
  {
    path: 'operador',
    loadComponent: () =>
      import('./features/operador/operador').then(m => m.Operador),
    canActivate: [authGuard] // <--- Protegido
  },
  {
    path: 'admin/carta',
    loadComponent: () =>
      import('./features/admin-carta/admin-carta').then(m => m.AdminCarta),
    canActivate: [authGuard] // <--- Protegido
  },
  {
    path: 'admin/dashboard',
    loadComponent: () =>
      import('./features/admin-dashboard/admin-dashboard').then(m => m.AdminDashboardComponent),
    canActivate: [authGuard] // <--- Protegido
  },
  {
    path: 'admin/historial',
    loadComponent: () => 
      import('./features/historial-dashboard/historial-dashboard').then(m => m.HistorialDashboardComponent),
    canActivate: [authGuard] // <--- Protegido
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
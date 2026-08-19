import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'operador',
    pathMatch: 'full'
  },
  {
    path: 'operador',
    loadComponent: () =>
      import('./features/operador/operador').then(m => m.Operador)
  },
  {
    path: 'admin/carta',
    loadComponent: () =>
      import('./features/admin-carta/admin-carta').then(m => m.AdminCarta)
  },
  {
    path: 'admin/dashboard',
    loadComponent: () =>
      import('./features/admin-dashboard/admin-dashboard').then(m => m.AdminDashboardComponent)
  },
  
  {
    path: 'admin/historial',
loadComponent: () => import('./features/historial-dashboard/historial-dashboard').then(m => m.HistorialDashboardComponent)
  },

  {
    path: '**',
    redirectTo: 'operador'
  }
];
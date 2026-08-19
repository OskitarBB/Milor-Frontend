import { Component, computed, inject } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { MilorService } from '../../core/services/milor.service';

// 1. Declaramos la interfaz para que Angular no marque error en el HTML
interface PlatoResumen {
  id: string;
  nombre: string;
  vendidos: number;
  stockRestante: string;
  activo: boolean; 
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe, DecimalPipe],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css']
})
export class AdminDashboardComponent {
  private readonly milorService = inject(MilorService);

  readonly metricas = computed(() => {
    return this.milorService.metricas() || {
      totalRecaudado: 0,
      totalMenusVendidos: 0,
      totalLocal: 0,
      totalLlevar: 0,
      totalConEntrada: 0,
      totalSinEntrada: 0,
      conteoPorPlato: {},
      ultimasVentas: []
    };
  });

  readonly ventasRecientes = computed(() => {
    return this.metricas().ultimasVentas || [];
  });

  // 2. Aplicamos la interfaz y mapeamos la propiedad 'activo'
  readonly resumenPlatos = computed<PlatoResumen[]>(() => {
    const conteo = this.metricas().conteoPorPlato;
    if (!conteo) return [];
    
    return Object.keys(conteo).map(key => {
      const item: any = conteo[Number(key)] || conteo[key];
      return {
        id: key,
        nombre: item?.nombre || 'Plato',
        vendidos: item?.vendidos || 0,
        stockRestante: item?.stockRestante ?? '0',
        activo: item?.activo ?? true // Extraemos el estado real
      };
    });
  });

  cerrarTurnoActual(): void {
    const confirmacion = window.confirm(
      '¿Estás seguro de cerrar el turno de hoy? \n\nEsto reseteará las estadísticas a cero y archivará las ventas actuales para iniciar un nuevo día.'
    );

    if (confirmacion) {
      this.milorService.cerrarTurno().subscribe({
        next: () => {
          console.log('Turno cerrado exitosamente.');
          // Nota: El dashboard se pondrá en cero automáticamente gracias al WebSocket y al tap() del servicio.
        },
        error: (err) => {
          console.error('Error al cerrar el turno:', err);
          alert('Hubo un problema al intentar cerrar el turno.');
        }
      });
    }
  }
}
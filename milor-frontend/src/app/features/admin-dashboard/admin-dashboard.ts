import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { MilorService } from '../../core/services/milor.service';

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
export class AdminDashboardComponent implements OnInit {
  private readonly milorService = inject(MilorService);

  turnoAbierto = signal<boolean>(false);
  cargandoTurno = signal<boolean>(false);
  
  // Control de modales
  modalAccion = signal<'ABRIR' | 'CERRAR' | null>(null);
  ordenSeleccionadaModal = signal<any | null>(null); // 🔍 Modal para ver detalle de una orden

  ngOnInit(): void {
    this.verificarEstadoTurno();
    this.cargarMetricasAlRecargar(); 
  }

  verificarEstadoTurno(): void {
    this.milorService.obtenerEstadoTurno().subscribe({
      next: (turno) => {
        this.turnoAbierto.set(turno && turno.estado === 'ABIERTO');
      },
      error: () => {
        this.turnoAbierto.set(false);
      }
    });
  }

  cargarMetricasAlRecargar(): void {
    this.milorService.obtenerMetricas().subscribe({
      next: (data) => {
        this.milorService.metricas.set(data);
      },
      error: (err) => {
        console.error('Error al sincronizar métricas al actualizar:', err);
      }
    });
  }

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
        activo: item?.activo ?? true
      };
    });
  });

  abrirModal(accion: 'ABRIR' | 'CERRAR'): void {
    this.modalAccion.set(accion);
  }

  cerrarModal(): void {
    this.modalAccion.set(null);
  }

  verDetalleOrden(venta: any): void {
    this.ordenSeleccionadaModal.set(venta);
  }

  cerrarDetalleOrden(): void {
    this.ordenSeleccionadaModal.set(null);
  }

  ejecutarAccionTurno(): void {
    const accion = this.modalAccion();
    if (!accion) return;

    this.cargandoTurno.set(true);
    this.cerrarModal();

    if (accion === 'CERRAR') {
      this.milorService.cerrarTurno().subscribe({
        next: () => {
          this.turnoAbierto.set(false);
          this.cargandoTurno.set(false);
          this.verificarEstadoTurno();
          this.cargarMetricasAlRecargar();
        },
        error: (err) => {
          console.error('Error al cerrar el turno:', err);
          alert('Hubo un problema al intentar cerrar el turno.');
          this.cargandoTurno.set(false);
        }
      });
    } else {
      this.milorService.abrirTurno().subscribe({
        next: () => {
          this.turnoAbierto.set(true);
          this.cargandoTurno.set(false);
          this.verificarEstadoTurno();
          this.cargarMetricasAlRecargar();
        },
        error: (err) => {
          console.error('Error al abrir el turno:', err);
          alert('Hubo un problema al intentar abrir el turno.');
          this.cargandoTurno.set(false);
        }
      });
    }
  }
}

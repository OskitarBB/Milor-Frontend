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

  ngOnInit(): void {
    this.verificarEstadoTurno();
    this.cargarMetricasAlRecargar(); // <--- LLAMADA CLAVE PARA EVITAR QUE SE QUEDE EN CERO
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

  // Fuerza la obtención de métricas actuales al presionar F5
  cargarMetricasAlRecargar(): void {
    this.milorService.obtenerMetricas().subscribe({
      next: (data) => {
        // Actualizamos directamente el signal global de métricas del servicio
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

  gestionarTurno(): void {
    if (this.turnoAbierto()) {
      const confirmacion = window.confirm(
        '¿Estás seguro de cerrar el turno actual?\n\nEsto guardará las estadísticas y reseteará el panel para iniciar un nuevo ciclo.'
      );

      if (confirmacion) {
        this.cargandoTurno.set(true);
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
      }
    } else {
      this.cargandoTurno.set(true);
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
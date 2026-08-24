import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MilorService } from '../../core/services/milor.service';
import { DashboardMetricasDTO } from '../../core/models/milor.models';

@Component({
  selector: 'app-historial-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe],
  templateUrl: './historial-dashboard.html',
  styleUrl: './historial-dashboard.css'
})
export class HistorialDashboardComponent implements OnInit {
  private readonly milorService = inject(MilorService);

  // Filtros de fecha usando Signals
  fechaInicio = signal<string>('');
  fechaFin = signal<string>('');
  
  // Estado de la data
  metricas = signal<DashboardMetricasDTO | null>(null);
  cargando = signal<boolean>(false);

  // Modal para ver el detalle completo de una orden específica
  ordenSeleccionadaModal = signal<any | null>(null);

  ngOnInit(): void {
    // Por defecto cargamos las ventas de hoy al abrir la sección
    this.filtrarRapido('hoy');
  }

  buscarHistorial(): void {
    this.cargando.set(true);
    
    // Concatenamos las horas para buscar desde el inicio del día hasta el final
    const inicio = `${this.fechaInicio()}T00:00:00`;
    const fin = `${this.fechaFin()}T23:59:59`;

    this.milorService.obtenerHistorial(inicio, fin).subscribe({
      next: (data) => {
        this.metricas.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error cargando el historial:', err);
        this.cargando.set(false);
      }
    });
  }

  // Función para establecer los rangos de fecha mediante los botones rápidos
  filtrarRapido(tipo: 'hoy' | 'ayer' | '7dias'): void {
    const hoy = new Date();
    const formatoFecha = (d: Date) => d.toISOString().split('T')[0];

    if (tipo === 'hoy') {
      const fechaStr = formatoFecha(hoy);
      this.fechaInicio.set(fechaStr);
      this.fechaFin.set(fechaStr);
    } else if (tipo === 'ayer') {
      const ayer = new Date();
      ayer.setDate(hoy.getDate() - 1);
      const fechaStr = formatoFecha(ayer);
      this.fechaInicio.set(fechaStr);
      this.fechaFin.set(fechaStr);
    } else if (tipo === '7dias') {
      const inicio = new Date();
      inicio.setDate(hoy.getDate() - 7);
      this.fechaInicio.set(formatoFecha(inicio));
      this.fechaFin.set(formatoFecha(hoy));
    }

    this.buscarHistorial();
  }

  // Controla qué botón rápido se encuentra activo visualmente
  esFiltroActivo(tipo: string): boolean {
    const hoy = new Date().toISOString().split('T')[0];
    if (tipo === 'hoy') {
      return this.fechaInicio() === hoy && this.fechaFin() === hoy;
    }
    if (tipo === 'ayer') {
      const ayer = new Date();
      ayer.setDate(new Date().getDate() - 1);
      const ayerStr = ayer.toISOString().split('T')[0];
      return this.fechaInicio() === ayerStr && this.fechaFin() === ayerStr;
    }
    if (tipo === '7dias') {
      const inicio = new Date();
      inicio.setDate(new Date().getDate() - 7);
      return this.fechaInicio() === inicio.toISOString().split('T')[0] && this.fechaFin() === hoy;
    }
    return false;
  }

  // Computed property getter para ordenar el ranking
  get resumenPlatos() {
    const conteo = this.metricas()?.conteoPorPlato;
    if (!conteo) return [];
    
    return Object.keys(conteo)
      .map(key => ({ id: key, ...conteo[Number(key)] }))
      .sort((a, b) => b.vendidos - a.vendidos);
  }

  readonly ventasRecientes = computed(() => {
    return this.metricas()?.ultimasVentas || [];
  });

  // Formatea la fecha para que incluya el Día, Fecha y Hora exactos (Ej: LUNES, 24/08/2026 - 15:30:12)
  formatearFechaLarga(fechaHoraStr: string): string {
    if (!fechaHoraStr) return '';
    const d = new Date(fechaHoraStr.endsWith('Z') || fechaHoraStr.includes('+') ? fechaHoraStr : fechaHoraStr + (fechaHoraStr.includes('T') ? '' : 'T00:00:00'));
    const dias = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
    const diaSemana = dias[d.getDay()];
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const anio = d.getFullYear();
    const hora = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    const seg = String(d.getSeconds()).padStart(2, '0');
    return `${diaSemana}, ${dia}/${mes}/${anio} - ${hora}:${min}:${seg}`;
  }

  verDetalleOrden(venta: any): void {
    this.ordenSeleccionadaModal.set(venta);
  }

  cerrarDetalleOrden(): void {
    this.ordenSeleccionadaModal.set(null);
  }
}
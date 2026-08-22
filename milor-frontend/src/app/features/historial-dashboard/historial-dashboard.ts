// historial-dashboard.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MilorService } from '../../core/services/milor.service';
import { DashboardMetricasDTO } from '../../core/models/milor.models';

@Component({
  selector: 'app-historial-dashboard',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
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

  ngOnInit(): void {
    // Por defecto cargamos los últimos 7 días
    this.filtrarRapido('7dias');
  }

  buscarHistorial(): void {
    this.cargando.set(true);
    
    // Concatenamos las horas para buscar desde el inicio del primer día hasta el final del último
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
    
    // Retornamos un arreglo ordenado de mayor a menor venta
    return Object.keys(conteo)
      .map(key => ({ id: key, ...conteo[Number(key)] }))
      .sort((a, b) => b.vendidos - a.vendidos);
  }
}
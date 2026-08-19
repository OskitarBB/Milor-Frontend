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
    // Configuramos por defecto la vista de los últimos 7 días
    const hoy = new Date();
    const haceUnaSemana = new Date();
    haceUnaSemana.setDate(hoy.getDate() - 7);

    // Formateamos las fechas a 'YYYY-MM-DD' para los inputs nativos
    this.fechaFin.set(hoy.toISOString().split('T')[0]);
    this.fechaInicio.set(haceUnaSemana.toISOString().split('T')[0]);

    this.buscarHistorial();
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
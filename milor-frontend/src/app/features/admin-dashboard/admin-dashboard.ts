import { Component, computed, inject } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { MilorService } from '../../core/services/milor.service';

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

  readonly resumenPlatos = computed(() => {
    const conteo = this.metricas().conteoPorPlato;
    if (!conteo) return [];
    return Object.keys(conteo).map(id => ({
      id,
      ...conteo[id]
    }));
  });
}
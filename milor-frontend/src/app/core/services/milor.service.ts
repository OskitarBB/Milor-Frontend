import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { WebSocketService } from './websocket.service';
import { CartaDiariaDTO, DashboardMetricasDTO } from '../models/milor.models';

@Injectable({
  providedIn: 'root'
})
export class MilorService {
  private readonly http = inject(HttpClient);
  private readonly ws = inject(WebSocketService);
  
  private readonly apiUrl = 'http://localhost:8080/api';

  // Signals globales
  carta = signal<CartaDiariaDTO | null>(null);
  metricas = signal<DashboardMetricasDTO | null>(null);

  constructor() {
    this.cargarCartaInicial();
    this.iniciarWebSockets();
  }

  private cargarCartaInicial(): void {
    this.http.get<CartaDiariaDTO>(`${this.apiUrl}/carta`).subscribe({
      next: (data: CartaDiariaDTO) => this.carta.set(data),
      error: (err: unknown) => console.error('Error cargando carta inicial:', err)
    });
  }

  private iniciarWebSockets(): void {
    this.ws.conectar(() => {
      this.ws.suscribir<CartaDiariaDTO>('/topic/carta', (data: CartaDiariaDTO) => {
        this.carta.set(data);
      });
      this.ws.suscribir<DashboardMetricasDTO>('/topic/metricas', (data: DashboardMetricasDTO) => {
        this.metricas.set(data);
      });
    });
  }

  // --- MÉTODOS DE MÉTRICAS E HISTORIAL ---
  obtenerMetricas() {
    return this.http.get<DashboardMetricasDTO>(`${this.apiUrl}/ventas/metricas`);
  }

  obtenerHistorial(inicio: string, fin: string) {
    return this.http.get<DashboardMetricasDTO>(`${this.apiUrl}/ventas/historico?inicio=${inicio}&fin=${fin}`);
  }

  // --- MÉTODOS DE CARTA (PLATOS Y ENTRADAS) ---
  guardarPlato(plato: any) {
    return this.http.post<any>(`${this.apiUrl}/carta/platos`, plato);
  }

  eliminarPlato(id: number) {
    return this.http.delete<any>(`${this.apiUrl}/carta/platos/${id}`);
  }

  guardarEntrada(entrada: any) {
    return this.http.post<any>(`${this.apiUrl}/carta/entradas`, entrada);
  }

  eliminarEntrada(id: number) {
    return this.http.delete<any>(`${this.apiUrl}/carta/entradas/${id}`);
  }

  actualizarPrecios(precios: any) {
    return this.http.put<any>(`${this.apiUrl}/carta/precios`, precios);
  }

  // --- MÉTODOS DE VENTAS (OPERADOR) ---
  registrarVenta(payload: any) {
    return this.http.post<any>(`${this.apiUrl}/ventas`, payload);
  }

  // --- MÉTODOS DE GESTIÓN DE TURNOS ---
  abrirTurno() {
    return this.http.post<any>(`${this.apiUrl}/turnos/abrir`, {});
  }

  cerrarTurno() {
    return this.http.post<any>(`${this.apiUrl}/turnos/cerrar`, {});
  }

  obtenerEstadoTurno() {
    return this.http.get<any>(`${this.apiUrl}/turnos/estado-actual`);
  }
}
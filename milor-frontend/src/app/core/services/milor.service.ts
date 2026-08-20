import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { WebSocketService } from './websocket.service';
import { CartaDiariaDTO, DashboardMetricasDTO } from '../models/milor.models';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MilorService {
  private readonly http = inject(HttpClient);
  private readonly ws = inject(WebSocketService);
  
  private readonly apiUrl = 'http://localhost:8080/api';

  carta = signal<CartaDiariaDTO | null>(null);
  metricas = signal<DashboardMetricasDTO | null>(null);
  turnoAbierto = signal<boolean>(false);

  constructor() {
    this.cargarCartaInicial();
    this.verificarEstadoTurnoGlobal();
    this.iniciarWebSockets();
  }

  verificarEstadoTurnoGlobal(): void {
    this.obtenerEstadoTurno().subscribe({
      next: (turno) => {
        this.turnoAbierto.set(turno && turno.estado === 'ABIERTO');
      },
      error: () => this.turnoAbierto.set(false)
    });
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
      
      // 🚀 Suscripción en tiempo real para el estado de la caja y turnos
      this.ws.suscribir<any>('/topic/turno', (turno: any) => {
        const estado = typeof turno === 'string' ? turno : (turno?.estado || turno?.status || '');
        const esAbierto = String(estado).toUpperCase() === 'ABIERTO';
        this.turnoAbierto.set(esAbierto);
      });
    });
  }

  obtenerMetricas() {
    return this.http.get<DashboardMetricasDTO>(`${this.apiUrl}/ventas/metricas`);
  }

  obtenerHistorial(inicio: string, fin: string) {
    return this.http.get<DashboardMetricasDTO>(`${this.apiUrl}/ventas/historico?inicio=${inicio}&fin=${fin}`);
  }

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

  registrarVenta(payload: any) {
    return this.http.post<any>(`${this.apiUrl}/ventas`, payload);
  }

  abrirTurno() {
    return this.http.post<any>(`${this.apiUrl}/turnos/abrir`, {}).pipe(
      tap(() => this.turnoAbierto.set(true))
    );
  }

  cerrarTurno() {
    return this.http.post<any>(`${this.apiUrl}/turnos/cerrar`, {}).pipe(
      tap(() => this.turnoAbierto.set(false))
    );
  }

  obtenerEstadoTurno() {
    return this.http.get<any>(`${this.apiUrl}/turnos/estado-actual`);
  }
}
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { WebSocketService } from './websocket.service';
import {
  CartaDiariaDTO,
  DashboardMetricasDTO,
  RegistroVentaRequest,
  Plato,
  Entrada,
  ConfiguracionPrecio
} from '../models/milor.models';

@Injectable({
  providedIn: 'root'
})
export class MilorService {
  private http = inject(HttpClient);
  private ws = inject(WebSocketService);
  private apiUrl = 'http://localhost:8080/api';

  readonly carta = signal<CartaDiariaDTO | null>(null);
  readonly metricas = signal<DashboardMetricasDTO | null>(null);

  constructor() {
    this.cargarCartaInicial();
    this.cargarMetricasIniciales();
    this.iniciarWebSockets();
  }

  cargarCartaInicial(): void {
    this.http.get<CartaDiariaDTO>(`${this.apiUrl}/carta`).subscribe({
      next: (res) => this.carta.set(res),
      error: (err) => console.error('Error cargando carta:', err)
    });
  }

  cargarMetricasIniciales(): void {
    this.http.get<DashboardMetricasDTO>(`${this.apiUrl}/ventas/metricas`).subscribe({
      next: (res) => {
        console.log('Métricas iniciales cargadas:', res);
        this.metricas.set(res);
      },
      error: (err) => console.error('Error cargando métricas iniciales:', err)
    });
  }

  private iniciarWebSockets(): void {
    this.ws.conectar(() => {
      this.ws.suscribir<CartaDiariaDTO>('/topic/carta', (data) => {
        this.carta.set(data);
      });

      this.ws.suscribir<DashboardMetricasDTO>('/topic/metricas', (data) => {
        this.metricas.set(data);
      });
    });
  }

  registrarVenta(venta: RegistroVentaRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/ventas`, venta).pipe(
      tap(() => {
        this.cargarCartaInicial();
        this.cargarMetricasIniciales();
      })
    );
  }

  guardarPlato(plato: Plato): Observable<Plato> {
    return this.http.post<Plato>(`${this.apiUrl}/carta/platos`, plato).pipe(
      tap(() => {
        this.cargarCartaInicial();
        this.cargarMetricasIniciales(); // <-- Agregado
      })
    );
  }

  eliminarPlato(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/carta/platos/${id}`).pipe(
      tap((res) => {
        if (res && res.platos) {
          this.carta.set(res);
        } else {
          this.cargarCartaInicial();
        }
        this.cargarMetricasIniciales(); // <-- Agregado
      })
    );
  }

  guardarEntrada(entrada: Entrada): Observable<Entrada> {
    return this.http.post<Entrada>(`${this.apiUrl}/carta/entradas`, entrada).pipe(
      tap(() => {
        this.cargarCartaInicial();
        this.cargarMetricasIniciales(); // <-- Agregado
      })
    );
  }

  eliminarEntrada(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/carta/entradas/${id}`).pipe(
      tap((res) => {
        if (res && res.entradas) {
          this.carta.set(res);
        } else {
          this.cargarCartaInicial();
        }
        this.cargarMetricasIniciales(); // <-- Agregado
      })
    );
  }

  actualizarPrecios(precios: ConfiguracionPrecio): Observable<ConfiguracionPrecio> {
    return this.http.put<ConfiguracionPrecio>(`${this.apiUrl}/carta/precios`, precios).pipe(
      tap(() => {
        this.cargarCartaInicial();
        this.cargarMetricasIniciales(); // <-- Agregado
      })
    );
  }

  cerrarTurno(): Observable<any> {
    // Este endpoint lo crearemos en el backend luego. 
    // Al llamarlo, el backend archivará las ventas de hoy, limpiará la carta y emitirá métricas en 0 por WebSocket.
    return this.http.post(`${this.apiUrl}/turnos/cerrar`, {}).pipe(
      tap(() => {
        this.cargarCartaInicial();
        this.cargarMetricasIniciales();
      })
    );
  }

  obtenerHistorial(fechaInicio: string, fechaFin: string): Observable<DashboardMetricasDTO> {
    // Este endpoint traerá los datos filtrados para el nuevo dashboard histórico
    return this.http.get<DashboardMetricasDTO>(`${this.apiUrl}/ventas/historico`, {
      params: { inicio: fechaInicio, fin: fechaFin }
    });
  }

}
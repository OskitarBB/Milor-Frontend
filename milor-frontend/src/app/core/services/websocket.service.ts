import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Subject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private client: Client;
  private socketUrl = 'http://localhost:8080/ws';
  
  // Subject para emitir las alertas de nuevas ventas en tiempo real
  private ventaSubject = new Subject<any>();
  private isConnected = false;

  constructor() {
    this.client = new Client({
      webSocketFactory: () => new SockJS(this.socketUrl),
      reconnectDelay: 3000,
      debug: (msg: string) => {
        if (!msg.includes('PING') && !msg.includes('PONG')) {
          console.log('[STOMP]:', msg);
        }
      }
    });
  }

  conectar(onConnected?: () => void): void {
    // Si ya está conectado, ejecutamos el callback de inmediato sin recrear el socket
    if (this.isConnected && this.client.connected) {
      if (onConnected) onConnected();
      return;
    }

    this.client.onConnect = (frame) => {
      this.isConnected = true;
      console.log('✅ Conectado a STOMP WebSockets');
      
      // Nos suscribimos al canal de métricas/ventas
      this.client.subscribe('/topic/metricas', (mensaje: IMessage) => {
        const data = JSON.parse(mensaje.body);
        this.ventaSubject.next(data);
      });

      if (onConnected) onConnected();
    };

    this.client.onStompError = (frame) => {
      this.isConnected = false;
      console.error('❌ Error STOMP:', frame.headers['message'], frame.body);
    };

    this.client.onWebSocketClose = () => {
      this.isConnected = false;
    };

    if (!this.client.active) {
      this.client.activate();
    }
  }

  suscribir<T>(topic: string, callback: (data: T) => void): void {
    if (this.client.connected) {
      this.client.subscribe(topic, (mensaje: IMessage) => {
        callback(JSON.parse(mensaje.body) as T);
      });
    } else {
      this.conectar(() => {
        this.client.subscribe(topic, (mensaje: IMessage) => {
          callback(JSON.parse(mensaje.body) as T);
        });
      });
    }
  }

  onVentaRegistrada(): Observable<any> {
    return this.ventaSubject.asObservable();
  }

  desconectar(): void {
    this.isConnected = false;
    if (this.client.active) {
      this.client.deactivate();
      console.log('🔌 Desconectado de STOMP WebSockets por cierre de sesión');
    }
  }
}
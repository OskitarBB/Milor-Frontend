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
    this.client.onConnect = (frame) => {
      console.log('✅ Conectado a STOMP WebSockets');
      
      // Nos suscribimos automáticamente al canal de métricas/ventas del backend
      this.client.subscribe('/topic/metricas', (mensaje: IMessage) => {
        const data = JSON.parse(mensaje.body);
        this.ventaSubject.next(data);
      });

      if (onConnected) onConnected();
    };

    this.client.onStompError = (frame) => {
      console.error('❌ Error STOMP:', frame.headers['message'], frame.body);
    };

    this.client.activate();
  }

  suscribir<T>(topic: string, callback: (data: T) => void): void {
    if (this.client.connected) {
      this.client.subscribe(topic, (mensaje: IMessage) => {
        callback(JSON.parse(mensaje.body) as T);
      });
    } else {
      const prevOnConnect = this.client.onConnect;
      this.client.onConnect = (frame) => {
        if (prevOnConnect) prevOnConnect(frame);
        this.client.subscribe(topic, (mensaje: IMessage) => {
          callback(JSON.parse(mensaje.body) as T);
        });
      };
    }
  }

  // Método público para que el Dashboard escuche las nuevas ventas
  onVentaRegistrada(): Observable<any> {
    return this.ventaSubject.asObservable();
  }

  desconectar(): void {
    if (this.client.active) {
      this.client.deactivate();
    }
  }
}
import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private client: Client;
  private socketUrl = 'http://localhost:8080/ws';

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
    this.client.onConnect = () => {
      console.log('✅ Conectado a STOMP WebSockets');
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

  desconectar(): void {
    if (this.client.active) {
      this.client.deactivate();
    }
  }
}
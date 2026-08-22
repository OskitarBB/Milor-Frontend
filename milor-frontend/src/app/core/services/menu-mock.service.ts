import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private stompClient: Client | null = null;
  private conectado = false;
  private ventaRegistradaSubject = new Subject<any>();

  constructor() {
    this.inicializarCliente();
    
    if (localStorage.getItem('milor_token')) {
      this.conectar();
    }
  }

  private inicializarCliente(): void {
    const token = localStorage.getItem('milor_token');

    this.stompClient = new Client({
      webSocketFactory: () => new SockJS('https://milor-backend.onrender.com/ws'),
      connectHeaders: {
        Authorization: token ? `Bearer ${token}` : ''
      },
      debug: () => {},
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000
    });

    this.stompClient.onConnect = () => {
      this.conectado = true;
      console.log('Conectado a STOMP WebSockets en tiempo real');

      this.stompClient?.subscribe('/topic/ventas', (message: IMessage) => {
        try {
          const data = JSON.parse(message.body);
          console.log('¡Venta registrada recibida en tiempo real!', data);
          this.ventaRegistradaSubject.next(data);
        } catch (e) {
          this.ventaRegistradaSubject.next(message.body);
        }
      });
    };

    this.stompClient.onStompError = (frame) => {
      console.error('Error en STOMP broker:', frame.headers['message'], frame.body);
      this.conectado = false;
    };

    this.stompClient.onDisconnect = () => {
      this.conectado = false;
      console.log('Desconectado de WebSockets');
    };
  }

  conectar(onConnectCallback?: () => void): void {
    if (onConnectCallback && this.stompClient) {
      const prevOnConnect = this.stompClient.onConnect;
      this.stompClient.onConnect = (frame) => {
        if (prevOnConnect) prevOnConnect(frame);
        onConnectCallback();
      };
    }

    if (this.stompClient && !this.stompClient.active) {
      const token = localStorage.getItem('milor_token');
      if (token) {
        this.stompClient.connectHeaders = { Authorization: `Bearer ${token}` };
      }
      this.stompClient.activate();
    } else if (this.conectado && onConnectCallback) {
      onConnectCallback();
    }
  }

  desconectar(): void {
    if (this.stompClient && this.stompClient.active) {
      this.stompClient.deactivate();
      this.conectado = false;
    }
  }

  suscribir<T>(destination: string, callback: (data: T) => void): void {
    if (this.stompClient && this.conectado) {
      this.stompClient.subscribe(destination, (message: IMessage) => {
        try {
          const data = JSON.parse(message.body);
          callback(data);
        } catch (e) {
          callback(message.body as unknown as T);
        }
      });
    } else {
      this.conectar();
      const checkConnection = setInterval(() => {
        if (this.stompClient && this.conectado) {
          clearInterval(checkConnection);
          this.stompClient.subscribe(destination, (message: IMessage) => {
            try {
              const data = JSON.parse(message.body);
              callback(data);
            } catch (e) {
              callback(message.body as unknown as T);
            }
          });
        }
      }, 400);
    }
  }

  onVentaRegistrada(): Observable<any> {
    return this.ventaRegistradaSubject.asObservable();
  }
}
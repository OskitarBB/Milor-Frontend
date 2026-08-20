import 'zone.js';

// Definimos el objeto global para que SockJS/WebSockets no arroje errores en el navegador
(window as any).global = window;

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
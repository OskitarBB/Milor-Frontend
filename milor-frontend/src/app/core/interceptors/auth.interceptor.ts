import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const usuarioGuardado = localStorage.getItem('milor_user');
  
  if (usuarioGuardado) {
    try {
      const user = JSON.parse(usuarioGuardado);
      if (user && user.token) {
        // Adjuntamos el token JWT en cada petición HTTP
        const reqClonada = req.clone({
          setHeaders: {
            Authorization: `Bearer ${user.token}`
          }
        });
        return next(reqClonada);
      }
    } catch (e) {
      console.error('Error al parsear token de localStorage', e);
    }
  }

  return next(req);
};
import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const usuarioGuardado = localStorage.getItem('milor_user');
  
  if (usuarioGuardado) {
    try {
      const user = JSON.parse(usuarioGuardado);
      if (user && user.rol) {
        // Clonamos la petición y le agregamos la cabecera X-User-Role
        const reqClonada = req.clone({
          setHeaders: {
            'X-User-Role': user.rol
          }
        });
        return next(reqClonada);
      }
    } catch (e) {
      console.error('Error al parsear usuario de localStorage', e);
    }
  }

  return next(req);
}
self.addEventListener('install', event => {
    self.skipWaiting();
  });
  
  self.addEventListener('activate', event => {
    console.log('Service Worker activado');
  });
  
  let turnos = [];
  let vehiculos = [];
  
  self.addEventListener('message', event => {
    turnos = event.data.turnos || [];
    vehiculos = event.data.vehiculos || [];
  });
  
  const checkEvents = () => {
    const now = new Date().getTime();
    const oneMinuteInMs = 60 * 1000;
  
    turnos.forEach(turno => {
      const fechaTurno = new Date(turno.fecha).getTime();
      const diffMs = fechaTurno - now;
      const vehiculo = vehiculos.find(v => v.id_vehiculo === turno.id_vehiculo);
      if (vehiculo && Math.abs(diffMs) <= oneMinuteInMs) {
        self.registration.showNotification('¡Hora de Mantenimiento!', {
          body: `⏳ ${vehiculo.marca} ${vehiculo.modelo} tiene mantenimiento ahora`,
          icon: '/favicon.ico',
        });
      }
    });
  
    vehiculos.forEach(vehiculo => {
      if (vehiculo.fecha_entrega && !vehiculo.vendido) {
        const fechaEntrega = new Date(vehiculo.fecha_entrega).getTime();
        const diffMs = fechaEntrega - now;
        if (Math.abs(diffMs) <= oneMinuteInMs) {
          self.registration.showNotification('¡Hora de Entrega!', {
            body: `⚠️ ${vehiculo.marca} ${vehiculo.modelo} debe entregarse ahora`,
            icon: '/favicon.ico',
          });
        }
      }
    });
  };
  
  setInterval(checkEvents, 60000); // Revisar cada minuto
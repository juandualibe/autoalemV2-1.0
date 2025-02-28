self.addEventListener('install', event => {
    self.skipWaiting();
    console.log('Service Worker instalado');
  });
  
  self.addEventListener('activate', event => {
    console.log('Service Worker activado');
    // Notificación de prueba al activarse
    self.registration.showNotification('Service Worker Activado', {
      body: '¡El Service Worker está listo!',
      icon: '/favicon.ico',
    });
  });
  
  let turnos = [];
  let vehiculos = [];
  
  self.addEventListener('message', event => {
    turnos = event.data.turnos || [];
    vehiculos = event.data.vehiculos || [];
    console.log('Datos recibidos en Service Worker:', { turnos, vehiculos });
  });
  
  const checkEvents = () => {
    const now = new Date().getTime();
    const oneMinuteInMs = 60 * 1000;
    console.log('checkEvents ejecutado a las:', new Date().toLocaleTimeString());
    console.log('Estado actual:', { turnos, vehiculos });
  
    turnos.forEach(turno => {
      const fechaTurno = new Date(turno.fecha).getTime();
      const diffMs = fechaTurno - now;
      const vehiculo = vehiculos.find(v => v.id_vehiculo === turno.id_vehiculo);
      console.log('Turno chequeado:', { id: turno.id_turno, fecha: turno.fecha, diffMs });
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
        console.log('Entrega chequeada:', { id: vehiculo.id_vehiculo, fecha_entrega: vehiculo.fecha_entrega, diffMs });
        if (Math.abs(diffMs) <= oneMinuteInMs) {
          self.registration.showNotification('¡Hora de Entrega!', {
            body: `⚠️ ${vehiculo.marca} ${vehiculo.modelo} debe entregarse ahora`,
            icon: '/favicon.ico',
          });
        }
      }
    });
  };
  
  // Ciclo de chequeo
  const scheduleNextCheck = () => {
    setTimeout(() => {
      checkEvents();
      scheduleNextCheck();
    }, 30000); // Reducimos a 30 segundos para pruebas más rápidas
  };
  scheduleNextCheck();
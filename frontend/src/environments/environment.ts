export const environment = {
  production: true,
  // Relativo de propósito: o nginx (ou outro proxy) encaminha /api para o backend,
  // então o mesmo build funciona em qualquer ambiente sem rebuild.
  apiUrl: '/api',
};

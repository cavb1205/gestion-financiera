const sessionKeys = [
  'authToken', 'refreshToken', 'userData', 'userProfile', 'tokenTimestamp',
  'selectedStore', 'noPago', 'cliente', 'liquidarFecha', 'abono', 'aporteEditar',
  'utilidadEditar', 'gastoEditar', 'ventaEditar', 'recaudoEditar', 'recaudo',
  'authSessionId',
];

export function storedSessionIdentity(storage) {
  return storage.getItem('authSessionId')
    || storage.getItem('refreshToken') || storage.getItem('authToken');
}

export function clearStoredSession(storage) {
  sessionKeys.forEach((key) => storage.removeItem(key));
}

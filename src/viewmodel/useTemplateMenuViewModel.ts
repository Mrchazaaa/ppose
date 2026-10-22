export function useTemplateMenuViewModel() {
  return {
    camera: !window.isSecureContext ? 'insecure' : navigator.mediaDevices ? 'available' : 'unavailable',
    localhostUrl: `http://localhost:${window.location.port || '5173'}/`,
  }
}

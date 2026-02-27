import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 90000, // scans can take up to ~30s for real domains
  headers: { 'Content-Type': 'application/json' },
});

export const startScan    = (domain)  => api.post('/scan', { domain });
export const getResult    = (scanId)  => api.get(`/result/${scanId}`);
export const simulateAttack = (scanId) => api.post('/simulate-attack', { scan_id: scanId });

export default api;

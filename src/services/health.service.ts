export interface HealthStatus {
  status: 'ok';
}

export const healthService = (): HealthStatus => ({ status: 'ok' });
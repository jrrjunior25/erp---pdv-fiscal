export interface SystemMetric {
  name: string;
  value: number;
  unit: string;
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  timestamp: Date;
}

export interface HealthCheck {
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  uptime: number;
  metrics: SystemMetric[];
  services: ServiceStatus[];
}

export interface ServiceStatus {
  name: string;
  status: 'UP' | 'DOWN';
  responseTime?: number;
}
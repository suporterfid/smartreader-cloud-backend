import { Injectable, OnModuleInit } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class PrometheusService implements OnModuleInit {
  private readonly register: client.Registry;

  constructor() {
    this.register = new client.Registry();
  }

  onModuleInit() {
    this.setupMetrics();
  }

  private setupMetrics() {
    this.register.setDefaultLabels({ app: 'smartreader-cloud' });
    client.collectDefaultMetrics({ register: this.register });

    new client.Gauge({
      name: 'system_cpu_usage',
      help: 'CPU usage percentage',
      registers: [this.register],
    });

    new client.Gauge({
      name: 'system_memory_usage',
      help: 'Memory usage in MB',
      registers: [this.register],
    });

    new client.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      registers: [this.register],
    });

    new client.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Histogram of request duration in seconds',
      registers: [this.register],
      buckets: [0.1, 0.3, 0.5, 1, 3, 5],
    });
  }
  
  getMetrics(): Promise<string> {
    return this.register.metrics();
  }
}

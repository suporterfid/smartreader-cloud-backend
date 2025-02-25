```bash
smartreader-cloud-backend
│   docker-compose.yml
│   api-curl-examples.md
│   build-project.bat
│   curl_examples.md
│   dependencies.json
│   docker-compose.yml
│   Dockerfile
│   init-mongo.js
│   insomnia-collection.json
│   insomnia-env.json
│   install-dependencies.bat
│   LICENSE
│   nest-cli.bat
│   nodemon.json
│   openapi.json
│   package.json
│   prometheus.yml
│   README.md
│   tsconfig.json
src
|   app.module.ts
|   main.ts
|   
+---api-keys
|       api-key.schema.ts
|       api-keys.controller.ts
|       api-keys.module.ts
|       api-keys.service.ts
|       
+---auth
|   |   api-key.guard.ts
|   |   public.decorator.ts
|   |   
|   +---decorators
|   |       rate-limit.decorator.ts
|   |       roles.decorator.ts
|   |       
|   +---guards
|   |       rbac.guard.ts
|   |       throttler.guard.ts
|   |       
|   \---middleware
|           auth.middleware.ts
|           
+---claim-tokens
|   |   claim-tokens.controller.ts
|   |   claim-tokens.module.ts
|   |   claim-tokens.service.ts
|   |   
|   \---schemas
|           claim-token.schema.ts
|           
+---commands
|   |   commands.controller.ts
|   |   commands.module.ts
|   |   commands.service.ts
|   |   commands.worker.ts
|   |   
|   \---schemas
|           command.schema.ts
|           
+---device-logs
|   |   device-logs.controller.ts
|   |   device-logs.module.ts
|   |   device-logs.service.ts
|   |   
|   \---schemas
|           device-log.schema.ts
|           
+---devices
|   |   devices.controller.ts
|   |   devices.module.ts
|   |   devices.service.ts
|   |   
|   \---schemas
|           device.schema.ts
|           
+---events
|   |   events.controller.ts
|   |   events.module.ts
|   |   events.service.ts
|   |   
|   \---schemas
|           event.schema.ts
|           
+---metrics
|   |   metrics.controller.ts
|   |   metrics.module.ts
|   |   metrics.service.ts
|   |   prometheus.service.ts
|   |   
|   \---schemas
|           system-metrics.schema.ts
|           
+---monitoring
|       monitoring-history.schema.ts
|       monitoring.controller.ts
|       monitoring.module.ts
|       monitoring.service.ts
|       
+---mqtt
|       mqtt.controller.ts
|       mqtt.module.ts
|       mqtt.service.ts
|       
+---status
|       status.controller.ts
|       
\---webhooks
    |   webhooks.controller.ts
    |   webhooks.module.ts
    |   webhooks.service.ts
    |   
    \---schemas
            webhook.schema.ts

```

           


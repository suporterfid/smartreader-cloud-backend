// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Enable CORS
    app.enableCors({
        origin: 'http://localhost:3002', // Your React app's URL
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        credentials: true,
    });

    const config = new DocumentBuilder()
    .setTitle('SmartReader API')
    .setDescription('API for managing and monitoring SmartReader devices via MQTT and REST')
    .setVersion('1.0')
    .addApiKey(
        {
            type: 'apiKey',
            name: 'x-api-key',
            in: 'header',
            description: 'API key for authentication',
        },
        'x-api-key',
    )
    .build();

    const documentFactory = () => SwaggerModule
    .createDocument(app, config);

    SwaggerModule.setup('api', app, documentFactory);

    // const document = SwaggerModule.createDocument(app, config);
    // SwaggerModule.setup('api', app, document);

    await app.listen(3000);
    console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();

// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

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
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    await app.listen(3000);
    console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();

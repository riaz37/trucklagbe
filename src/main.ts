import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { PerformanceMonitoringInterceptor } from './common/interceptors/performance-monitoring.interceptor';
import { MonitoringService } from './common/services/monitoring.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set global prefix for all routes
  app.setGlobalPrefix('api/v1');

  // Get the MonitoringService from the module context
  const monitoringService = app.get(MonitoringService);

  // Apply global interceptor for unified performance monitoring
  app.useGlobalInterceptors(
    new PerformanceMonitoringInterceptor(monitoringService),
  );

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('TruckLagBE API')
    .setDescription('Truck logistics and analytics backend API')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(process.env.PORT ?? 3000);
  console.log(
    `🚀 Application is running on: http://localhost:${process.env.PORT ?? 3000}`,
  );
  console.log(
    `📚 Swagger documentation available at: http://localhost:${process.env.PORT ?? 3000}/api/docs`,
  );
}
bootstrap();

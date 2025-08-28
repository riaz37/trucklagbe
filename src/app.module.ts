import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TripAnalyticsModule } from './trip-analytics/trip-analytics.module';
import { MonitoringService } from './common/services/monitoring.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TripAnalyticsModule,
  ],
  controllers: [AppController],
  providers: [AppService, MonitoringService],
  exports: [MonitoringService],
})
export class AppModule {}

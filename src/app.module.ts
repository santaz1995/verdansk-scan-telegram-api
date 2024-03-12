import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TelegramModule } from 'nestjs-telegram';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { App } from './app.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([App]),
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: 5432,
      password: process.env.POSTGRES_PASSWORD,
      username: process.env.POSTGRES_USER,
      entities: [App],
      database: process.env.POSTGRES_DATABASE,
      synchronize: true,
      logging: true,
      ssl: true,
    }),
    TelegramModule.forRoot({
      botKey: process.env.TELEGRAM_TOKEN_NAME,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor(private readonly appService: AppService) {
    this.appService.listenForMessages();
  }
}

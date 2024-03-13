import { Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TelegramModule } from 'nestjs-telegram';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { App } from './app.entity';
import { HttpModule } from '@nestjs/axios';
import { TwitchService } from './twitch.service';
import { OpenaiService } from './openai.service';
import { TelegramService } from './telegram.service';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    TypeOrmModule.forFeature([App]),
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
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
      logging: false,
      ssl: true,
    }),
    TelegramModule.forRoot({
      botKey: process.env.TELEGRAM_TOKEN_NAME,
    }),
  ],
  controllers: [AppController],
  providers: [AppService, TwitchService, OpenaiService, TelegramService],
})
export class AppModule implements OnModuleInit, OnModuleDestroy {
  private subscribeList = [];
  private streamers = ['159618335']; //, '672748475', '417405434'
  constructor(
    private readonly telegramService: TelegramService,
    private readonly twitchService: TwitchService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.telegramService.listenForMessages();
    for (const streamerId of this.streamers) {
      const subscribe =
        await this.twitchService.subscribeToStreamers(streamerId);
      console.log(subscribe);
      if (subscribe && subscribe.id) {
        this.subscribeList.push(subscribe.id);
      }
    }
  }

  onModuleDestroy(): void {
    this.subscribeList.forEach((subscriptionId) => {
      this.twitchService.unsubscribeToStreamers(subscriptionId);
    });
  }
}

import { Injectable } from '@nestjs/common';
import { TelegramService, TelegramUser } from "nestjs-telegram";
import * as TelegramBot from 'node-telegram-bot-api';
import { App } from './app.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class AppService {
  private bot: TelegramBot;

  constructor(
    @InjectRepository(App)
    private appRepository: Repository<App>,
    private readonly telegram: TelegramService,
  ) {
    this.bot = new TelegramBot(
      '7134727373:AAGZPM0sFPsbL63g0mwF2h2m9cvs-uLPI80',
      { polling: true },
    );
  }

  async getMe(): Promise<TelegramUser> {
    return this.telegram.getMe().toPromise();
  }

  async getStat(): Promise<App[]> {
    return this.appRepository.find();
  }

  async listenForMessages(): Promise<void> {
    this.bot.on('message', async (msg) => {
      let app = await this.appRepository.findOneBy({
        userId: msg.from.id.toString(),
      });

      if (!app) {
        app = new App();
        app.userId = msg.from.id.toString();
        app.normalMessageCount = 0;
        app.questionMessageCount = 0;
      }

      app.userName = `${msg.from.first_name} ${msg.from.last_name}`;
      const isQuestionMsg = msg.text && msg.text.includes('?');
      
      if (isQuestionMsg) {
        app.questionMessageCount += 1;
      } else {
        app.normalMessageCount += 1;
      }
      
      await this.appRepository.save(app);
      console.log(msg);
    });
  }
}

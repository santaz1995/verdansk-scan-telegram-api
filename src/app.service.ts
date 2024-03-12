import { Injectable } from '@nestjs/common';
import { TelegramService, TelegramUser, Update } from "nestjs-telegram";
import * as TelegramBot from 'node-telegram-bot-api';
import { App } from './app.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class AppService {
  private readonly bot: TelegramBot;
  private readonly secretUrl = 'https://s9.gifyu.com/images/SUcN6.gif'

  constructor(
    @InjectRepository(App)
    private appRepository: Repository<App>,
    private readonly telegram: TelegramService,
    ) {
    this.bot = new TelegramBot(
      process.env.TELEGRAM_TOKEN_NAME,
      { polling: true },
      );
  }

  async getMe(): Promise<TelegramUser> {
    return this.telegram.getMe().toPromise();
  }

  async getUpdates(): Promise<Update[]> {
    await this.telegram.getMe().toPromise();
    return this.telegram.getUpdates({}).toPromise();
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

      await this.checkEasterEgg(msg.text);
      await this.appRepository.save(app);
      console.log(msg);
    });
  }

  private async checkEasterEgg(msg: string): Promise<void> {
    const regexSex = /трах\w*/i;
    const regexMale = /муж\w*/i;
    const regexGo1 = /піш\w*/i;
    const regexGo2 = /піт\w*/i;
    if (regexSex.test(msg) && (regexMale.test(msg) || regexGo1.test(msg) || regexGo2.test(msg))) {
      await this.bot.sendAnimation(process.env.TELEGRAM_CHAT_ID, this.secretUrl);
    }
  }
}

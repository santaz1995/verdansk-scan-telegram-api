import { Injectable, Logger } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';
import { App } from './app.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class TelegramService {
  private readonly bot: TelegramBot;
  private readonly secretUrl = 'https://s9.gifyu.com/images/SUcN6.gif';
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    @InjectRepository(App)
    private readonly appRepository: Repository<App>,
  ) {
    this.bot = new TelegramBot(process.env.TELEGRAM_TOKEN_NAME, {
      polling: true,
    });
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

      app.userName = `${msg.from.first_name} ${msg.from.username ? msg.from.username : ''}`;
      const isQuestionMsg = msg.text && msg.text.includes('?');

      if (isQuestionMsg) {
        app.questionMessageCount += 1;
      } else {
        app.normalMessageCount += 1;
      }

      await this.checkEasterEgg(msg);
      await this.appRepository.save(app);
      this.logger.log(msg);
    });
  }

  async sendAnimation(chatId: number, animationUrl: string): Promise<void> {
    await this.bot.sendAnimation(chatId, animationUrl);
  }

  async sendMessage(chatId: number, msg: string): Promise<void> {
    await this.bot.sendMessage(chatId, msg);
  }

  async sendImage(
    chatId: number,
    imageUrl: string,
    msg?: string,
  ): Promise<void> {
    await this.bot.sendPhoto(chatId, imageUrl, { caption: msg ? msg : '' });
  }

  private async checkEasterEgg(msg: TelegramBot.Message): Promise<void> {
    const regexSex = /трах\w*/i;
    const regexMale = /муж\w*/i;
    const regexGo1 = /піш\w*/i;
    const regexGo2 = /піт\w*/i;
    if (
      regexSex.test(msg.text) &&
      (regexMale.test(msg.text) ||
        regexGo1.test(msg.text) ||
        regexGo2.test(msg.text))
    ) {
      await this.sendAnimation(msg.chat.id, this.secretUrl);
    }
  }
}

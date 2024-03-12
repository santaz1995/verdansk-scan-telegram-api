import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { TelegramUser } from "nestjs-telegram";
import { App } from './app.entity';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getMe(): Promise<TelegramUser> {
    return this.appService.getMe();
  }

  @Get('stat')
  getStat(): Promise<App[]> {
    return this.appService.getStat();
  }
}

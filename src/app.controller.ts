import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { App } from './app.entity';
import { TwitchService } from './twitch.service';
import { TwitchWebhookInterface } from './domain/twitch-webhook.interface';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly twitchService: TwitchService,
  ) {}

  @Get()
  getMe(): Promise<string> {
    return this.appService.getMe();
  }

  @Get('stat')
  getStat(): Promise<App[]> {
    return this.appService.getStat();
  }

  @Post('/twitch/webhook')
  async twitchWebhook(@Body() body: TwitchWebhookInterface): Promise<void> {
    await this.twitchService.twitchWebhook(body);
  }

  @Post('/twitch/tiger-manually')
  async twitchTigerManually(@Body() body: { userId: string }): Promise<void> {
    await this.twitchService.twitchTigerManually(body.userId);
  }
}

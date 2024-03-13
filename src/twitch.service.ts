import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import { TwitchAccessTokenInterface } from './domain/twitch-access-token.interface';
import { TwitchStreamInfoInterface } from './domain/twitch-stream-info.interface';
import { OpenaiService } from './openai.service';
import { TelegramService } from './telegram.service';
import { TwitchStreamerInfoInterface } from './domain/twitch-streamer-info.interface';
import * as process from 'process';
import { TwitchSubscribeInfoInterface } from './domain/twitch-subscribe-info.interface';
import { TwitchWebhookInterface } from './domain/twitch-webhook.interface';

@Injectable()
export class TwitchService {
  private readonly logger = new Logger(TwitchService.name);
  constructor(
    private readonly httpService: HttpService,
    private readonly openaiService: OpenaiService,
    private readonly telegramService: TelegramService,
  ) {}

  async twitchWebhook(body: TwitchWebhookInterface): Promise<void> {
    try {
      this.logger.log(body);
      if (!body.event) {
        return;
      }
      const streamInfo = await this.getStreamInfo(
        body.event.broadcaster_user_id,
      );
      const haiku = await this.openaiService.generateHaikuForStreamer(
        streamInfo.game_name,
        streamInfo.title,
      );

      const streamerInfo = await this.getStreamerInfo(
        body.event.broadcaster_user_id,
      );

      await this.telegramService.sendImage(
        Number(process.env.TELEGRAM_CHAT_ID),
        streamerInfo.profile_image_url,
        `https://www.twitch.tv/${streamerInfo.login}`,
      );
      await this.telegramService.sendMessage(
        Number(process.env.TELEGRAM_CHAT_ID),
        haiku,
      );
    } catch (e) {
      this.logger.error(e.message);
    }
  }

  async twitchTigerManually(userId: string): Promise<void> {
    try {
      const streamInfo = await this.getStreamInfo(userId);
      const haiku = await this.openaiService.generateHaikuForStreamer(
        streamInfo.game_name,
        streamInfo.title,
      );

      const streamerInfo = await this.getStreamerInfo(userId);

      await this.telegramService.sendImage(
        Number(process.env.TELEGRAM_CHAT_ID),
        streamerInfo.profile_image_url,
        `https://www.twitch.tv/${streamerInfo.login}`,
      );
      await this.telegramService.sendMessage(
        Number(process.env.TELEGRAM_CHAT_ID),
        haiku,
      );
    } catch (e) {
      this.logger.error(e.message);
    }
  }

  async subscribeToStreamers(
    streamerId: string,
  ): Promise<TwitchSubscribeInfoInterface> {
    try {
      const twitchAuthToken = await this.getAuthToken();
      const { data } = await firstValueFrom(
        this.httpService
          .post<{ data }>(
            `https://api.twitch.tv/helix/eventsub/subscriptions`,
            {
              type: 'stream.online',
              version: '1',
              condition: {
                broadcaster_user_id: streamerId,
              },
              transport: {
                method: 'webhook',
                callback:
                  'https://verdansk-telegram-scan-api.vercel.app/twitch/webhook/',
                secret: process.env.TWITCH_SECRET_KEY,
              },
            },
            {
              headers: {
                Authorization: `Bearer ${twitchAuthToken.access_token}`,
                'Client-Id': process.env.TWITCH_CLIENT_ID,
              },
            },
          )
          .pipe(
            catchError((error: AxiosError) => {
              this.logger.error(error.response.data);
              throw 'An error happened!';
            }),
          ),
      );
      if (data && data.data && Array.isArray(data.data)) {
        return data.data[0] as TwitchSubscribeInfoInterface;
      }
    } catch (e) {
      //
    }
  }

  async unsubscribeToStreamers(subscriptionId: string): Promise<void> {
    const twitchAuthToken = await this.getAuthToken();
    this.httpService
      .delete<void>(
        `https://api.twitch.tv/helix/eventsub/subscriptions?id=${subscriptionId}`,
        {
          headers: {
            Authorization: `Bearer ${twitchAuthToken.access_token}`,
            'Client-Id': process.env.TWITCH_CLIENT_ID,
          },
        },
      )
      .pipe(
        catchError((error: AxiosError) => {
          this.logger.error(error.response.data);
          throw 'An error happened!';
        }),
      );
  }

  private async getStreamInfo(
    streamerId: string,
  ): Promise<TwitchStreamInfoInterface> {
    const twitchAuthToken = await this.getAuthToken();
    const { data } = await firstValueFrom(
      this.httpService
        .get<{ data: [] }>(
          `https://api.twitch.tv/helix/streams?user_id=${streamerId}`,
          {
            headers: {
              Authorization: `Bearer ${twitchAuthToken.access_token}`,
              'Client-Id': process.env.TWITCH_CLIENT_ID,
            },
          },
        )
        .pipe(
          catchError((error: AxiosError) => {
            this.logger.error(error.response.data);
            throw 'An error happened!';
          }),
        ),
    );

    if (data && data.data && Array.isArray(data.data)) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      return data.data[0] as TwitchStreamInfoInterface;
    }

    throw new NotFoundException();
  }

  private async getStreamerInfo(
    streamerId: string,
  ): Promise<TwitchStreamerInfoInterface> {
    const twitchAuthToken = await this.getAuthToken();
    const { data } = await firstValueFrom(
      this.httpService
        .get<{ data: [] }>(
          `https://api.twitch.tv/helix/users?id=${streamerId}`,
          {
            headers: {
              Authorization: `Bearer ${twitchAuthToken.access_token}`,
              'Client-Id': process.env.TWITCH_CLIENT_ID,
            },
          },
        )
        .pipe(
          catchError((error: AxiosError) => {
            this.logger.error(error.response.data);
            throw 'An error happened!';
          }),
        ),
    );

    if (data && data.data && Array.isArray(data.data)) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      return data.data[0] as TwitchStreamerInfoInterface;
    }

    throw new NotFoundException();
  }

  private async getAuthToken(): Promise<TwitchAccessTokenInterface> {
    const { data } = await firstValueFrom(
      this.httpService
        .post<TwitchAccessTokenInterface>('https://id.twitch.tv/oauth2/token', {
          client_id: process.env.TWITCH_CLIENT_ID,
          client_secret: process.env.TWITCH_SECRET_KEY,
          grant_type: 'client_credentials',
        })
        .pipe(
          catchError((error: AxiosError) => {
            this.logger.error(error.response.data);
            throw 'An error happened!';
          }),
        ),
    );

    return data;
  }
}

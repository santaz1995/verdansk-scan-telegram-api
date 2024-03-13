import { TwitchWebhookEventInterface } from './twitch-webhook-event.interface';

export interface TwitchWebhookInterface {
  readonly subscription: object;
  readonly event: TwitchWebhookEventInterface;
}

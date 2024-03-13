export interface TwitchWebhookEventInterface {
  readonly id: string;
  readonly broadcaster_user_id: string;
  readonly broadcaster_user_login: string;
  readonly broadcaster_user_name: string;
  readonly type: string;
  readonly started_at: string;
}

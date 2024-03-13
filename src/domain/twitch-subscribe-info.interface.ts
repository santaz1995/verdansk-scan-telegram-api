import { TwitchAccessTokenInterface } from './twitch-condition-info.interface';

export interface TwitchSubscribeInfoInterface {
  readonly id: string;
  readonly status: string;
  readonly type: string;
  readonly version: string;
  readonly created_at: string;
  readonly condition: TwitchAccessTokenInterface;
}

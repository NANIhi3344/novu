import {
  ChannelTypeEnum,
  IChatOptions,
  IChatProvider,
  ISendMessageSuccessResponse,
} from '@novu/stateless';
import axios from 'axios';
import { BaseProvider, CasingEnum } from '../../../base.provider';
import { WithPassthrough } from '../../../utils/types';

export interface ILinkedInConfig {
  /** OAuth 2.0 access token (member or organization) with messaging permission. */
  accessToken: string;
  /** URN of the sender, e.g. urn:li:organization:123 or urn:li:person:abc. */
  authorUrn: string;
  /** LinkedIn API version header in YYYYMM format, e.g. 202401. */
  apiVersion?: string;
  /** Override for tests or proxies. */
  baseUrl?: string;
}

const DEFAULT_BASE_URL = 'https://api.linkedin.com';
const DEFAULT_API_VERSION = '202401';

export class LinkedInProvider extends BaseProvider implements IChatProvider {
  id = 'linkedin';
  channelType = ChannelTypeEnum.CHAT as ChannelTypeEnum.CHAT;
  protected casing = CasingEnum.CAMEL_CASE;

  constructor(private config: ILinkedInConfig) {
    super();
  }

  async sendMessage(
    data: IChatOptions,
    bridgeProviderData: WithPassthrough<Record<string, unknown>> = {}
  ): Promise<ISendMessageSuccessResponse> {
    const recipient = data.channel;

    if (!recipient) {
      throw new Error(
        'LinkedIn recipient is required. Set the subscriber channel to a LinkedIn member URN (urn:li:person:...).'
      );
    }

    if (!this.config.accessToken || !this.config.authorUrn) {
      throw new Error('LinkedIn provider requires accessToken and authorUrn.');
    }

    const transformed = this.transform(bridgeProviderData, {
      author: this.config.authorUrn,
      recipients: [recipient],
      subject: '',
      body: data.content,
    });

    const response = await axios.post(
      `${this.config.baseUrl ?? DEFAULT_BASE_URL}/rest/messages`,
      transformed.body,
      {
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
          'LinkedIn-Version': this.config.apiVersion ?? DEFAULT_API_VERSION,
          'X-Restli-Protocol-Version': '2.0.0',
          ...transformed.headers,
        },
      }
    );

    return {
      id: response.headers['x-restli-id'] ?? response.data?.id ?? undefined,
      date: new Date().toISOString(),
    };
  }
}

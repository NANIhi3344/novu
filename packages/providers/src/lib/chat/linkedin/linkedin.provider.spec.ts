import { describe, expect, it, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { LinkedInProvider } from './linkedin.provider';

vi.mock('axios');

const config = {
  accessToken: 'token-123',
  authorUrn: 'urn:li:organization:42',
};

describe('LinkedInProvider', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('posts the message to the LinkedIn messages endpoint', async () => {
    vi.mocked(axios.post).mockResolvedValue({
      headers: { 'x-restli-id': 'msg-1' },
      data: {},
    });

    const provider = new LinkedInProvider(config);
    const result = await provider.sendMessage({
      channel: 'urn:li:person:abc',
      content: 'Hello from Novu',
    } as never);

    expect(axios.post).toHaveBeenCalledWith(
      'https://api.linkedin.com/rest/messages',
      expect.objectContaining({
        author: 'urn:li:organization:42',
        recipients: ['urn:li:person:abc'],
        body: 'Hello from Novu',
      }),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer token-123',
          'X-Restli-Protocol-Version': '2.0.0',
        }),
      })
    );
    expect(result.id).toBe('msg-1');
    expect(result.date).toBeDefined();
  });

  it('throws when the recipient is missing', async () => {
    const provider = new LinkedInProvider(config);

    await expect(
      provider.sendMessage({ content: 'hi' } as never)
    ).rejects.toThrow('recipient is required');
  });

  it('throws when credentials are missing', async () => {
    const provider = new LinkedInProvider({ accessToken: '', authorUrn: '' });

    await expect(
      provider.sendMessage({ channel: 'urn:li:person:abc', content: 'hi' } as never)
    ).rejects.toThrow('requires accessToken and authorUrn');
  });
});

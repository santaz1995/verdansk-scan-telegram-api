import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class OpenaiService {
  private readonly openai: OpenAI;
  private readonly logger = new Logger(OpenaiService.name);
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPEN_AI_SECRET_KEY,
    });
  }

  async generateHaikuForStreamer(
    gameName: string,
    streamTitle: string,
  ): Promise<string> {
    const completion = await this.openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `Вітання. Уявивши, що я стример і стримаю гру ${gameName}. Я запустив стриму з назвою ${streamTitle}. Можеш написати смішну Хоку на 6 рядків для залучення глядачів`,
        },
      ],
      model: 'gpt-3.5-turbo',
    });

    return completion.choices[0].message.content;
  }
}

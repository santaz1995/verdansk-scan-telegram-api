import { Injectable } from '@nestjs/common';
import { App } from './app.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(App)
    private readonly appRepository: Repository<App>,
  ) {}

  async getMe(): Promise<string> {
    return 'Me';
  }

  async getStat(): Promise<App[]> {
    return this.appRepository.find();
  }
}

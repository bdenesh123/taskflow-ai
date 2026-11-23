import {
  Injectable,
  Inject,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from './database.constants';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(
    @Inject(KNEX_CONNECTION)
    private readonly knex: Knex,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.knex.raw('SELECT 1');
    this.logger.log('PostgreSQL connection established successfully');
  }

  async onModuleDestroy(): Promise<void> {
    await this.knex.destroy();
  }
}

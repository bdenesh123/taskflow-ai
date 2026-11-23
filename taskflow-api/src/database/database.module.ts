import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import knex, { Knex } from 'knex';
import { Model } from 'objection';
import { DatabaseService } from './database.service';
import { KNEX_CONNECTION } from './database.constants';
import pg from 'pg';

@Module({
  providers: [
    {
      provide: KNEX_CONNECTION,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Knex => {
        pg.types.setTypeParser(1082, (value: string) => value);

        const databaseUrl = config.get<string>('DATABASE_URL');

        const connection = knex({
          client: 'pg',
          connection: databaseUrl
            ? {
                connectionString: databaseUrl,
                ssl: { rejectUnauthorized: true },
              }
            : {
                host: config.getOrThrow<string>('DB_HOST'),
                port: Number(config.getOrThrow<string>('DB_PORT')),
                user: config.getOrThrow<string>('DB_USER'),
                password: config.getOrThrow<string>('DB_PASSWORD'),
                database: config.getOrThrow<string>('DB_NAME'),
                ssl:
                  config.get<string>('DB_SSL') === 'true'
                    ? { rejectUnauthorized: true }
                    : false,
              },
          pool: {
            min: 0,
            max: 10,
          },
        });

        Model.knex(connection);

        return connection;
      },
    },
    DatabaseService,
  ],
  exports: [KNEX_CONNECTION],
})
export class DatabaseModule {}

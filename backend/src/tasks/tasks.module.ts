import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { JwtAuthModule } from '../auth/jwt-auth/jwt-auth.module';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';

@Module({
  imports: [DatabaseModule, JwtAuthModule],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}

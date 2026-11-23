import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { JwtAuthModule } from '../auth/jwt-auth/jwt-auth.module';
import { PersonalTasksService } from './personal-tasks.service';
import { PersonalTasksController } from './personal-tasks.controller';

@Module({
  imports: [DatabaseModule, JwtAuthModule],
  controllers: [PersonalTasksController],
  providers: [PersonalTasksService],
})
export class PersonalTasksModule {}

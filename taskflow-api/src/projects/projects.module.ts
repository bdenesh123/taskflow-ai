import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { JwtAuthModule } from '../auth/jwt-auth/jwt-auth.module';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  imports: [DatabaseModule, JwtAuthModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
})
export class ProjectsModule {}

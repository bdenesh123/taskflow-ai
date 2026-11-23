import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { PersonalTasksService } from './personal-tasks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/decorators/current-user.decorator';
import { CreatePersonalTaskDto } from './dto/create-personal-task.dto';
import { UpdatePersonalTaskDto } from './dto/update-personal-task.dto';

@Controller('personal-tasks')
@UseGuards(JwtAuthGuard)
export class PersonalTasksController {
  constructor(private readonly personalTasksService: PersonalTasksService) {}

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreatePersonalTaskDto) {
    return this.personalTasksService.create(user.sub, dto);
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.personalTasksService.findAll(user.sub);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') taskId: string,
    @Body() dto: UpdatePersonalTaskDto,
  ) {
    return this.personalTasksService.update(user.sub, taskId, dto);
  }

  @Delete('completed')
  removeCompleted(@CurrentUser() user: JwtPayload) {
    return this.personalTasksService.removeCompleted(user.sub);
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtPayload, @Param('id') taskId: string) {
    return this.personalTasksService.remove(user.sub, taskId);
  }
}

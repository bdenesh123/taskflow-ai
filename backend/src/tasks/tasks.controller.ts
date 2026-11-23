import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/decorators/current-user.decorator';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Controller('projects/:projectId/tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(
    @CurrentUser() user: JwtPayload,
    @Param('projectId') projectId: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasksService.create(user.sub, projectId, dto);
  }

  @Get()
  findAllForProject(
    @CurrentUser() user: JwtPayload,
    @Param('projectId') projectId: string,
  ) {
    return this.tasksService.findAllForProject(user.sub, projectId);
  }

  @Patch(':taskId')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(user.sub, projectId, taskId, dto);
  }

  @Delete(':taskId')
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.tasksService.remove(user.sub, projectId, taskId);
  }

  @Get(':taskId')
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.tasksService.findOne(user.sub, projectId, taskId);
  }

  @Post(':taskId/comments')
  createComment(
    @CurrentUser() user: JwtPayload,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.tasksService.createComment(user.sub, projectId, taskId, dto);
  }

  @Get(':taskId/comments')
  findComments(
    @CurrentUser() user: JwtPayload,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.tasksService.findComments(user.sub, projectId, taskId);
  }

  @Patch(':taskId/comments/:commentId')
  updateComment(
    @CurrentUser() user: JwtPayload,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Param('commentId') commentId: string,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.tasksService.updateComment(
      user.sub,
      projectId,
      taskId,
      commentId,
      dto,
    );
  }

  @Delete(':taskId/comments/:commentId')
  @HttpCode(HttpStatus.OK)
  removeComment(
    @CurrentUser() user: JwtPayload,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Param('commentId') commentId: string,
  ) {
    return this.tasksService.removeComment(
      user.sub,
      projectId,
      taskId,
      commentId,
    );
  }
}

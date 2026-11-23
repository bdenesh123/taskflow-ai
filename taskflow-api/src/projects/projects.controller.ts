import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  type JwtPayload,
} from '../auth/decorators/current-user.decorator';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectsService } from './projects.service';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddProjectMemberDto } from './dto/add-project-member.dto';
import { TransferProjectOwnershipDto } from './dto/transfer-project-ownership.dto';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(user.sub, dto);
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.projectsService.findAllForUser(user.sub);
  }

  @Get(':id')
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.projectsService.findOneForUser(user.sub, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(user.sub, id, dto);
  }

  @Delete(':id')
  softDelete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.projectsService.softDelete(user.sub, id);
  }

  @Post(':id/members')
  addMember(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: AddProjectMemberDto,
  ) {
    return this.projectsService.addMember(user.sub, id, dto);
  }

  @Get(':id/members')
  findMembers(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.projectsService.findMembers(user.sub, id);
  }

  @Delete(':id/members/:userId')
  removeMember(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.projectsService.removeMember(user.sub, id, userId);
  }

  @Patch(':projectId/transfer-ownership')
  transferOwnership(
    @CurrentUser('sub') userId: string,
    @Param('projectId') projectId: string,
    @Body() dto: TransferProjectOwnershipDto,
  ) {
    return this.projectsService.transferOwnership(userId, projectId, dto);
  }
}

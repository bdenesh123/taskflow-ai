import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { Knex } from 'knex';

import { KNEX_CONNECTION } from '../database/database.constants';
import { Project } from './models/project.model';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddProjectMemberDto } from './dto/add-project-member.dto';
import { TransferProjectOwnershipDto } from './dto/transfer-project-ownership.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @Inject(KNEX_CONNECTION)
    private readonly knex: Knex,
  ) {}

  async create(ownerId: string, dto: CreateProjectDto) {
    const name = dto.name.trim();

    if (!name) {
      throw new BadRequestException('Project name cannot be blank');
    }

    return this.knex.transaction(async (trx) => {
      const project = await Project.query(trx)
        .insert({
          owner_id: ownerId,
          name,
          description: dto.description?.trim() || null,
          ...(dto.status !== undefined && { status: dto.status }),
          due_date: dto.due_date || null,
        })
        .returning('*');

      await trx('project_members').insert({
        project_id: project.id,
        user_id: ownerId,
        role: 'owner',
      });

      return project;
    });
  }

  async findAllForUser(userId: string) {
    return Project.query()
      .join('project_members', 'projects.id', 'project_members.project_id')
      .where('project_members.user_id', userId)
      .whereNull('projects.deleted_at')
      .select('projects.*')
      .orderBy('projects.created_at', 'desc');
  }

  async findOneForUser(userId: string, projectId: string) {
    const project = await Project.query()
      .join('project_members', 'projects.id', 'project_members.project_id')
      .where('project_members.user_id', userId)
      .where('projects.id', projectId)
      .whereNull('projects.deleted_at')
      .select('projects.*')
      .first();

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async update(userId: string, projectId: string, dto: UpdateProjectDto) {
    const project = await Project.query()
      .findById(projectId)
      .whereNull('deleted_at');

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.owner_id !== userId) {
      throw new ForbiddenException(
        'Only the project owner can update this project',
      );
    }

    const updates: Record<string, unknown> = {};

    if (dto.name !== undefined) {
      const name = dto.name.trim();

      if (!name) {
        throw new BadRequestException('Project name cannot be blank');
      }

      updates.name = name;
    }

    if (dto.description !== undefined) {
      updates.description = dto.description?.trim() || null;
    }

    if (dto.status !== undefined) {
      updates.status = dto.status;
    }

    if (dto.due_date !== undefined) {
      updates.due_date = dto.due_date;
    }

    if (Object.keys(updates).length === 0) {
      throw new BadRequestException('At least one field must be provided');
    }

    updates.updated_at = new Date();

    return Project.query().patchAndFetchById(projectId, updates);
  }

  async softDelete(userId: string, projectId: string) {
    const project = await Project.query()
      .findById(projectId)
      .whereNull('deleted_at');

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.owner_id !== userId) {
      throw new ForbiddenException(
        'Only the project owner can delete this project',
      );
    }

    await Project.query().patchAndFetchById(projectId, {
      deleted_at: new Date(),
      updated_at: new Date(),
    });

    return {
      message: 'Project deleted successfully',
    };
  }

  async addMember(
    ownerId: string,
    projectId: string,
    dto: AddProjectMemberDto,
  ) {
    return this.knex.transaction(async (trx) => {
      const project = await Project.query(trx)
        .findById(projectId)
        .whereNull('deleted_at');

      if (!project) {
        throw new NotFoundException('Project not found');
      }

      if (project.owner_id !== ownerId) {
        throw new ForbiddenException('Only the project owner can add members');
      }

      const user = await trx('users').where({ id: dto.user_id }).first('id');

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const [member] = await trx('project_members')
        .insert({
          project_id: projectId,
          user_id: dto.user_id,
          role: 'member',
        })
        .onConflict(['project_id', 'user_id'])
        .ignore()
        .returning('*');

      if (!member) {
        throw new ConflictException('User is already a member of this project');
      }

      return member;
    });
  }

  async findMembers(userId: string, projectId: string) {
    // 1. Check that the project exists and is not deleted.
    const project = await Project.query()
      .findById(projectId)
      .whereNull('deleted_at');

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // 2. Check that the requesting user belongs to the project.
    const membership = await this.knex('project_members')
      .where({
        project_id: projectId,
        user_id: userId,
      })
      .first();

    if (!membership) {
      throw new NotFoundException('Project not found');
    }

    // 3. Retrieve the project members and their user details.
    return this.knex('project_members as pm')
      .join('users as u', 'u.id', 'pm.user_id')
      .where('pm.project_id', projectId)
      .select(
        'pm.project_id',
        'pm.user_id',
        'u.name',
        'u.email',
        'pm.role',
        'pm.joined_at',
      )
      .orderBy('pm.joined_at', 'asc');
  }

  async removeMember(ownerId: string, projectId: string, userId: string) {
    return this.knex.transaction(async (trx) => {
      // 1. Check that the project exists and is not deleted.
      const project = await Project.query(trx)
        .findById(projectId)
        .whereNull('deleted_at');

      if (!project) {
        throw new NotFoundException('Project not found');
      }

      // 2. Only the project owner can remove members.
      if (project.owner_id !== ownerId) {
        throw new ForbiddenException(
          'Only the project owner can remove members',
        );
      }

      // 3. Prevent the owner from removing themselves.
      if (ownerId === userId) {
        throw new BadRequestException(
          'The project owner cannot remove themselves',
        );
      }

      // 4. Check that the user is a member of this project.
      const membership = await trx('project_members')
        .where({
          project_id: projectId,
          user_id: userId,
        })
        .first();

      if (!membership) {
        throw new NotFoundException('Project member not found');
      }

      // 5. Unassign the member from tasks in this project.
      await trx('tasks')
        .where({
          project_id: projectId,
          assignee_id: userId,
        })
        .whereNull('deleted_at')
        .update({
          assignee_id: null,
          updated_at: new Date(),
        });

      // 6. Remove the membership.
      await trx('project_members')
        .where({
          project_id: projectId,
          user_id: userId,
        })
        .delete();

      return {
        message: 'Project member removed successfully',
      };
    });
  }

  async transferOwnership(
    ownerId: string,
    projectId: string,
    dto: TransferProjectOwnershipDto,
  ) {
    return this.knex.transaction(async (trx) => {
      // 1. Retrieve and lock the active project.
      const project = await trx('projects')
        .where({ id: projectId })
        .whereNull('deleted_at')
        .forUpdate()
        .first();

      if (!project) {
        throw new NotFoundException('Project not found');
      }

      // 2. Only the current owner can transfer ownership.
      if (project.owner_id !== ownerId) {
        throw new ForbiddenException(
          'Only the project owner can transfer ownership',
        );
      }

      // 3. Prevent transferring ownership to yourself.
      if (ownerId === dto.new_owner_id) {
        throw new BadRequestException('You are already the project owner');
      }

      // 4. Verify the new owner is an existing project member.
      const newOwnerMembership = await trx('project_members')
        .where({
          project_id: projectId,
          user_id: dto.new_owner_id,
        })
        .forUpdate()
        .first();

      if (!newOwnerMembership) {
        throw new BadRequestException(
          'The new owner must already be a member of this project',
        );
      }

      // 5. Update the project's actual owner.
      await trx('projects').where({ id: projectId }).update({
        owner_id: dto.new_owner_id,
        updated_at: new Date(),
      });

      // 6. Demote the previous owner.
      await trx('project_members')
        .where({
          project_id: projectId,
          user_id: ownerId,
        })
        .update({ role: 'member' });

      // 7. Promote the new owner.
      await trx('project_members')
        .where({
          project_id: projectId,
          user_id: dto.new_owner_id,
        })
        .update({ role: 'owner' });

      return {
        message: 'Project ownership transferred successfully',
        project_id: projectId,
        previous_owner_id: ownerId,
        new_owner_id: dto.new_owner_id,
      };
    });
  }
}

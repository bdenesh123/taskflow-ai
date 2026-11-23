import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Knex } from 'knex';

import { KNEX_CONNECTION } from '../database/database.constants';
import { CreateTaskDto } from './dto/create-task.dto';
import { Task } from './models/task.model';
import { Project } from '../projects/models/project.model';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class TasksService {
  constructor(
    @Inject(KNEX_CONNECTION)
    private readonly knex: Knex,
  ) {}

  async create(creatorId: string, projectId: string, dto: CreateTaskDto) {
    return this.knex.transaction(async (trx) => {
      // 1. Check that the project exists and is not deleted.
      const project = await Project.query(trx)
        .findById(projectId)
        .whereNull('deleted_at');

      if (!project) {
        throw new NotFoundException('Project not found');
      }

      // 2. Check that the creator belongs to the project.
      const creatorMembership = await trx('project_members')
        .where({
          project_id: projectId,
          user_id: creatorId,
        })
        .first();

      if (!creatorMembership) {
        throw new NotFoundException('Project not found');
      }

      // 3. Validate the assignee, if one was supplied.
      const assigneeId = dto.assignee_id ?? null;

      if (assigneeId !== null) {
        const assigneeMembership = await trx('project_members')
          .where({
            project_id: projectId,
            user_id: assigneeId,
          })
          .first();

        if (!assigneeMembership) {
          throw new BadRequestException(
            'Assignee must be a member of this project',
          );
        }
      }

      // 4. Insert the task.
      const task = await Task.query(trx).insert({
        project_id: projectId,
        creator_id: creatorId,
        assignee_id: assigneeId,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        status: dto.status ?? 'todo',
        priority: dto.priority ?? 'medium',
        due_date: dto.due_date ?? null,
      });

      return task;
    });
  }

  async findAllForProject(requesterId: string, projectId: string) {
    // 1. Check that the project exists and is not soft-deleted.
    const project = await Project.query()
      .findById(projectId)
      .whereNull('deleted_at');

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // 2. Check that the requester is a member of this project.
    const membership = await this.knex('project_members')
      .where({
        project_id: projectId,
        user_id: requesterId,
      })
      .first();

    if (!membership) {
      throw new NotFoundException('Project not found');
    }

    // 3. Retrieve active tasks, newest first.
    return Task.query()
      .where('project_id', projectId)
      .whereNull('deleted_at')
      .withGraphFetched('assignee')
      .modifyGraph('assignee', (builder) => {
        builder.select('id', 'name', 'email', 'avatar_url');
      })
      .orderBy('created_at', 'desc');
  }

  async update(
    requesterId: string,
    projectId: string,
    taskId: string,
    dto: UpdateTaskDto,
  ) {
    return this.knex.transaction(async (trx) => {
      // 1. Check that the project exists and is active.
      const project = await Project.query(trx)
        .findById(projectId)
        .whereNull('deleted_at');

      if (!project) {
        throw new NotFoundException('Project not found');
      }

      // 2. Check project membership.
      const membership = await trx('project_members')
        .where({
          project_id: projectId,
          user_id: requesterId,
        })
        .first();

      if (!membership) {
        throw new NotFoundException('Project not found');
      }

      // 3. Find the task within this project.
      const task = await Task.query(trx)
        .findById(taskId)
        .where('project_id', projectId)
        .whereNull('deleted_at');

      if (!task) {
        throw new NotFoundException('Task not found');
      }

      // 4. Validate a supplied title.
      if (dto.title !== undefined && dto.title.trim().length === 0) {
        throw new BadRequestException('Title cannot be empty');
      }

      // 5. Validate a supplied assignee.
      if (dto.assignee_id !== undefined && dto.assignee_id !== null) {
        const assigneeMembership = await trx('project_members')
          .where({
            project_id: projectId,
            user_id: dto.assignee_id,
          })
          .first();

        if (!assigneeMembership) {
          throw new BadRequestException(
            'Assignee must be a member of this project',
          );
        }
      }

      // 6. Update only fields supplied in the request.
      const changes: Record<string, unknown> = {};

      if (dto.title !== undefined) {
        changes.title = dto.title.trim();
      }

      if (dto.description !== undefined) {
        changes.description = dto.description?.trim() || null;
      }

      if (dto.assignee_id !== undefined) {
        changes.assignee_id = dto.assignee_id;
      }

      if (dto.status !== undefined) {
        changes.status = dto.status;
      }

      if (dto.priority !== undefined) {
        changes.priority = dto.priority;
      }

      if (dto.due_date !== undefined) {
        changes.due_date = dto.due_date;
      }

      if (Object.keys(changes).length === 0) {
        throw new BadRequestException('At least one field must be provided');
      }

      changes.updated_at = this.knex.fn.now();

      return Task.query(trx).patchAndFetchById(taskId, changes);
    });
  }

  async remove(requesterId: string, projectId: string, taskId: string) {
    return this.knex.transaction(async (trx) => {
      // 1. Check that the project exists and is active.
      const project = await Project.query(trx)
        .findById(projectId)
        .whereNull('deleted_at');

      if (!project) {
        throw new NotFoundException('Project not found');
      }

      // 2. Check that the requester belongs to the project.
      const membership = await trx('project_members')
        .where({
          project_id: projectId,
          user_id: requesterId,
        })
        .first();

      if (!membership) {
        throw new NotFoundException('Project not found');
      }

      // 3. Find the active task within this project.
      const task = await Task.query(trx)
        .findById(taskId)
        .where('project_id', projectId)
        .whereNull('deleted_at');

      if (!task) {
        throw new NotFoundException('Task not found');
      }

      // 4. Soft-delete the task.
      await Task.query(trx).findById(taskId).patch({
        deleted_at: this.knex.fn.now(),
        updated_at: this.knex.fn.now(),
      });

      return {
        message: 'Task deleted successfully',
      };
    });
  }

  async findOne(requesterId: string, projectId: string, taskId: string) {
    // 1. Check that the project exists and is active.
    const project = await Project.query()
      .findById(projectId)
      .whereNull('deleted_at');

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // 2. Check that the requester belongs to the project.
    const membership = await this.knex('project_members')
      .where({
        project_id: projectId,
        user_id: requesterId,
      })
      .first();

    if (!membership) {
      throw new NotFoundException('Project not found');
    }

    // 3. Find the active task within this project.
    const task = await Task.query()
      .findById(taskId)
      .where('project_id', projectId)
      .whereNull('deleted_at');

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async createComment(
    requesterId: string,
    projectId: string,
    taskId: string,
    dto: CreateCommentDto,
  ) {
    // 1. Reject comments containing only whitespace.
    const content = dto.content.trim();

    if (content.length === 0) {
      throw new BadRequestException('Comment content cannot be empty');
    }

    return this.knex.transaction(async (trx) => {
      // 2. Check that the project exists and is active.
      const project = await Project.query(trx)
        .findById(projectId)
        .whereNull('deleted_at');

      if (!project) {
        throw new NotFoundException('Project not found');
      }

      // 3. Check project membership.
      const membership = await trx('project_members')
        .where({
          project_id: projectId,
          user_id: requesterId,
        })
        .first();

      if (!membership) {
        throw new NotFoundException('Project not found');
      }

      // 4. Check that the task is active and belongs to the project.
      const task = await Task.query(trx)
        .findById(taskId)
        .where('project_id', projectId)
        .whereNull('deleted_at');

      if (!task) {
        throw new NotFoundException('Task not found');
      }

      // 5. Insert the comment.
      const [comment] = await trx('comments')
        .insert({
          task_id: taskId,
          author_id: requesterId,
          content,
        })
        .returning([
          'id',
          'task_id',
          'author_id',
          'content',
          'created_at',
          'updated_at',
        ]);

      return comment;
    });
  }

  async findComments(requesterId: string, projectId: string, taskId: string) {
    // 1. Check that the project exists and is active.
    const project = await Project.query()
      .findById(projectId)
      .whereNull('deleted_at');

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // 2. Check that the requester belongs to the project.
    const membership = await this.knex('project_members')
      .where({
        project_id: projectId,
        user_id: requesterId,
      })
      .first();

    if (!membership) {
      throw new NotFoundException('Project not found');
    }

    // 3. Check that the task is active and belongs to the project.
    const task = await Task.query()
      .findById(taskId)
      .where('project_id', projectId)
      .whereNull('deleted_at');

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // 4. Return comments in chronological order.
    return this.knex('comments')
      .select(
        'id',
        'task_id',
        'author_id',
        'content',
        'created_at',
        'updated_at',
      )
      .where('task_id', taskId)
      .orderBy('created_at', 'asc')
      .orderBy('id', 'asc');
  }

  async updateComment(
    requesterId: string,
    projectId: string,
    taskId: string,
    commentId: string,
    dto: UpdateCommentDto,
  ) {
    const content = dto.content.trim();

    if (!content) {
      throw new BadRequestException('Comment content cannot be empty');
    }

    return this.knex.transaction(async (trx) => {
      const project = await Project.query(trx)
        .findById(projectId)
        .whereNull('deleted_at');

      if (!project) {
        throw new NotFoundException('Project not found');
      }

      const membership = await trx('project_members')
        .where({
          project_id: projectId,
          user_id: requesterId,
        })
        .first();

      if (!membership) {
        throw new NotFoundException('Project not found');
      }

      const task = await Task.query(trx)
        .findById(taskId)
        .where({
          project_id: projectId,
        })
        .whereNull('deleted_at');

      if (!task) {
        throw new NotFoundException('Task not found');
      }

      const comment = await trx('comments')
        .where({
          id: commentId,
          task_id: taskId,
        })
        .first();

      if (!comment) {
        throw new NotFoundException('Comment not found');
      }

      if (comment.author_id !== requesterId) {
        throw new ForbiddenException(
          'Only the comment author can edit this comment',
        );
      }

      const [updatedComment] = await trx('comments')
        .where({
          id: commentId,
          task_id: taskId,
        })
        .update({
          content,
          updated_at: trx.fn.now(),
        })
        .returning([
          'id',
          'task_id',
          'author_id',
          'content',
          'created_at',
          'updated_at',
        ]);

      return updatedComment;
    });
  }

  async removeComment(
    requesterId: string,
    projectId: string,
    taskId: string,
    commentId: string,
  ) {
    return this.knex.transaction(async (trx) => {
      const project = await Project.query(trx)
        .findById(projectId)
        .whereNull('deleted_at');

      if (!project) {
        throw new NotFoundException('Project not found');
      }

      const membership = await trx('project_members')
        .where({
          project_id: projectId,
          user_id: requesterId,
        })
        .first();

      if (!membership) {
        throw new NotFoundException('Project not found');
      }

      const task = await Task.query(trx)
        .findById(taskId)
        .where({ project_id: projectId })
        .whereNull('deleted_at');

      if (!task) {
        throw new NotFoundException('Task not found');
      }

      const comment = await trx('comments')
        .where({
          id: commentId,
          task_id: taskId,
        })
        .first();

      if (!comment) {
        throw new NotFoundException('Comment not found');
      }

      if (comment.author_id !== requesterId) {
        throw new ForbiddenException(
          'Only the comment author can delete this comment',
        );
      }

      await trx('comments')
        .where({
          id: commentId,
          task_id: taskId,
        })
        .delete();
      return {
        message: 'Comment deleted successfully',
      };
    });
  }
}

import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Knex } from 'knex';
import { CreatePersonalTaskDto } from './dto/create-personal-task.dto';
import { KNEX_CONNECTION } from '../database/database.constants';
import { UpdatePersonalTaskDto } from './dto/update-personal-task.dto';

@Injectable()
export class PersonalTasksService {
  constructor(
    @Inject(KNEX_CONNECTION)
    private readonly knex: Knex,
  ) {}

  async create(userId: string, dto: CreatePersonalTaskDto) {
    const title = dto.title.trim();

    if (!title) {
      throw new BadRequestException('Title cannot be empty');
    }

    const [task] = await this.knex('personal_tasks')
      .insert({
        user_id: userId,
        title,
        description: dto.description?.trim() || null,
        priority: dto.priority ?? 'medium',
        due_date: dto.due_date ?? null,
      })
      .returning('*');

    return task;
  }

  async findAll(userId: string) {
    return this.knex('personal_tasks')
      .where('user_id', userId)
      .orderBy('is_completed', 'asc')
      .orderBy('due_date', 'asc')
      .orderBy('created_at', 'desc');
  }

  async update(userId: string, taskId: string, dto: UpdatePersonalTaskDto) {
    const changes: Record<string, unknown> = {};

    if (dto.title !== undefined) {
      const title = dto.title.trim();

      if (!title) {
        throw new BadRequestException('Title cannot be empty');
      }

      changes.title = title;
    }

    if (dto.description !== undefined) {
      changes.description = dto.description?.trim() || null;
    }

    if (dto.priority !== undefined) {
      changes.priority = dto.priority;
    }

    if (dto.due_date !== undefined) {
      changes.due_date = dto.due_date;
    }

    if (dto.is_completed !== undefined) {
      changes.is_completed = dto.is_completed;
    }

    if (Object.keys(changes).length === 0) {
      throw new BadRequestException('At least one field must be provided');
    }

    changes.updated_at = this.knex.fn.now();

    const [task] = await this.knex('personal_tasks')
      .where({
        id: taskId,
        user_id: userId,
      })
      .update(changes)
      .returning('*');

    if (!task) {
      throw new NotFoundException('Personal task not found');
    }

    return task;
  }

  async remove(userId: string, taskId: string) {
    const deletedCount = await this.knex('personal_tasks')
      .where({
        id: taskId,
        user_id: userId,
      })
      .del();

    if (deletedCount === 0) {
      throw new NotFoundException('Personal task not found');
    }

    return {
      message: 'Personal task deleted successfully',
    };
  }

  async removeCompleted(userId: string) {
    const deletedCount = await this.knex('personal_tasks')
      .where({
        user_id: userId,
        is_completed: true,
      })
      .del();

    return {
      message: 'Completed personal tasks deleted successfully',
      deletedCount,
    };
  }
}

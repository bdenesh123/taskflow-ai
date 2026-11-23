import {
  ConflictException,
  Inject,
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Knex } from 'knex';
import * as bcrypt from 'bcrypt';
import { KNEX_CONNECTION } from '../database/database.constants';
import { User } from './models/user.model';
import { CreateUserDto } from './dto/create-user.dto';

import { UniqueViolationError } from 'objection';

@Injectable()
export class UsersService {
  constructor(
    @Inject(KNEX_CONNECTION)
    private readonly knex: Knex,
  ) {}

  async findAll() {
    return User.query(this.knex)
      .select('id', 'name', 'email', 'avatar_url', 'created_at', 'updated_at')
      .orderBy('id', 'asc');
  }

  async findOne(id: string) {
    const user = await User.query(this.knex)
      .findById(id)
      .select('id', 'name', 'email', 'avatar_url', 'created_at', 'updated_at');

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return user;
  }

  async create(dto: CreateUserDto) {
    const email = dto.email.trim().toLowerCase();
    const name = dto.name.trim();

    if (!name) {
      throw new BadRequestException('Name cannot be blank');
    }

    if (Buffer.byteLength(dto.password, 'utf8') > 72) {
      throw new BadRequestException('Password must not exceed 72 UTF-8 bytes');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    try {
      const user = await User.query(this.knex).insert({
        name,
        email,
        password_hash: passwordHash,
      });

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
        created_at: user.created_at,
        updated_at: user.updated_at,
      };
    } catch (error: unknown) {
      if (error instanceof UniqueViolationError) {
        throw new ConflictException('Email is already registered');
      }

      throw error;
    }
  }
}

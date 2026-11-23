import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Knex } from 'knex';
import * as bcrypt from 'bcrypt';

import { KNEX_CONNECTION } from '../database/database.constants';
import { User } from '../users/models/user.model';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(KNEX_CONNECTION)
    private readonly knex: Knex,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();

    const user = await User.query(this.knex).findOne({ email });

    if (!user || user.deactivated_at !== null) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.password_hash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
    });

    return {
      access_token: accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
      },
    };
  }

  async register(dto: RegisterDto) {
    const name = dto.name.trim();
    const email = dto.email.trim().toLowerCase();

    if (!name) {
      throw new BadRequestException('Name cannot be empty');
    }

    if (Buffer.byteLength(dto.password, 'utf8') > 72) {
      throw new BadRequestException('Password cannot exceed 72 bytes');
    }

    // Check whether the email is already registered.
    const existingUser = await User.query(this.knex).findOne({
      email,
    });

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    // Hash the password before storing it.
    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Create the new user.
    const user = await User.query(this.knex).insert({
      name,
      email,
      password_hash: passwordHash,
    });

    // Generate an access token.
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
    });

    return {
      access_token: accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
      },
    };
  }

  async deactivateAccount(userId: string, password: string) {
    return this.knex.transaction(async (trx) => {
      // 1. Retrieve and lock the user account.
      const user = await trx('users').where({ id: userId }).forUpdate().first();

      if (!user || user.deactivated_at !== null) {
        throw new UnauthorizedException('Invalid account');
      }

      // 2. Verify the current password.
      const passwordMatches = await bcrypt.compare(
        password,
        user.password_hash,
      );

      if (!passwordMatches) {
        throw new UnauthorizedException('Invalid password');
      }

      // 3. Check for active projects owned by this user.
      const ownedProjects = await trx('projects')
        .select('id', 'name')
        .where({
          owner_id: userId,
        })
        .whereNull('deleted_at');

      if (ownedProjects.length > 0) {
        throw new BadRequestException({
          message:
            'Transfer ownership of your active projects before deactivating your account.',
          projects: ownedProjects,
        });
      }

      // 4. Clear task assignments belonging to this user.
      await trx('tasks')
        .where({ assignee_id: userId })
        .whereNull('deleted_at')
        .update({
          assignee_id: null,
          updated_at: new Date(),
        });

      // 5. Remove the user's project memberships.
      await trx('project_members').where({ user_id: userId }).delete();

      // 6. Delete the user's personal tasks.
      await trx('personal_tasks').where({ user_id: userId }).delete();

      // 7. Deactivate the user account.
      await trx('users').where({ id: userId }).update({
        deactivated_at: new Date(),
        updated_at: new Date(),
      });

      // 8. Return the success response.
      return {
        message: 'Account deactivated successfully',
      };
    });
  }
}

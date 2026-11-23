import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export type JwtPayload = {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
};

type AuthenticatedRequest = Request & {
  user: JwtPayload;
};

export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    return data ? request.user[data] : request.user;
  },
);

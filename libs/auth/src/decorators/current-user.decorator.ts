/**
 * Current User decorator
 * Extracts the current authenticated user from request
 */
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '@assureqai/common';

export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtPayload;

    return data ? user?.[data] : user;
  },
);

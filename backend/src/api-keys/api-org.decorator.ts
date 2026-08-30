import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const ApiOrganizationId = createParamDecorator((_: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest();
  return request.apiOrganizationId as string;
});

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ALLOWED_PROFILES_KEY } from '../decorators/allowed-profiles.decorator';
import { ProfileType } from '../../common/enums/profile-type.enum';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

@Injectable()
export class ProfileAccessGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowedProfiles =
      this.reflector.getAllAndOverride<ProfileType[]>(ALLOWED_PROFILES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (allowedProfiles.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuário autenticado não encontrado.');
    }

    if (!allowedProfiles.includes(user.profileType)) {
      throw new ForbiddenException(
        'Seu perfil não possui permissão para acessar este recurso.',
      );
    }

    return true;
  }
}

import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { AuthRequest, JwtPayload } from './auth.types';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private readonly jwtService = new JwtService({
    secret: process.env.JWT_SECRET ?? 'SECRET_KEY',
  });

  use(req: Request, _res: Response, next: NextFunction) {
    const request = req as AuthRequest;
    const authorization =
      (request.headers['authorization'] as string) ||
      (request.headers['Authorization'] as string);

    if (!authorization) {
      throw new UnauthorizedException('Authorization header missing');
    }

    const [scheme, token] = authorization.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException(
        'Authorization header must be in the format: Bearer <token>',
      );
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET ?? 'SECRET_KEY',
      }) as JwtPayload;

      if (payload.type !== 'access') {
        throw new UnauthorizedException('Invalid token type');
      }

      request.user = payload;
      next();
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }
}

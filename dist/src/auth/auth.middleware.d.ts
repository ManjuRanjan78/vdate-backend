import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
export declare class AuthMiddleware implements NestMiddleware {
    private readonly jwtService;
    use(req: Request, _res: Response, next: NextFunction): void;
}

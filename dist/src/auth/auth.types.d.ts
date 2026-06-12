import { Request } from 'express';
export interface JwtPayload {
    userId: string;
    type?: 'access' | 'refresh';
}
export interface AuthRequest extends Request {
    user?: JwtPayload;
}

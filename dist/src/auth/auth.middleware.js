"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthMiddleware = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
let AuthMiddleware = class AuthMiddleware {
    jwtService = new jwt_1.JwtService({
        secret: process.env.JWT_SECRET ?? 'SECRET_KEY',
    });
    use(req, _res, next) {
        const request = req;
        const authorization = request.headers['authorization'] ||
            request.headers['Authorization'];
        if (!authorization) {
            throw new common_1.UnauthorizedException('Authorization header missing');
        }
        const [scheme, token] = authorization.split(' ');
        if (scheme !== 'Bearer' || !token) {
            throw new common_1.UnauthorizedException('Authorization header must be in the format: Bearer <token>');
        }
        try {
            const payload = this.jwtService.verify(token, {
                secret: process.env.JWT_SECRET ?? 'SECRET_KEY',
            });
            if (payload.type !== 'access') {
                throw new common_1.UnauthorizedException('Invalid token type');
            }
            request.user = payload;
            next();
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid or expired access token');
        }
    }
};
exports.AuthMiddleware = AuthMiddleware;
exports.AuthMiddleware = AuthMiddleware = __decorate([
    (0, common_1.Injectable)()
], AuthMiddleware);
//# sourceMappingURL=auth.middleware.js.map
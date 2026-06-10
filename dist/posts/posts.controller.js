"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostsController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const posts_service_1 = require("./posts.service");
const users_entity_1 = require("../users/users.entity");
let PostsController = class PostsController {
    postsService;
    userRepository;
    constructor(postsService, userRepository) {
        this.postsService = postsService;
        this.userRepository = userRepository;
    }
    mapPostToResponse(post) {
        return {
            id: post.id.toString(),
            userId: post.userId.toString(),
            userName: post.user?.name || 'User',
            userAvatar: post.user?.imageUrl || '',
            text: post.text,
            imageUrl: post.imageUrl || null,
            createdAt: post.createdAt.toISOString(),
            likes: post.likes || [],
            comments: post.comments || [],
            shareCount: post.shareCount || 0,
        };
    }
    async getPosts() {
        const posts = await this.postsService.findAll();
        return posts.map((post) => this.mapPostToResponse(post));
    }
    async createPost(req, body) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new common_1.UnauthorizedException();
        }
        const post = await this.postsService.create(Number(userId), body.text, body.imageUrl);
        return this.mapPostToResponse(post);
    }
    async likePost(req, id) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new common_1.UnauthorizedException();
        }
        const post = await this.postsService.toggleLike(Number(id), userId.toString());
        return this.mapPostToResponse(post);
    }
    async commentPost(req, id, body) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new common_1.UnauthorizedException();
        }
        const user = await this.userRepository.findOneBy({ id: Number(userId) });
        const userName = user?.name || 'User';
        const userAvatar = user?.imageUrl || '';
        const comment = await this.postsService.addComment(Number(id), userId.toString(), userName, userAvatar, body.text);
        return comment;
    }
    async updatePost(req, id, body) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new common_1.UnauthorizedException();
        }
        const post = await this.postsService.update(Number(id), Number(userId), body.text);
        return this.mapPostToResponse(post);
    }
    async deletePost(req, id) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new common_1.UnauthorizedException();
        }
        await this.postsService.delete(Number(id), Number(userId));
        return { success: true };
    }
};
exports.PostsController = PostsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "getPosts", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "createPost", null);
__decorate([
    (0, common_1.Post)(':id/like'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "likePost", null);
__decorate([
    (0, common_1.Post)(':id/comment'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "commentPost", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "updatePost", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "deletePost", null);
exports.PostsController = PostsController = __decorate([
    (0, common_1.Controller)('posts'),
    __param(1, (0, typeorm_1.InjectRepository)(users_entity_1.User)),
    __metadata("design:paramtypes", [posts_service_1.PostsService,
        typeorm_2.Repository])
], PostsController);
//# sourceMappingURL=posts.controller.js.map
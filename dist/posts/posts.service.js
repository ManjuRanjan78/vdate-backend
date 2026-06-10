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
exports.PostsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const post_entity_1 = require("./entities/post.entity");
const users_entity_1 = require("../users/users.entity");
let PostsService = class PostsService {
    postRepository;
    userRepository;
    constructor(postRepository, userRepository) {
        this.postRepository = postRepository;
        this.userRepository = userRepository;
    }
    async findAll() {
        return this.postRepository.find({
            order: {
                createdAt: 'DESC',
            },
        });
    }
    async create(userId, text, imageUrl) {
        const user = await this.userRepository.findOneBy({ id: userId });
        if (!user) {
            throw new common_1.NotFoundException(`User with ID ${userId} not found`);
        }
        const post = this.postRepository.create({
            userId,
            text,
            imageUrl,
            likes: [],
            comments: [],
            shareCount: 0,
        });
        const saved = await this.postRepository.save(post);
        const reloaded = await this.postRepository.findOneBy({ id: saved.id });
        if (!reloaded) {
            throw new common_1.NotFoundException('Could not reload created post');
        }
        return reloaded;
    }
    async toggleLike(postId, userIdStr) {
        const post = await this.postRepository.findOneBy({ id: postId });
        if (!post) {
            throw new common_1.NotFoundException(`Post with ID ${postId} not found`);
        }
        const likes = post.likes || [];
        const index = likes.indexOf(userIdStr);
        if (index > -1) {
            likes.splice(index, 1);
        }
        else {
            likes.push(userIdStr);
        }
        post.likes = likes;
        await this.postRepository.save(post);
        return post;
    }
    async addComment(postId, userId, userName, userAvatar, text) {
        const post = await this.postRepository.findOneBy({ id: postId });
        if (!post) {
            throw new common_1.NotFoundException(`Post with ID ${postId} not found`);
        }
        const comment = {
            id: `c_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
            userId,
            userName,
            userAvatar,
            text,
            createdAt: new Date().toISOString(),
        };
        post.comments = [...(post.comments || []), comment];
        await this.postRepository.save(post);
        return comment;
    }
    async incrementShareCount(postId) {
        const post = await this.postRepository.findOneBy({ id: postId });
        if (!post) {
            throw new common_1.NotFoundException(`Post with ID ${postId} not found`);
        }
        post.shareCount = (post.shareCount || 0) + 1;
        return this.postRepository.save(post);
    }
    async update(postId, userId, text) {
        const post = await this.postRepository.findOneBy({ id: postId });
        if (!post) {
            throw new common_1.NotFoundException(`Post with ID ${postId} not found`);
        }
        if (post.userId !== userId) {
            throw new common_1.UnauthorizedException('You can only edit your own posts');
        }
        post.text = text;
        await this.postRepository.save(post);
        const reloaded = await this.postRepository.findOneBy({ id: postId });
        if (!reloaded) {
            throw new common_1.NotFoundException('Could not reload updated post');
        }
        return reloaded;
    }
    async delete(postId, userId) {
        const post = await this.postRepository.findOneBy({ id: postId });
        if (!post) {
            throw new common_1.NotFoundException(`Post with ID ${postId} not found`);
        }
        if (post.userId !== userId) {
            throw new common_1.UnauthorizedException('You can only delete your own posts');
        }
        await this.postRepository.remove(post);
    }
};
exports.PostsService = PostsService;
exports.PostsService = PostsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(post_entity_1.Post)),
    __param(1, (0, typeorm_1.InjectRepository)(users_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], PostsService);
//# sourceMappingURL=posts.service.js.map
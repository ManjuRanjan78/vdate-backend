import { Repository } from 'typeorm';
import { PostsService } from './posts.service';
import { User } from '../users/users.entity';
export declare class PostsController {
    private readonly postsService;
    private readonly userRepository;
    constructor(postsService: PostsService, userRepository: Repository<User>);
    private mapPostToResponse;
    getPosts(): Promise<{
        id: string;
        userId: string;
        userName: string;
        userAvatar: string;
        text: string;
        imageUrl: string | null;
        createdAt: string;
        likes: string[];
        comments: {
            id: string;
            userId: string;
            userName: string;
            userAvatar: string;
            text: string;
            createdAt: string;
        }[];
        shareCount: number;
    }[]>;
    createPost(req: any, body: {
        text: string;
        imageUrl?: string;
    }): Promise<{
        id: string;
        userId: string;
        userName: string;
        userAvatar: string;
        text: string;
        imageUrl: string | null;
        createdAt: string;
        likes: string[];
        comments: {
            id: string;
            userId: string;
            userName: string;
            userAvatar: string;
            text: string;
            createdAt: string;
        }[];
        shareCount: number;
    }>;
    likePost(req: any, id: string): Promise<{
        id: string;
        userId: string;
        userName: string;
        userAvatar: string;
        text: string;
        imageUrl: string | null;
        createdAt: string;
        likes: string[];
        comments: {
            id: string;
            userId: string;
            userName: string;
            userAvatar: string;
            text: string;
            createdAt: string;
        }[];
        shareCount: number;
    }>;
    commentPost(req: any, id: string, body: {
        text: string;
    }): Promise<any>;
    updatePost(req: any, id: string, body: {
        text: string;
    }): Promise<{
        id: string;
        userId: string;
        userName: string;
        userAvatar: string;
        text: string;
        imageUrl: string | null;
        createdAt: string;
        likes: string[];
        comments: {
            id: string;
            userId: string;
            userName: string;
            userAvatar: string;
            text: string;
            createdAt: string;
        }[];
        shareCount: number;
    }>;
    deletePost(req: any, id: string): Promise<{
        success: boolean;
    }>;
}

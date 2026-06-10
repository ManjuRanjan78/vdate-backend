import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { User } from '../users/users.entity';
export declare class PostsService {
    private readonly postRepository;
    private readonly userRepository;
    constructor(postRepository: Repository<Post>, userRepository: Repository<User>);
    findAll(): Promise<Post[]>;
    create(userId: number, text: string, imageUrl?: string): Promise<Post>;
    toggleLike(postId: number, userIdStr: string): Promise<Post>;
    addComment(postId: number, userId: string, userName: string, userAvatar: string, text: string): Promise<any>;
    incrementShareCount(postId: number): Promise<Post>;
    update(postId: number, userId: number, text: string): Promise<Post>;
    delete(postId: number, userId: number): Promise<void>;
}

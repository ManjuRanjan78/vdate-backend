import { User } from '../../users/users.entity';
export declare class Post {
    id: number;
    userId: number;
    user: User;
    text: string;
    imageUrl?: string;
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
    createdAt: Date;
    updatedAt: Date;
}

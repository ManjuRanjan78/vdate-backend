import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { User } from '../users/users.entity';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<Post[]> {
    return this.postRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async create(userId: number, text: string, imageUrl?: string): Promise<Post> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
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
    // Reload to populate the eager relationship
    const reloaded = await this.postRepository.findOneBy({ id: saved.id });
    if (!reloaded) {
      throw new NotFoundException('Could not reload created post');
    }
    return reloaded;
  }

  async toggleLike(postId: number, userIdStr: string): Promise<Post> {
    const post = await this.postRepository.findOneBy({ id: postId });
    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    const likes = post.likes || [];
    const index = likes.indexOf(userIdStr);
    if (index > -1) {
      likes.splice(index, 1);
    } else {
      likes.push(userIdStr);
    }

    post.likes = likes;
    await this.postRepository.save(post);
    return post;
  }

  async addComment(
    postId: number,
    userId: string,
    userName: string,
    userAvatar: string,
    text: string,
  ): Promise<any> {
    const post = await this.postRepository.findOneBy({ id: postId });
    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
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

  async incrementShareCount(postId: number): Promise<Post> {
    const post = await this.postRepository.findOneBy({ id: postId });
    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    post.shareCount = (post.shareCount || 0) + 1;
    return this.postRepository.save(post);
  }

  async update(postId: number, userId: number, text: string): Promise<Post> {
    const post = await this.postRepository.findOneBy({ id: postId });
    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }
    if (post.userId !== userId) {
      throw new UnauthorizedException('You can only edit your own posts');
    }
    post.text = text;
    await this.postRepository.save(post);
    const reloaded = await this.postRepository.findOneBy({ id: postId });
    if (!reloaded) {
      throw new NotFoundException('Could not reload updated post');
    }
    return reloaded;
  }

  async delete(postId: number, userId: number): Promise<void> {
    const post = await this.postRepository.findOneBy({ id: postId });
    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }
    if (post.userId !== userId) {
      throw new UnauthorizedException('You can only delete your own posts');
    }
    await this.postRepository.remove(post);
  }
}

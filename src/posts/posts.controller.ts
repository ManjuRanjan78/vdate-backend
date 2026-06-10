import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostsService } from './posts.service';
import { User } from '../users/users.entity';
import { Post as PostEntity } from './entities/post.entity';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private mapPostToResponse(post: PostEntity) {
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

  @Get()
  async getPosts() {
    const posts = await this.postsService.findAll();
    return posts.map((post) => this.mapPostToResponse(post));
  }

  @Post()
  async createPost(
    @Req() req: any,
    @Body() body: { text: string; imageUrl?: string },
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException();
    }

    const post = await this.postsService.create(
      Number(userId),
      body.text,
      body.imageUrl,
    );
    return this.mapPostToResponse(post);
  }

  @Post(':id/like')
  async likePost(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException();
    }

    const post = await this.postsService.toggleLike(Number(id), userId.toString());
    return this.mapPostToResponse(post);
  }

  @Post(':id/comment')
  async commentPost(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { text: string },
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException();
    }

    // Load the commenter profile details
    const user = await this.userRepository.findOneBy({ id: Number(userId) });
    const userName = user?.name || 'User';
    const userAvatar = user?.imageUrl || '';

    const comment = await this.postsService.addComment(
      Number(id),
      userId.toString(),
      userName,
      userAvatar,
      body.text,
    );
    return comment;
  }

  @Put(':id')
  async updatePost(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { text: string },
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException();
    }
    const post = await this.postsService.update(
      Number(id),
      Number(userId),
      body.text,
    );
    return this.mapPostToResponse(post);
  }

  @Delete(':id')
  async deletePost(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException();
    }
    await this.postsService.delete(Number(id), Number(userId));
    return { success: true };
  }
}

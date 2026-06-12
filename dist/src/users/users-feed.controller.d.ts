import { UsersService } from './users.service';
export declare class UsersFeedController {
    private usersService;
    constructor(usersService: UsersService);
    getFeed(req: any): Promise<{
        data: any[];
    }>;
    updateOnlineStatus(body: {
        isOnline: boolean;
    }, req: any): Promise<{
        success: boolean;
    }>;
    private transformUserResponse;
}

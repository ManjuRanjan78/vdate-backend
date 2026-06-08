import { UsersService } from './users.service';
export declare class UsersController {
    private usersService;
    private readonly logger;
    constructor(usersService: UsersService);
    getCurrentUser(req: any): Promise<any>;
    updateUser(body: any, req: any): Promise<any>;
    getFeed(): Promise<import("./users.entity").User[]>;
    getActiveLiveStreams(): Promise<any[]>;
    getRandomMatch(userId: string): Promise<any>;
    updateOnlineStatus(body: any, req: any): Promise<{
        statusCode: number;
        message: string;
        success?: undefined;
        isOnline?: undefined;
    } | {
        success: boolean;
        isOnline: any;
        statusCode?: undefined;
        message?: undefined;
    }>;
    getUser(id: string): Promise<any>;
    private transformUserResponse;
}

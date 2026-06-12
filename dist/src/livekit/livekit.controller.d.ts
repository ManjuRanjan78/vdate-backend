import { LivekitService } from './livekit.service';
export declare class LivekitController {
    private readonly livekitService;
    constructor(livekitService: LivekitService);
    generateToken(roomName: string, identity: string, userId: string, name?: string, image?: string, gender?: string): Promise<{
        success: boolean;
        token: string;
        url: string;
        roomName: string;
        identity: string;
        metadata: {
            name: string;
            image: string;
            gender: string;
        };
    }>;
}

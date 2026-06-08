import { CallsService } from './calls.service';
import { StartVideoCallDto } from './dto/start-video-call.dto';
import { EndVideoCallDto } from './dto/end-video-call.dto';
export declare class CallsController {
    private readonly callsService;
    constructor(callsService: CallsService);
    startVideoCall(body: StartVideoCallDto, req: any): Promise<{
        callId: any;
        status: string;
        message: string;
    }>;
    endVideoCall(body: EndVideoCallDto): Promise<{
        status: string;
    }>;
}

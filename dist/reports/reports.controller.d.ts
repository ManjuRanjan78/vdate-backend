import { ReportsService } from './reports.service';
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    getReports(): Promise<import("./entities/report.entity").Report[]>;
    createReport(req: any, body: {
        reportedUserId: number;
        targetId: string;
        targetType?: string;
        reason: string;
    }): Promise<import("./entities/report.entity").Report>;
    resolveReport(id: string): Promise<import("./entities/report.entity").Report>;
    rejectReport(id: string): Promise<import("./entities/report.entity").Report>;
}

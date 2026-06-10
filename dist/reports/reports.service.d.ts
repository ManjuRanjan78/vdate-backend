import { Repository } from 'typeorm';
import { Report } from './entities/report.entity';
export declare class ReportsService {
    private readonly reportRepository;
    constructor(reportRepository: Repository<Report>);
    findAll(): Promise<Report[]>;
    create(data: {
        reporterId: number;
        reportedUserId: number;
        targetId: string;
        targetType: string;
        reason: string;
    }): Promise<Report>;
    resolve(reportId: number): Promise<Report>;
    reject(reportId: number): Promise<Report>;
}

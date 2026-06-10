import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './entities/report.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
  ) {}

  async findAll(): Promise<Report[]> {
    return this.reportRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async create(data: {
    reporterId: number;
    reportedUserId: number;
    targetId: string;
    targetType: string;
    reason: string;
  }): Promise<Report> {
    const report = this.reportRepository.create({
      ...data,
      status: 'pending',
    });
    return this.reportRepository.save(report);
  }

  async resolve(reportId: number): Promise<Report> {
    const report = await this.reportRepository.findOneBy({ id: reportId });
    if (!report) {
      throw new NotFoundException(`Report ${reportId} not found`);
    }
    report.status = 'resolved';
    return this.reportRepository.save(report);
  }

  async reject(reportId: number): Promise<Report> {
    const report = await this.reportRepository.findOneBy({ id: reportId });
    if (!report) {
      throw new NotFoundException(`Report ${reportId} not found`);
    }
    report.status = 'rejected';
    return this.reportRepository.save(report);
  }
}

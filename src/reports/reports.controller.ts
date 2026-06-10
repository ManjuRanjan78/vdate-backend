import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  async getReports() {
    return this.reportsService.findAll();
  }

  @Post()
  async createReport(
    @Req() req: any,
    @Body()
    body: {
      reportedUserId: number;
      targetId: string;
      targetType?: string;
      reason: string;
    },
  ) {
    const reporterId = req.user?.userId;
    if (!reporterId) {
      throw new UnauthorizedException();
    }

    return this.reportsService.create({
      reporterId: Number(reporterId),
      reportedUserId: Number(body.reportedUserId),
      targetId: body.targetId,
      targetType: body.targetType || 'post',
      reason: body.reason,
    });
  }

  @Post(':id/resolve')
  async resolveReport(@Param('id') id: string) {
    return this.reportsService.resolve(Number(id));
  }

  @Post(':id/reject')
  async rejectReport(@Param('id') id: string) {
    return this.reportsService.reject(Number(id));
  }
}

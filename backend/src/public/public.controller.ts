import { Controller, Get } from '@nestjs/common';
import { PeriodsService } from '../periods/periods.service';

@Controller('public')
export class PublicController {
  constructor(private periodsService: PeriodsService) {}

  @Get('periods')
  findAll() {
    return this.periodsService.findAll();
  }

  @Get('periods/active')
  findActive() {
    return this.periodsService.findActive();
  }
}

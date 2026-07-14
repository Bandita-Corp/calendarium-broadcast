import { Controller, Get, Query } from '@nestjs/common';
import { PeriodsService } from '../periods/periods.service';
import { PresetsService } from '../presets/presets.service';

@Controller('public')
export class PublicController {
  constructor(
    private periodsService: PeriodsService,
    private presetsService: PresetsService,
  ) {}

  @Get('periods')
  findAll(@Query('presetId') presetId?: string) {
    return this.periodsService.findAll(presetId);
  }

  @Get('periods/active')
  findActive() {
    return this.periodsService.findActive();
  }

  @Get('presets')
  findAllPresets() {
    return this.presetsService.findAllPublic();
  }
}

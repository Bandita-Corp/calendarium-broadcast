import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { PresetsService } from './presets.service';
import { CreatePresetDto } from './dto/create-preset.dto';
import { UpdatePresetDto } from './dto/update-preset.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('presets')
@UseGuards(JwtAuthGuard)
export class PresetsController {
  constructor(private readonly presetsService: PresetsService) {}

  @Post()
  create(@Request() req: any, @Body() createPresetDto: CreatePresetDto) {
    return this.presetsService.create(req.user.userId, createPresetDto);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.presetsService.findAll(req.user.userId);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.presetsService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() updatePresetDto: UpdatePresetDto) {
    return this.presetsService.update(id, req.user.userId, updatePresetDto);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.presetsService.remove(id, req.user.userId);
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePresetDto } from './dto/create-preset.dto';
import { UpdatePresetDto } from './dto/update-preset.dto';

@Injectable()
export class PresetsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createPresetDto: CreatePresetDto) {
    return this.prisma.preset.create({
      data: {
        name: createPresetDto.name,
        userId,
      },
      include: { periods: true }
    });
  }

  async findAll(userId: string) {
    return this.prisma.preset.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { periods: true }
    });
  }

  async findOne(id: string, userId: string) {
    const preset = await this.prisma.preset.findFirst({
      where: { id, userId },
      include: { periods: true }
    });
    if (!preset) {
      throw new NotFoundException(`Preset with ID ${id} not found`);
    }
    return preset;
  }

  async update(id: string, userId: string, updatePresetDto: UpdatePresetDto) {
    await this.findOne(id, userId);
    return this.prisma.preset.update({
      where: { id },
      data: updatePresetDto,
      include: { periods: true }
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.preset.delete({
      where: { id },
    });
  }
}

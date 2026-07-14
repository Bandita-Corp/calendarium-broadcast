import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePeriodDto } from './dto/create-period.dto';
import { UpdatePeriodDto } from './dto/update-period.dto';

@Injectable()
export class PeriodsService {
  constructor(private prisma: PrismaService) {}

  async findAll(presetId?: string) {
    const where = presetId ? { presetId } : {};
    return this.prisma.period.findMany({
      where,
      orderBy: { startDate: 'asc' },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const period = await this.prisma.period.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });
    if (!period) {
      throw new NotFoundException(`Period ${id} not found`);
    }
    return period;
  }

  async create(dto: CreatePeriodDto, userId: string) {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);

    if (start >= end) {
      throw new BadRequestException('startDate must be before endDate');
    }

    return this.prisma.period.create({
      data: {
        name: dto.name,
        startDate: start,
        endDate: end,
        color: dto.color,
        userId,
        presetId: dto.presetId,
        noteType: dto.noteType,
        noteContent: dto.noteContent,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async update(id: string, dto: UpdatePeriodDto) {
    await this.findOne(id);

    const data: Record<string, unknown> = {};
    if (dto.name) data.name = dto.name;
    if (dto.color) data.color = dto.color;
    if (dto.startDate) data.startDate = new Date(dto.startDate);
    if (dto.endDate) data.endDate = new Date(dto.endDate);
    if (dto.presetId !== undefined) {
      data.presetId = dto.presetId === '' ? null : dto.presetId;
    }
    if (dto.noteType !== undefined) {
      data.noteType = dto.noteType === '' ? null : dto.noteType;
    }
    if (dto.noteContent !== undefined) {
      data.noteContent = dto.noteContent === '' ? null : dto.noteContent;
    }

    const updated = await this.prisma.period.update({
      where: { id },
      data,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return updated;
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.period.delete({ where: { id } });
    return { message: `Period ${id} deleted` };
  }

  async findActive() {
    const now = new Date();
    return this.prisma.period.findMany({
      where: {
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { startDate: 'asc' },
    });
  }
}

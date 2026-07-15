import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
      },
    });

    return this.omitSensitive(user);
  }

  async login(dto: LoginDto, res: Response) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id, user.email);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    this.setTokenCookies(res, tokens);

    return { user: this.omitSensitive(user), ...tokens };
  }

  async logout(userId: string, res: Response) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    return { message: 'Logged out successfully' };
  }

  async refresh(userId: string, userEmail: string, res: Response) {
    const tokens = await this.generateTokens(userId, userEmail);
    await this.updateRefreshToken(userId, tokens.refreshToken);
    this.setTokenCookies(res, tokens);
    return tokens;
  }

  private async generateTokens(userId: string, email: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email },
        {
          secret: process.env.JWT_SECRET,
          expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any,
        },
      ),
      this.jwtService.signAsync(
        { sub: userId, email },
        {
          secret: process.env.JWT_REFRESH_SECRET,
          expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any,
        },
      ),
    ]);
    return { accessToken, refreshToken };
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    const hashed = await bcrypt.hash(refreshToken, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashed },
    });
  }

  private setTokenCookies(
    res: Response,
    tokens: { accessToken: string; refreshToken: string },
  ) {
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('access_token', tokens.accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 min
    });
    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const data: Record<string, any> = {};

    if (dto.name !== undefined) {
      data.name = dto.name;
    }

    if (dto.email !== undefined) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existing && existing.id !== userId) {
        throw new ConflictException('Email already in use');
      }
      data.email = dto.email;
    }

    if (dto.password !== undefined && dto.password !== '') {
      data.password = await bcrypt.hash(dto.password, 12);
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    return this.omitSensitive(updated);
  }

  async getStats(userId: string) {
    const totalPresets = await this.prisma.preset.count({
      where: { userId },
    });

    const periods = await this.prisma.period.findMany({
      where: { userId },
      select: {
        startDate: true,
        endDate: true,
        noteType: true,
        hashtags: true,
      },
    });

    const totalLogged = periods.length;

    const typeDistribution = {
      Period: 0,
      Vibe: 0,
      Event: 0,
      Done: 0,
      Trend: 0,
    };
    const tagCounts: Record<string, number> = {};
    const activeDates = new Set<string>();

    for (const p of periods) {
      const type = (p.noteType || 'Period') as keyof typeof typeDistribution;
      if (typeDistribution[type] !== undefined) {
        typeDistribution[type]++;
      } else {
        typeDistribution['Period']++;
      }

      if (p.hashtags) {
        for (const tag of p.hashtags) {
          const t = tag.toLowerCase();
          tagCounts[t] = (tagCounts[t] || 0) + 1;
        }
      }

      const start = new Date(p.startDate);
      const end = p.endDate ? new Date(p.endDate) : start;
      const currentDate = new Date(start);
      let limit = 0;
      while (currentDate <= end && limit < 1000) {
        const yyyymmdd = currentDate.toISOString().split('T')[0];
        activeDates.add(yyyymmdd);
        currentDate.setDate(currentDate.getDate() + 1);
        limit++;
      }
    }

    const topTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    let currentStreak = 0;
    let maxStreak = 0;

    if (activeDates.size > 0) {
      const sortedDates = Array.from(activeDates).sort();
      let tempStreak = 0;
      let prevDate: Date | null = null;

      for (const dateStr of sortedDates) {
        const currDate = new Date(dateStr);
        if (!prevDate) {
          tempStreak = 1;
        } else {
          const diffTime = currDate.getTime() - prevDate.getTime();
          const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            tempStreak++;
          } else if (diffDays > 1) {
            if (tempStreak > maxStreak) {
              maxStreak = tempStreak;
            }
            tempStreak = 1;
          }
        }
        prevDate = currDate;
      }
      if (tempStreak > maxStreak) {
        maxStreak = tempStreak;
      }

      const todayStr = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (activeDates.has(todayStr) || activeDates.has(yesterdayStr)) {
        let checkDate = activeDates.has(todayStr) ? new Date() : yesterday;
        let running = true;
        while (running) {
          const checkStr = checkDate.toISOString().split('T')[0];
          if (activeDates.has(checkStr)) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            running = false;
          }
        }
      }
    }

    return {
      totalLogged,
      totalPresets,
      currentStreak,
      maxStreak,
      typeDistribution,
      topTags,
    };
  }

  private omitSensitive(user: User) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, refreshToken, ...safe } = user;
    return safe;
  }
}

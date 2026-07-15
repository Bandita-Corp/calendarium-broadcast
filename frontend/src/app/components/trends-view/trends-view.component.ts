import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Period, Preset } from '@/models';
import { TranslateModule } from '@ngx-translate/core';

interface StreakStats {
  tag: string;
  currentStreak: number;
  longestStreak: number;
  totalLogs: number;
  isActiveToday: boolean;
  isActiveYesterday: boolean;
  color: string;
  periods: Period[];
}

@Component({
  selector: 'app-trends-view',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './trends-view.component.html',
  styleUrls: ['./trends-view.component.css']
})
export class TrendsViewComponent implements OnChanges {
  @Input() periods: Period[] = [];
  @Input() presets: Preset[] = [];
  
  @Output() logStreak = new EventEmitter<string>();

  searchQuery = '';
  sortBy: 'currentStreak' | 'longestStreak' | 'totalLogs' | 'name' = 'currentStreak';
  selectedTagStats: StreakStats | null = null;
  streaks: StreakStats[] = [];

  // Top overall stats
  topStreakTag = '';
  topStreakVal = 0;
  totalActiveCount = 0;
  loggedTodayCount = 0;
  totalTagsCount = 0;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['periods']) {
      this.calculateAllStreaks();
    }
  }

  private formatDateToLocalYYYYMMDD(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  calculateAllStreaks() {
    const tagMap = new Map<string, { periods: Period[]; colors: string[] }>();
    
    // Group periods by lowercase hashtags
    this.periods.forEach(period => {
      if (period.hashtags && period.hashtags.length > 0) {
        period.hashtags.forEach(tag => {
          const lowerTag = tag.trim().toLowerCase();
          if (!lowerTag) return;
          if (!tagMap.has(lowerTag)) {
            tagMap.set(lowerTag, { periods: [], colors: [] });
          }
          const entry = tagMap.get(lowerTag)!;
          entry.periods.push(period);
          if (period.color) {
            entry.colors.push(period.color);
          }
        });
      }
    });

    const calculatedStreaks: StreakStats[] = [];
    const todayStr = this.formatDateToLocalYYYYMMDD(new Date());
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = this.formatDateToLocalYYYYMMDD(yesterday);

    this.loggedTodayCount = 0;

    tagMap.forEach((entry, lowerTag) => {
      // 1. Gather all active unique date strings (YYYY-MM-DD)
      const activeDates = new Set<string>();
      
      entry.periods.forEach(p => {
        const start = new Date(p.startDate);
        // Handle timezone/local issues by working with local parts
        const end = p.endDate ? new Date(p.endDate) : new Date(); // If ongoing, treat as active up to today
        
        // Loop from start day to end day (day by day)
        let currentDay = new Date(start);
        currentDay.setHours(0,0,0,0);
        const endDay = new Date(end);
        endDay.setHours(23,59,59,999);

        while (currentDay <= endDay) {
          activeDates.add(this.formatDateToLocalYYYYMMDD(currentDay));
          currentDay = this.addDays(currentDay, 1);
        }
      });

      const uniqueDatesArray = Array.from(activeDates).sort();

      // 2. Calculate Current Streak
      let currentStreak = 0;
      const isActiveToday = activeDates.has(todayStr);
      const isActiveYesterday = activeDates.has(yesterdayStr);

      if (isActiveToday) {
        this.loggedTodayCount++;
      }

      if (isActiveToday || isActiveYesterday) {
        // Start counting back from the most recent active day (today or yesterday)
        let checkDate = isActiveToday ? new Date() : yesterday;
        let streakActive = true;
        
        while (streakActive) {
          const checkDateStr = this.formatDateToLocalYYYYMMDD(checkDate);
          if (activeDates.has(checkDateStr)) {
            currentStreak++;
            checkDate = this.addDays(checkDate, -1);
          } else {
            streakActive = false;
          }
        }
      }

      // 3. Calculate Longest Streak
      let longestStreak = 0;
      if (uniqueDatesArray.length > 0) {
        let runningStreak = 1;
        longestStreak = 1;
        
        for (let i = 1; i < uniqueDatesArray.length; i++) {
          const prevDate = new Date(uniqueDatesArray[i - 1]);
          const currDate = new Date(uniqueDatesArray[i]);
          
          const diffTime = Math.abs(currDate.getTime() - prevDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            runningStreak++;
            longestStreak = Math.max(longestStreak, runningStreak);
          } else if (diffDays > 1) {
            runningStreak = 1;
          }
        }
      }

      // 4. Find most popular color
      let displayColor = '#54a0ff';
      if (entry.colors.length > 0) {
        // simple frequency map to get most common color
        const freq: { [key: string]: number } = {};
        entry.colors.forEach(c => freq[c] = (freq[c] || 0) + 1);
        let maxCount = 0;
        Object.keys(freq).forEach(c => {
          if (freq[c] > maxCount) {
            maxCount = freq[c];
            displayColor = c;
          }
        });
      }

      // Sort matching periods descending by start date
      const sortedPeriods = [...entry.periods].sort((a, b) => 
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      );

      // Extract proper title casing from original logs
      let displayTag = lowerTag;
      const matchingTag = entry.periods
        .flatMap(p => p.hashtags || [])
        .find(t => t.toLowerCase() === lowerTag);
      if (matchingTag) {
        displayTag = matchingTag;
      }

      calculatedStreaks.push({
        tag: displayTag,
        currentStreak,
        longestStreak,
        totalLogs: activeDates.size,
        isActiveToday,
        isActiveYesterday,
        color: displayColor,
        periods: sortedPeriods
      });
    });

    this.streaks = calculatedStreaks;
    this.totalTagsCount = calculatedStreaks.length;

    // Calculate Summary stats
    this.topStreakTag = '';
    this.topStreakVal = 0;
    this.totalActiveCount = 0;

    calculatedStreaks.forEach(s => {
      if (s.currentStreak > this.topStreakVal) {
        this.topStreakVal = s.currentStreak;
        this.topStreakTag = s.tag;
      }
      if (s.currentStreak > 0) {
        this.totalActiveCount++;
      }
    });

    // Re-apply sorting & selection
    this.sortStreaks();
    if (this.selectedTagStats) {
      const updated = this.streaks.find(s => s.tag.toLowerCase() === this.selectedTagStats!.tag.toLowerCase());
      this.selectedTagStats = updated || null;
    }
  }

  get filteredStreaks(): StreakStats[] {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) return this.streaks;
    return this.streaks.filter(s => s.tag.toLowerCase().includes(query));
  }

  sortStreaks() {
    this.streaks.sort((a, b) => {
      if (this.sortBy === 'currentStreak') {
        return b.currentStreak - a.currentStreak || b.longestStreak - a.longestStreak || a.tag.localeCompare(b.tag);
      } else if (this.sortBy === 'longestStreak') {
        return b.longestStreak - a.longestStreak || b.currentStreak - a.currentStreak || a.tag.localeCompare(b.tag);
      } else if (this.sortBy === 'totalLogs') {
        return b.totalLogs - a.totalLogs || b.currentStreak - a.currentStreak || a.tag.localeCompare(b.tag);
      } else {
        return a.tag.localeCompare(b.tag);
      }
    });
  }

  selectTag(streak: StreakStats) {
    this.selectedTagStats = streak;
  }

  getFolderForPeriod(period: Period): string {
    const preset = this.presets.find(p => p.id === period.presetId);
    return preset ? preset.name : 'Global';
  }

  onLogTodayClick(tag: string, event: MouseEvent) {
    event.stopPropagation();
    this.logStreak.emit(tag);
  }
}

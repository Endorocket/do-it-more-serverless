import { Frequency } from '../model/goal';
import { getDayOfYear, getWeek } from 'date-fns';

export class PeriodUtils {
  static getPeriodOfYear(frequency: Frequency, now: Date): number {
    let periodOfYear;
    switch (frequency) {
      case Frequency.DAILY:
        periodOfYear = getDayOfYear(now);
        break;
      case Frequency.WEEKLY:
        periodOfYear = getWeek(now);
        break;
      case Frequency.MONTHLY:
        periodOfYear = now.getMonth() + 1;
        break;
      default:
        throw new Error('Incorrect Frequency type');
    }
    return periodOfYear;
  }
}

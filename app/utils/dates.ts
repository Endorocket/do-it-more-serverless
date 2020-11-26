import { Frequency } from '../model/goal';
import * as DateUtils from 'date-fns';

export class DatesUtil {
  static getPeriodOfYear(frequency: Frequency, now: Date): number {
    let periodOfYear;
    switch (frequency) {
      case Frequency.DAILY:
        periodOfYear = DateUtils.getDayOfYear(now);
        break;
      case Frequency.WEEKLY:
        periodOfYear = DateUtils.getWeek(now);
        break;
      case Frequency.MONTHLY:
        periodOfYear = DateUtils.getMonth(now) + 1;
        break;
      default:
        throw new Error('Incorrect Frequency type');
    }
    return periodOfYear;
  }
}

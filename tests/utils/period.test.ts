import { PeriodUtils } from '../../app/utils/period';
import { Frequency } from '../../app/model/goal';

describe('getPeriodOfYear', () => {
  it('should return correct day period', () => {
    const currentDate = new Date(2020, 10, 2);
    expect(PeriodUtils.getPeriodOfYear(Frequency.DAILY, currentDate)).toBe(307);
  });

  it('should return correct week period', () => {
    const currentDate = new Date(2020, 10, 2);
    expect(PeriodUtils.getPeriodOfYear(Frequency.WEEKLY, currentDate)).toBe(45);
  });

  it('should return correct month period', () => {
    const currentDate = new Date(2020, 10, 2);
    expect(PeriodUtils.getPeriodOfYear(Frequency.MONTHLY, currentDate)).toBe(11);
  });
});

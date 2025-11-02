export interface VestingEventService {
    calculateVestedShares(filename: string, targetDate: Date): void;
}
const validEventTypes = ["VEST", "CANCEL"] as const;

export type VestingEventTypes = typeof validEventTypes[number];

export function isValidEventType(value: unknown): value is VestingEventTypes {
    return typeof value === "string" && validEventTypes.includes(value as VestingEventTypes);
}

export interface VestingEvent {
    event: VestingEventTypes;
    employeeId: string;
    employeeName: string;
    awardId: string;
    awardDate: Date;
    quantity: number;
}

export interface VestingEventProcessor {
    processVestingEvent(currentBalance: number, eventQuantity: number): number;
}

export class VestOperation implements VestingEventProcessor {
    processVestingEvent(currentBalance: number, eventQuantity: number): number {
        return currentBalance + eventQuantity;
    };
}

export class CancelOperation implements VestingEventProcessor {
    processVestingEvent(currentBalance: number, eventQuantity: number): number {
        if(currentBalance >= eventQuantity)
            return currentBalance - eventQuantity;

        return currentBalance;
    };
}
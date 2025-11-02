const validEventTypes = ["VEST"] as const;

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
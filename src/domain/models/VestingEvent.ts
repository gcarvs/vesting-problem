import { Employee } from "./Employee";
import { EquityAward } from "./EquityAward";

const validEventTypes = ["VEST"] as const;

export type VestingEventTypes = typeof validEventTypes[number];

export function isValidEventType(value: unknown): value is VestingEventTypes {
    return typeof value === "string" && validEventTypes.includes(value as VestingEventTypes);
}

export interface VestingEvent extends Employee, EquityAward{
    event: VestingEventTypes;
}

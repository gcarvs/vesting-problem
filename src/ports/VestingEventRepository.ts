import type { VestingEvent } from "../domain/models/VestingEvent"

export interface VestingEventRepository {
    getVestingEvents(): Promise<VestingEvent[]>;
}
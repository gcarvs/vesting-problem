import { VestingEvent } from "../domain/models/VestingEvent";

export interface VestingEventRepository {
    getVestingEventsHistory(): Promise<VestingEvent[]>;
}
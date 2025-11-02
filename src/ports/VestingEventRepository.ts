import { VestedShares } from "../domain/models/VestedShares";

export interface VestingEventRepository {
    getSharesVestedByTargetDate(targetDate: Date): Promise<VestedShares[]>;
}
import type { VestedShares } from "../domain/models/VestedShares"

export interface VestingEventAPIOutput {
    dispatchVestedShares(vestedShares: VestedShares[]): void;
}
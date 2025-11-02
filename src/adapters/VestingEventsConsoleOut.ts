import type { VestedShares } from "../domain/models/VestedShares";
import type { VestingEventAPIOutput } from "../ports/VestingEventAPIOutput";

export class VestingEventsConsoleOut implements VestingEventAPIOutput {
    dispatchVestedShares(vestedShares: VestedShares[]): void {
        vestedShares.forEach(vestedShare => {
            console.log(`${vestedShare.employeeId},${vestedShare.employeeName},${vestedShare.awardId},${vestedShare.awardedShares}`);
        });
    }
}
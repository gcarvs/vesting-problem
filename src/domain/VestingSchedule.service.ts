import { VestingEventAPIOutput } from "../ports/VestingEventAPIOutput";
import { VestingEventRepository } from "../ports/VestingEventRepository";

/**
 * Service to process Vesting Schedule operationg
 */
export class VestingScheduleService {
    private _repository: VestingEventRepository;
    private _vestingAPIOutput: VestingEventAPIOutput;

    constructor(vestingRepository: VestingEventRepository, vestingAPIOutput: VestingEventAPIOutput){
        this._repository = vestingRepository;
        this._vestingAPIOutput = vestingAPIOutput;
    }

    /**
     * Caculates the Vested Shares for every Employee + Award until a target date.
     * 
     * @param {Date} targetDate - The limit date for the Vesting Schedule calculation. 
     */
    async calculateVestedShares(targetDate: Date): Promise<void>{
        const result = await this._repository.getSharesVestedByTargetDate(targetDate);
        
        if(result && result.length > 0)
            this._vestingAPIOutput.dispatchVestedShares(result);
    }
}
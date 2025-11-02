import { BSTree, indexByEmployeeAndAward } from "../utils/BinarySearchTree";
import { VestingEventAPIOutput } from "../ports/VestingEventAPIOutput";
import { VestingEventRepository } from "../ports/VestingEventRepository";
import { VestedShares } from "./models/VestedShares";
import { getVestingEventProcessor, VestingEvent, VestingEventProcessor } from "./models/VestingEvent";

/**
 * Service to process Vesting Schedule operationg
 */
export class VestingScheduleService {
    private _repository: VestingEventRepository;
    private _vestingAPIOutput: VestingEventAPIOutput;
    vestedSharesCache: Map<string, VestedShares>;

    constructor(vestingRepository: VestingEventRepository, vestingAPIOutput: VestingEventAPIOutput){
        this._repository = vestingRepository;
        this._vestingAPIOutput = vestingAPIOutput;
        this.vestedSharesCache = new Map<string, VestedShares>();
    }

    /**
     * Caculates the Vested Shares for every Employee + Award until a target date.
     * 
     * @param {Date} targetDate - The limit date for the Vesting Schedule calculation. 
     */
    async calculateVestedShares(targetDate: Date): Promise<void>{
        const orderedEvents = await this._repository.getVestingEventsHistory();
        
        if(orderedEvents && orderedEvents.length > 0){
            const vestedShares: VestedShares[] = this.processVestingEvents(orderedEvents, targetDate);
            this._vestingAPIOutput.dispatchVestedShares(vestedShares);
        }   
    }

    /**
     * Computes the result of the Vesting Event to the Employee balance considering the target date and the Vesting Event Type (VEST or CANCEL)
     * 
     * @param {VestingEvent} vestingEvent - The vesting event being computed
     * @param {Date} targetDate - Only events that happened until this date will be considered
     * @returns {VestedShares} - The vested shares for that Employee + Award after the event
     */
    computeVestedShares(vestingEvent: VestingEvent, targetDate: Date): VestedShares {
        const vestedShareKey: string = vestingEvent.employeeId + vestingEvent.awardId;
        const eventProcessor: VestingEventProcessor = getVestingEventProcessor(vestingEvent.event);

        // Computes how many shares should be awarded by this event
        const vestedSharesToDate: number = vestingEvent.awardDate <= targetDate ? vestingEvent.quantity : 0;
        const savedVestedShare: VestedShares = this.vestedSharesCache.get(vestedShareKey);

        // If we already have computed vested shares for this Employee + Award
        if(savedVestedShare){
            savedVestedShare.awardedShares = eventProcessor.processVestingEvent(savedVestedShare.awardedShares, vestedSharesToDate);
            return savedVestedShare;
        }
        
        const newVestedShare: VestedShares = {
            employeeId: vestingEvent.employeeId,
            employeeName: vestingEvent.employeeName,
            awardId: vestingEvent.awardId,
            awardedShares: eventProcessor.processVestingEvent(0, vestedSharesToDate)
        }
        
        this.vestedSharesCache.set(vestedShareKey, newVestedShare);
        return newVestedShare;
    }

    /**
     * Process an ordered list of Vesting Events into summary VestedShares.
     * 
     * It also uses a BST to ensure keep the result already in order.
     * 
     * @param {VestingEvent} orderedEvents - An ordered list of events by Date and Event Type
     * @param {Date} targetDate - The target date to calculate the events
     * @returns {VestedShares[]} - The summarized list of VestedShares until the Target Date
     */
    processVestingEvents(orderedEvents: VestingEvent[], targetDate: Date): VestedShares[]{
        const vestedSharesTree: BSTree<VestedShares> = new BSTree<VestedShares>(indexByEmployeeAndAward);

        orderedEvents.forEach(event => {
            vestedSharesTree.insert(this.computeVestedShares(event, targetDate));
        });

        return vestedSharesTree.traverse();
    }
}
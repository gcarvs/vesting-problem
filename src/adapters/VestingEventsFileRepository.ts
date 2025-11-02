import { CancelOperation, getVestingEventProcessor, isValidEventType, VestingEventProcessor, VestingEventTypes, VestOperation, type VestingEvent } from "../domain/models/VestingEvent";
import type { VestingEventRepository } from "../ports/VestingEventRepository";

import { readFile } from 'node:fs/promises';
import { indexByEmployeeAndAward, BSTree, indexByDateAndEvent } from "./helpers/VestingEventsTree";
import { VestedShares } from "../domain/models/VestedShares";

/**
 * Repository used to consume VestingEvent data from a CSV file.
 */
export class VestingEventsFileRepository implements VestingEventRepository {
    fileName: string;
    vestedSharesCache: Map<string, VestedShares>;
    
    constructor(fileName: string){
        this.fileName = fileName;
        this.vestedSharesCache = new Map<string, VestedShares>();
    }

    /**
     * Retrieves a history of Vesting Events from the CSV file.
     * 
     * @returns {Promise<VestingEvent[]>} - A list of Vesting Events read from a CSV file
     */
    async getSharesVestedByTargetDate(targetDate: Date): Promise<VestedShares[]> {
        try {
            const fileContent = await readFile(this.fileName, { encoding: 'utf8' });

            const vestingEventsList = this.processVestingEventsFile(fileContent, targetDate);

            return vestingEventsList;
        } catch (err) {
            console.error(`Error reading Vesting Events History file: `, err);
            return [];
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
     * Break down the file content into rows and process each one as a VestingEvent.
     * 
     * Any invalid rows are dropped and the process continues.
     * 
     * Returns the list ordered by date.
     * 
     * @param {string} csvFileContent - The raw content from the Vesting Events CSV file
     * @returns {VestingEvent[]} - The formatted list of Vesting Events
     */
    processVestingEventsFile(csvFileContent: string, targetDate: Date): VestedShares[]{
        const csvRows = csvFileContent.split("\n");
        
        // Indexing the file by Date and Event will make sure to process VEST before CANCEL
        const vestedSharesTree: BSTree<VestingEvent> = new BSTree<VestingEvent>(indexByDateAndEvent);
        
        csvRows.map(row => {
            const currentRow = row.split(",");

            try{
                const vestingEvent: VestingEvent = this.converCsvRowToVestingEvent(currentRow);
                vestedSharesTree.insert(vestingEvent);
            }
            catch(error){
                console.log(`Row dropped from Vesting Events History: ${error}`);
            }
        });

        const orderedEvents: VestingEvent[] = vestedSharesTree.traverse();
        return this.processVestingEvents(orderedEvents, targetDate);
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

    /**
     * Converts a list of values read from a CSV row into a valided VestingEvent.
     * 
     * @param {string[]} csvColumns - A list of string values for each column of the CSV file
     * @returns {VestingEvent} - A validated VestingEvent object with the provided row's data
     * 
     * @throws {Error} If the event type is not on the list of valid events
     * @throws {Error} If the quantity column is not a number
     * @throws {Error} If the event date is not a valid date
     */
    converCsvRowToVestingEvent(csvColumns: string[]): VestingEvent{
        const [event, employeeId, employeeName, awardId, dateStr, quantityStr] = csvColumns;
        
        const eventDate: Date = new Date(dateStr);
        const awardedShares: number = parseInt(quantityStr);

        if(!isValidEventType(event))
            throw new Error("Error parsing CSV file: the event type should be always 'VEST'");

        if(isNaN(awardedShares)){
            throw new Error("Error parsing CSV file: the value for the property 'Quantity' should be a number");
        }

        if(eventDate.toString() === "Invalid Date")
            throw new Error("Error parsing CSV file: the value for the property 'Date' should be a date formatted as YYYY-MM-DD");

        return {
            event: event,
            employeeId: employeeId,
            employeeName: employeeName,
            awardId: awardId,
            awardDate: eventDate,
            quantity: awardedShares
        };
    }
}
import { isValidEventType, type VestingEvent } from "../domain/models/VestingEvent";
import type { VestingEventRepository } from "../ports/VestingEventRepository";

import { readFile } from 'node:fs/promises';
import { indexByEventDate, VestingEventsTree } from "./helpers/VestingEventsTree";

/**
 * Repository used to consume VestingEvent data from a CSV file.
 */
export class VestingEventsFileRepository implements VestingEventRepository {
    fileName: string;
    vestingEventsTree: VestingEventsTree;
    
    constructor(fileName: string){
        this.fileName = fileName;
    }

    /**
     * Retrieves a history of Vesting Events from the CSV file.
     * 
     * @returns {Promise<VestingEvent[]>} - A list of Vesting Events read from a CSV file
     */
    async getVestingEvents(): Promise<VestingEvent[]> {
        try {
            const fileContent = await readFile(this.fileName, { encoding: 'utf8' });
            return this.processVestingEventsFile(fileContent);
        } catch (err) {
            console.error(`Error reading Vesting Events History file: `, err);
            return [];
        }
    }

    /**
     * Break down the file content into rows and process each one as a VestingEvent.
     * 
     * Any invalid rows are dropped and the process continues.
     * 
     * @param {string} csvFileContent - The raw content from the Vesting Events CSV file
     * @returns {VestingEvent[]} - The formatted list of Vesting Events
     */
    processVestingEventsFile(csvFileContent: string): VestingEvent[]{
        let csvRows = csvFileContent.split("\n");
        this.vestingEventsTree = new VestingEventsTree(indexByEventDate);
        
        csvRows.map(row => {
            let currentRow = row.split(",");

            try{
                this.vestingEventsTree.insert(this.converCsvRowToVestingEvent(currentRow));
            }
            catch(error){
                console.log(`Row dropped from Vesting Events History: ${error}`);
            }
        });
        
        return this.vestingEventsTree.traverse();
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
        let [event, employeeId, employeeName, awardId, dateStr, quantityStr] = csvColumns;
        
        let eventDate: Date = new Date(dateStr);
        let awardedShares: number = parseInt(quantityStr);

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
            awardedShares: awardedShares
        };
    }
}
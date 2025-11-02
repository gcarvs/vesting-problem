import { isValidEventType, type VestingEvent } from "../domain/models/VestingEvent";
import type { VestingEventRepository } from "../ports/VestingEventRepository";

import { readFile } from 'node:fs/promises';
import { BSTree, indexByDateAndEvent } from "../utils/BinarySearchTree";

/**
 * Repository used to consume VestingEvent data from a CSV file.
 */
export class VestingEventsFileRepository implements VestingEventRepository {
    fileName: string;
    
    constructor(fileName: string){
        this.fileName = fileName;
    }

    /**
     * Retrieves a history of Vesting Events from the CSV file.
     * 
     * @returns {Promise<VestingEvent[]>} - A list of Vesting Events read from a CSV file
     */
    async getVestingEventsHistory(): Promise<VestingEvent[]> {
        try {
            const fileContent = await readFile(this.fileName, { encoding: 'utf8' });

            const vestingEventsList = this.processVestingEventsFile(fileContent);

            return vestingEventsList;
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
     * Returns the list ordered by date.
     * 
     * @param {string} csvFileContent - The raw content from the Vesting Events CSV file
     * @returns {VestingEvent[]} - The formatted list of Vesting Events
     */
    processVestingEventsFile(csvFileContent: string): VestingEvent[]{
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
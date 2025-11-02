import { VestingEventsConsoleOut } from "./src/adapters/VestingEventsConsoleOut";
import { VestingEventsFileRepository } from "./src/adapters/VestingEventsFileRepository";
import { VestingScheduleService } from "./src/domain/VestingSchedule.service";
import { validateFileName, validateTargetDate } from "./src/utils/ApiValidation";

/**
 * Main function that instanciates the Service and trigger Vesting Schedule processing.
 * 
 * @param {string} fileName - The file name where to read the Vesting Schedule data
 * @param {Date} targetDate - The target date for the Vesting Schedule calculation
 */
async function processRequest(fileName: string, targetDate: Date){
    const service = new VestingScheduleService(
        new VestingEventsFileRepository(fileName), 
        new VestingEventsConsoleOut()
    );

    await service.calculateVestedShares(new Date(targetDate));
}

/**
 * Reads the two positional arguments from the Command Line and validate them.
 * 
 * @returns { fileName: string, targetDate: Date } - Arguments to be used on Vesting Schedule Service
 */
function getCommandArguments(): { fileName: string, targetDate: Date }{
    const FILE_NAME_ARG_POSITION = 0;
    const TARGET_DATE_ARG_POSITION = 1;

    const args = process.argv.slice(2); // slice 2 to ignore the node commands
    const fileName: string = args[FILE_NAME_ARG_POSITION];
    const targetDateString: string = args[TARGET_DATE_ARG_POSITION];

    if(!validateFileName(fileName))
        throw new Error(`Input Validation Error: ${fileName} is not a valid filename or contains forbidden extension.`);

    if(!validateTargetDate(targetDateString))
        throw new Error(`Input Validation Error: ${targetDateString} is not a valid date or does not follow YYYY-MM-DD format.`);

    return { fileName, targetDate: new Date(targetDateString) }
}

try{
    const { fileName, targetDate } = getCommandArguments();
    processRequest(fileName, targetDate);
}
catch(error){
    console.log(error);
}

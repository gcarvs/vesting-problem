import * as path from "path";

/**
 * Tests if a provided string is a valid file name as contains only allowed extensions.
 * 
 * @param {string} fileName - The string to be tested
 * @returns {boolean} - True if the string is a valid filename or false if not
 */
export function validateFileName(fileName: string): boolean {
    // forbidden characters \ / : * ? " < > |
    const rgxForbiddenChars: RegExp = /^[^\\/:\*\?"<>\|]+$/; //eslint-disable-line
    const allowedExtensions = ['.csv'];

    if(!rgxForbiddenChars.test(fileName)) return false;

    const fileExtension = path.extname(fileName).toLowerCase(); // Get extension and convert to lowercase 
    if(!allowedExtensions.includes(fileExtension)) return false;
    return true;
}

/**
 * Tests if a possible date string follows the format YYYY-MM-DD
 * @param {string} dateString - The string to b tested
 * @returns {boolean} - True if the string is a valid date or false if not
 */
export function validateTargetDate(dateString: string): boolean {
    const dateFormatRegex: RegExp = /^\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$/;
    return dateFormatRegex.test(dateString);
}
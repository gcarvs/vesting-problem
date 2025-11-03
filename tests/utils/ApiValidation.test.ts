import { validateFileName, validateTargetDate } from "../../src/utils/ApiValidation";

describe("test API Validations", () => {
    describe("test validateFileName function", () => {
        test("test multiple scenarios", () => {
            const invalidString1: string = "invalid/filename.csv";
            const invalidString2: string = "invalid*file.csv";
            const invalidString3: string = "invalid\"file.csv";
            const invalidString4: string = "my_valid_filename.pdf";

            const validString:string = "my_valid_filename.csv";

            expect(validateFileName(invalidString1)).toBeFalsy();
            expect(validateFileName(invalidString2)).toBeFalsy();
            expect(validateFileName(invalidString3)).toBeFalsy();
            expect(validateFileName(invalidString4)).toBeFalsy();

            expect(validateFileName(validString)).toBeTruthy();
        });
    });

    describe("test validateTargetDate", () => {
        test("test multiple scenarios", () => {
            const invalidString1: string = "10-06-2025";
            const invalidString2: string = "10/06/2025";
            const invalidString3: string = "2025/06/10";
            const invalidString4: string = "June 10th, 2025";
            const invalidString5: string = "Not a Date";

            const validString:string = "2025-06-10";

            expect(validateTargetDate(invalidString1)).toBeFalsy();
            expect(validateTargetDate(invalidString2)).toBeFalsy();
            expect(validateTargetDate(invalidString3)).toBeFalsy();
            expect(validateTargetDate(invalidString4)).toBeFalsy();
            expect(validateTargetDate(invalidString5)).toBeFalsy();

            expect(validateTargetDate(validString)).toBeTruthy();
        }); 
    });
});
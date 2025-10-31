import { VestingEventsFileRepository } from "../../src/adapters/VestingEventsFileRepository";
import { VestingEvent } from "../../src/domain/models/VestingEvent";
import * as VestingEventModel from "../../src/domain/models//VestingEvent";

import fs from 'node:fs/promises';

'node:fs/promises'

describe("Test VestingEventsFileRepository", () => {
    describe("test converCsvRowToVestingEvent function", () => {
        const spyIsValidEventType = jest.spyOn(VestingEventModel, "isValidEventType");

        beforeAll(() => {    
            spyIsValidEventType.mockReturnValue(true);
        });

        beforeEach(() => {
            spyIsValidEventType.mockClear();
        });

        test("test for a valid row", () => {
            const repository: VestingEventsFileRepository = new VestingEventsFileRepository("test_file.csv");
            const mockedRow: string[] = ["VEST","E001","Alice Smith","ISO-001","2020-01-01","1000"];
            const expectedResult: VestingEvent = {
                event: "VEST",
                employeeId: "E001",
                employeeName: "Alice Smith",
                awardId: "ISO-001",
                awardDate: new Date("2020-01-01"),
                awardedShares: 1000
            }

            let result = repository.converCsvRowToVestingEvent(mockedRow);
            
            expect(spyIsValidEventType).toHaveBeenCalledWith("VEST");
            expect(result).toMatchObject(expectedResult);
        });

        test("test for invalid event type", () => {
            spyIsValidEventType.mockReturnValueOnce(false);

            const repository: VestingEventsFileRepository = new VestingEventsFileRepository("test_file.csv");
            const mockedRow: string[] = ["INVALID","E001","Alice Smith","ISO-001","2020-01-01","1000"];
            
            expect(
                () => { repository.converCsvRowToVestingEvent(mockedRow) }
            ).toThrow("Error parsing CSV file: the event type should be always 'VEST'");
        });

        test("test for invalid quantity of awardedShares", () => {
            const repository: VestingEventsFileRepository = new VestingEventsFileRepository("test_file.csv");
            const mockedRow: string[] = ["VEST","E001","Alice Smith","ISO-001","2020-01-01","INVALID"];
            
            expect(
                () => { repository.converCsvRowToVestingEvent(mockedRow) }
            ).toThrow("Error parsing CSV file: the value for the property 'Quantity' should be a number");
        });

        test("test for invalid award date", () => {
            const repository: VestingEventsFileRepository = new VestingEventsFileRepository("test_file.csv");
            const mockedRow: string[] = ["VEST","E001","Alice Smith","ISO-001","INVALID","1000"];
            
            expect(
                () => { repository.converCsvRowToVestingEvent(mockedRow) }
            ).toThrow("Error parsing CSV file: the value for the property 'Date' should be a date formatted as YYYY-MM-DD");
        });
    });

    describe("test processVestingEventsFile", () => {
        test("test for all valid rows", () => {
            const mockVestingEventsFileRows = ["VEST,E001,Alice Smith,ISO-001,2020-01-01,1000", "VEST,E001,Alice Smith,ISO-001,2021-01-01,1000"];
            const mockVestingEventsFile: string = mockVestingEventsFileRows.join("\n");
            const expectedResult: VestingEvent[] = [
                {
                    event: "VEST",
                    employeeId: "E001",
                    employeeName: "Alice Smith",
                    awardId: "ISO-001",
                    awardDate: new Date("2020-01-01"),
                    awardedShares: 1000
                },
                {
                    event: "VEST",
                    employeeId: "E001",
                    employeeName: "Alice Smith",
                    awardId: "ISO-001",
                    awardDate: new Date("2021-01-01"),
                    awardedShares: 1000
                }
            ];

            const repository: VestingEventsFileRepository = new VestingEventsFileRepository("test_file.csv");
            const spyConverCsvRow = jest.spyOn(repository, "converCsvRowToVestingEvent");

            expectedResult.forEach(resultItem => spyConverCsvRow.mockReturnValueOnce(resultItem));

            let result = repository.processVestingEventsFile(mockVestingEventsFile);

            expect(spyConverCsvRow).toHaveBeenCalledTimes(expectedResult.length);
            expect(result).toMatchObject(expectedResult);
        });

        test("test for some invalid rows", () => {
            const mockVestingEventsFileRows = ["INVALID,E001,Alice Smith,ISO-001,2020-01-01,1000", "VEST,E001,Alice Smith,ISO-001,2021-01-01,1000"];
            const mockVestingEventsFile: string = mockVestingEventsFileRows.join("\n");
            const expectedResult: VestingEvent[] = [
                {
                    event: "VEST",
                    employeeId: "E001",
                    employeeName: "Alice Smith",
                    awardId: "ISO-001",
                    awardDate: new Date("2021-01-01"),
                    awardedShares: 1000
                }
            ];

            const repository: VestingEventsFileRepository = new VestingEventsFileRepository("test_file.csv");
            const spyConverCsvRow = jest.spyOn(repository, "converCsvRowToVestingEvent");

            spyConverCsvRow.mockImplementationOnce(() => { throw new Error("Error processing file!") });
            spyConverCsvRow.mockReturnValueOnce(expectedResult[0]);

            let result = repository.processVestingEventsFile(mockVestingEventsFile);

            expect(spyConverCsvRow).toHaveBeenCalledTimes(mockVestingEventsFileRows.length);
            expect(result).toMatchObject(expectedResult);
        });
    });

    describe("test getVestingEvents", () => {
        const repository: VestingEventsFileRepository = new VestingEventsFileRepository("test_file.csv");
        const spyProcessFile = jest.spyOn(repository, "processVestingEventsFile");

        const spyFs = jest.spyOn(fs, "readFile");

        beforeEach(() => {
            spyFs.mockClear();
            spyProcessFile.mockClear();
        });

        test("test for a valid file name", async () => {
            const fileContent: string = "My Test File Content";
            const expectedResult: VestingEvent[] = [
                {
                    event: "VEST",
                    employeeId: "E001",
                    employeeName: "Alice Smith",
                    awardId: "ISO-001",
                    awardDate: new Date("2020-01-01"),
                    awardedShares: 1000
                }
            ];

            spyFs.mockResolvedValueOnce(fileContent);
            spyProcessFile.mockReturnValueOnce(expectedResult);

            const result = await repository.getVestingEvents();
            expect(result).toMatchObject(expectedResult);
        });

        test("test for a invalid file name", async () => {
            const expectedResult: VestingEvent[] = [
                {
                    event: "VEST",
                    employeeId: "E001",
                    employeeName: "Alice Smith",
                    awardId: "ISO-001",
                    awardDate: new Date("2020-01-01"),
                    awardedShares: 1000
                }
            ];

            spyFs.mockImplementationOnce(() => { throw new Error("Error opening file!") });

            const result = await repository.getVestingEvents();
            expect(result).toMatchObject([]);
        });
    });
});
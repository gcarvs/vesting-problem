import { VestingEventsFileRepository } from "../../src/adapters/VestingEventsFileRepository";
import { VestingEvent } from "../../src/domain/models/VestingEvent";
import * as VestingEventModel from "../../src/domain/models//VestingEvent";

import fs from 'node:fs/promises';
import { VestedShares } from "../../src/domain/models/VestedShares";

describe("Test VestingEventsFileRepository", () => {
    const mockVestingEvents: VestingEvent[] = [
        {
            event: "VEST",
            employeeId: "E001",
            employeeName: "Alice Smith",
            awardId: "ISO-001",
            awardDate: new Date("2020-01-01"),
            quantity: 1000
        },
        {
            event: "VEST",
            employeeId: "E001",
            employeeName: "Alice Smith",
            awardId: "ISO-001",
            awardDate: new Date("2021-01-01"),
            quantity: 1000
        }
    ];

    const mockVestedShares: VestedShares[] = [
        {
            employeeId: "E001",
            employeeName: "Alice Smith",
            awardId: "ISO-001",
            awardedShares: 1000
        },
        {
            employeeId: "E001",
            employeeName: "Alice Smith",
            awardId: "ISO-001",
            awardedShares: 2000
        }
    ];

    const mockTargetDate: Date = new Date("2025-11-02");

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
                quantity: 1000
            };

            const result = repository.converCsvRowToVestingEvent(mockedRow);
            
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

    describe("Test computeVestedShares function", () => {
        const repository: VestingEventsFileRepository = new VestingEventsFileRepository("test_file.csv");
        const mockEvent: VestingEvent = {
            event: "VEST",
            employeeId: "E001",
            employeeName: "Alice Smith",
            awardId: "ISO-001",
            awardDate: new Date("2021-01-01"),
            quantity: 1000
        };
        const mockCacheKey: string = mockEvent.employeeId + mockEvent.awardId;
        const spyMapGet = jest.spyOn(repository.vestedSharesCache, "get");
        const spyMapSet = jest.spyOn(repository.vestedSharesCache, "set");

        beforeEach(() => {
            spyMapGet.mockClear();
            spyMapSet.mockClear();
        });
        test("test for cache hit", () => {
            const mockVestedShares: VestedShares = {
                employeeId: "E001",
                employeeName: "Alice Smith",
                awardId: "ISO-001",
                awardedShares: 2000
            };
            spyMapGet.mockReturnValueOnce(mockVestedShares);

            const result = repository.computeVestedShares(mockEvent, mockTargetDate);
            expect(spyMapGet).toHaveBeenCalledWith(mockCacheKey);
            expect(spyMapSet).not.toHaveBeenCalled();
            expect(result).toMatchObject(mockVestedShares);
        });

        test("test for cache miss", () => {
            const mockVestedShares: VestedShares = {
                employeeId: "E001",
                employeeName: "Alice Smith",
                awardId: "ISO-001",
                awardedShares: 1000
            };
            spyMapGet.mockReturnValueOnce(null);

            const result = repository.computeVestedShares(mockEvent, mockTargetDate);
            expect(spyMapGet).toHaveBeenCalledWith(mockCacheKey);
            expect(spyMapSet).toHaveBeenCalledWith(mockCacheKey, mockVestedShares);
            expect(result).toMatchObject(mockVestedShares);
        });

        test("test for event past targetDate", () => {
            const mockVestedShares: VestedShares = {
                employeeId: "E001",
                employeeName: "Alice Smith",
                awardId: "ISO-001",
                awardedShares: 0
            };

            spyMapGet.mockReturnValueOnce(null);

            const result = repository.computeVestedShares(mockEvent, new Date("2019-12-01"));
            expect(spyMapGet).toHaveBeenCalledWith(mockCacheKey);
            expect(spyMapSet).toHaveBeenCalledWith(mockCacheKey, mockVestedShares);
            expect(result).toMatchObject(mockVestedShares);
        });
    });

    describe("test processVestingEventsFile function", () => {
        const repository: VestingEventsFileRepository = new VestingEventsFileRepository("test_file.csv");
        const spyConvertCsvRow = jest.spyOn(repository, "converCsvRowToVestingEvent");
        const spyProcessVestingEvents = jest.spyOn(repository, "processVestingEvents");

        beforeEach(() => {
            spyConvertCsvRow.mockClear();
            spyProcessVestingEvents.mockClear();
        });

        test("test for all valid rows", () => {
            const mockVestingEventsFileRows = ["VEST,E001,Alice Smith,ISO-001,2020-01-01,1000", "VEST,E001,Alice Smith,ISO-001,2021-01-01,1000"];
            const mockVestingEventsFile: string = mockVestingEventsFileRows.join("\n");
            
            mockVestingEvents.forEach(resultItem => spyConvertCsvRow.mockReturnValueOnce(resultItem));
            spyProcessVestingEvents.mockReturnValueOnce(mockVestedShares);

            const result = repository.processVestingEventsFile(mockVestingEventsFile, mockTargetDate);

            expect(spyConvertCsvRow).toHaveBeenCalledTimes(mockVestingEventsFileRows.length);
            expect(spyProcessVestingEvents).toHaveBeenCalledWith(mockVestingEvents, mockTargetDate);
            expect(result).toMatchObject(mockVestedShares);
        });

        test("test for some invalid rows", () => {
            const mockVestingEventsFileRows = ["INVALID,E001,Alice Smith,ISO-001,2020-01-01,1000", "VEST,E001,Alice Smith,ISO-001,2021-01-01,1000"];
            const mockVestingEventsFile: string = mockVestingEventsFileRows.join("\n");

            const computedShares: VestedShares[] = [
                {
                    employeeId: "E001",
                    employeeName: "Alice Smith",
                    awardId: "ISO-001",
                    awardedShares: 1000
                }
            ];

            spyConvertCsvRow.mockImplementationOnce(() => { throw new Error("Error processing file!") });
            spyConvertCsvRow.mockReturnValueOnce(mockVestingEvents[1]); // Only the second event should be expected in this case.
            spyProcessVestingEvents.mockReturnValueOnce([computedShares[0]]);

            const result = repository.processVestingEventsFile(mockVestingEventsFile, mockTargetDate);

            expect(spyConvertCsvRow).toHaveBeenCalledTimes(mockVestingEventsFileRows.length);
            expect(spyProcessVestingEvents).toHaveBeenCalledWith([mockVestingEvents[1]], mockTargetDate);
            expect(result).toMatchObject(computedShares);
        });
    });

    describe("test processVestingEvents function", () => {
        test("test for success case", () => {
            const repository: VestingEventsFileRepository = new VestingEventsFileRepository("test_file.csv");
            const spyComputeVestedShares = jest.spyOn(repository, "computeVestedShares");

            mockVestingEvents.forEach((event, index) => spyComputeVestedShares.mockReturnValueOnce(mockVestedShares[index]));

            const result = repository.processVestingEvents(mockVestingEvents, mockTargetDate);
            expect(spyComputeVestedShares).toHaveBeenCalledTimes(mockVestingEvents.length);
            expect(result).toMatchObject([mockVestedShares[1]]);
        });
    });

    describe("test getSharesVestedByTargetDate function", () => {
        const repository: VestingEventsFileRepository = new VestingEventsFileRepository("test_file.csv");
        const spyProcessFile = jest.spyOn(repository, "processVestingEventsFile");
        const mockTargetDate: Date = new Date("2025-11-02");

        const spyFs = jest.spyOn(fs, "readFile");

        beforeEach(() => {
            spyFs.mockClear();
            spyProcessFile.mockClear();
        });

        test("test for a valid file name", async () => {
            const fileContent: string = "My Test File Content";
            spyFs.mockResolvedValueOnce(fileContent);
            spyProcessFile.mockReturnValueOnce(mockVestedShares);

            const result = await repository.getSharesVestedByTargetDate(mockTargetDate);
            expect(spyProcessFile).toHaveBeenCalledWith(fileContent, mockTargetDate);
            expect(result).toMatchObject(mockVestedShares);
        });

        test("test for a invalid file name", async () => {
            spyFs.mockImplementationOnce(() => { throw new Error("Error opening file!") });

            const result = await repository.getSharesVestedByTargetDate(mockTargetDate);
            expect(spyProcessFile).not.toHaveBeenCalled();
            expect(result).toMatchObject([]);
        });
    });
});
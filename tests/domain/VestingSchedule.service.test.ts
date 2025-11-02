import { VestingEventsConsoleOut } from "../../src/adapters/VestingEventsConsoleOut";
import { VestingEventsFileRepository } from "../../src/adapters/VestingEventsFileRepository";
import { VestedShares } from "../../src/domain/models/VestedShares";
import { VestingEvent } from "../../src/domain/models/VestingEvent";
import { VestingScheduleService } from "../../src/domain/VestingSchedule.service";

describe("test VestingScheduleService", () => {
    const mockRepository = new VestingEventsFileRepository("test_file.csv");
    const mockOutput = new VestingEventsConsoleOut();
    const mockTargetDate = new Date("2025-11-02");

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

    describe("test calculateVestedShares function", () => {
        const expectedResult: VestedShares[] = [
            {
                employeeId: "EMPLOYEE_01",
                employeeName: "EMPLOYEE",
                awardId: "AWARD_01",
                awardedShares: 10
            }
        ];

        const spyGetVestingEvents = jest.spyOn(mockRepository, "getVestingEventsHistory");
        const spyDispatch = jest.spyOn(mockOutput, "dispatchVestedShares");

        beforeEach(() => {
            spyGetVestingEvents.mockClear();
            spyDispatch.mockClear();
        });
        test("test for success case", async () => {
            spyGetVestingEvents.mockResolvedValueOnce(mockVestingEvents);

            const service = new VestingScheduleService(mockRepository, mockOutput);
            const spyProcessVestingEvents = jest.spyOn(service, "processVestingEvents");
            spyProcessVestingEvents.mockReturnValueOnce(expectedResult);

            await service.calculateVestedShares(mockTargetDate);

            expect(spyGetVestingEvents).toHaveBeenCalledWith();
            expect(spyDispatch).toHaveBeenCalledWith(expectedResult);
        });
        test("test for empty result", async () => {
            spyGetVestingEvents.mockResolvedValueOnce([]);

            const service = new VestingScheduleService(mockRepository, mockOutput);
            const spyProcessVestingEvents = jest.spyOn(service, "processVestingEvents");

            await service.calculateVestedShares(mockTargetDate);
            
            expect(spyGetVestingEvents).toHaveBeenCalledWith();
            expect(spyProcessVestingEvents).not.toHaveBeenCalled();
            expect(spyDispatch).not.toHaveBeenCalled();
        });
    });

    describe("Test computeVestedShares function", () => {
        const service: VestingScheduleService = new VestingScheduleService(mockRepository, mockOutput);
        
        const mockEvent: VestingEvent = {
            event: "VEST",
            employeeId: "E001",
            employeeName: "Alice Smith",
            awardId: "ISO-001",
            awardDate: new Date("2021-01-01"),
            quantity: 1000
        };
        const mockCacheKey: string = mockEvent.employeeId + mockEvent.awardId;
        const spyMapGet = jest.spyOn(service.vestedSharesCache, "get");
        const spyMapSet = jest.spyOn(service.vestedSharesCache, "set");

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

            const result = service.computeVestedShares(mockEvent, mockTargetDate);
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

            const result = service.computeVestedShares(mockEvent, mockTargetDate);
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

            const result = service.computeVestedShares(mockEvent, new Date("2019-12-01"));
            expect(spyMapGet).toHaveBeenCalledWith(mockCacheKey);
            expect(spyMapSet).toHaveBeenCalledWith(mockCacheKey, mockVestedShares);
            expect(result).toMatchObject(mockVestedShares);
        });
    });

    describe("test processVestingEvents function", () => {
        test("test for success case", () => {
            const service: VestingScheduleService = new VestingScheduleService(mockRepository, mockOutput);
            const spyComputeVestedShares = jest.spyOn(service, "computeVestedShares");

            mockVestingEvents.forEach((event, index) => spyComputeVestedShares.mockReturnValueOnce(mockVestedShares[index]));

            const result = service.processVestingEvents(mockVestingEvents, mockTargetDate);
            expect(spyComputeVestedShares).toHaveBeenCalledTimes(mockVestingEvents.length);
            expect(result).toMatchObject([mockVestedShares[1]]);
        });
    });
});
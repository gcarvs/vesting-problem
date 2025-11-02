import { VestingEventsConsoleOut } from "../../src/adapters/VestingEventsConsoleOut";
import { VestingEventsFileRepository } from "../../src/adapters/VestingEventsFileRepository";
import { VestedShares } from "../../src/domain/models/VestedShares";
import { VestingScheduleService } from "../../src/domain/VestingSchedule.service";

describe("test VestingScheduleService", () => {
    describe("test calculateVestedShares function", () => {
        const mockRepository = new VestingEventsFileRepository("test_file.csv");
        const mockOutput = new VestingEventsConsoleOut();
        const mockTargetDate = new Date("2025-11-02");
        const expectedResult: VestedShares[] = [
            {
                employeeId: "EMPLOYEE_01",
                employeeName: "EMPLOYEE",
                awardId: "AWARD_01",
                awardedShares: 10
            }
        ];

        const spyGetSharesVested = jest.spyOn(mockRepository, "getSharesVestedByTargetDate");
        const spyDispatch = jest.spyOn(mockOutput, "dispatchVestedShares");

        beforeEach(() => {
            spyGetSharesVested.mockClear();
            spyDispatch.mockClear();
        });
        test("test for success case", async () => {
            spyGetSharesVested.mockResolvedValueOnce(expectedResult);

            const service = new VestingScheduleService(mockRepository, mockOutput);
            await service.calculateVestedShares(mockTargetDate);

            expect(spyGetSharesVested).toHaveBeenCalledWith(mockTargetDate);
            expect(spyDispatch).toHaveBeenCalledWith(expectedResult);
        });
        test("test for empty result", async () => {
            spyGetSharesVested.mockResolvedValueOnce([]);

            const service = new VestingScheduleService(mockRepository, mockOutput);
            await service.calculateVestedShares(mockTargetDate);
            
            expect(spyGetSharesVested).toHaveBeenCalledWith(mockTargetDate);
            expect(spyDispatch).not.toHaveBeenCalled();
        });
    });
});
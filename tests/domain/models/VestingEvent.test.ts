import { CancelOperation, isValidEventType, VestingEventProcessor, VestOperation } from "../../../src/domain/models/VestingEvent";

describe("test isValidEventType function", () => {
    test("test for a valid event type", () => {
        const eventType: string = "VEST";

        expect(isValidEventType(eventType)).toBeTruthy();
    });

    test("test for invalid event types", () => {
        const invalidEvent1: string = "INVALID";
        const invalidEvent2: number = 123;
        const invalidEvent3: boolean = true;
        const invalidEvent4 = null;

        expect(isValidEventType(invalidEvent1)).toBeFalsy();
        expect(isValidEventType(invalidEvent2)).toBeFalsy();
        expect(isValidEventType(invalidEvent3)).toBeFalsy();
        expect(isValidEventType(invalidEvent4)).toBeFalsy();
    });

    describe("test VestOperation processor", () => {
        test("test success case", () => {
            const originalBalance: number = 10;
            const eventBalance: number = 5;

            const operator: VestingEventProcessor = new VestOperation();

            expect(operator.processVestingEvent(originalBalance, eventBalance)).toEqual(15);
        });
    });

    describe("test CancelOperation processor", () => {
        test("test for balance > event", () => {
            const originalBalance: number = 10;
            const eventBalance: number = 5;

            const operator: VestingEventProcessor = new CancelOperation();

            expect(operator.processVestingEvent(originalBalance, eventBalance)).toEqual(5);
        });

        test("test for balance = event", () => {
            const originalBalance: number = 10;
            const eventBalance: number = 10;

            const operator: VestingEventProcessor = new CancelOperation();

            expect(operator.processVestingEvent(originalBalance, eventBalance)).toEqual(0);
        });

        test("test for balance < event", () => {
            const originalBalance: number = 10;
            const eventBalance: number = 15;

            const operator: VestingEventProcessor = new CancelOperation();

            expect(operator.processVestingEvent(originalBalance, eventBalance)).toEqual(originalBalance);
        });
    });
});
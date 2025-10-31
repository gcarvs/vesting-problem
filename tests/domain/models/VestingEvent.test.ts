import { isValidEventType } from "../../../src/domain/models/VestingEvent";

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
});
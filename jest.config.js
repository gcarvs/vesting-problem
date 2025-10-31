module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    collectCoverage: true,
    collectCoverageFrom: ["./src/**/*.ts"],
    modulePathIgnorePatterns: ["./dist"],
    silent: true,
    forceExit: true
};
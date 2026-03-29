import * as assert from "node:assert";
import { calculateRarityFromAverage, applyRarityLimits } from "../src/rarity";

function testRarityThresholds() {
    console.log("Running testRarityThresholds...");
    assert.strictEqual(calculateRarityFromAverage(0.95), "legendary");
    assert.strictEqual(calculateRarityFromAverage(0.9), "legendary");
    assert.strictEqual(calculateRarityFromAverage(0.85), "mythic");
    assert.strictEqual(calculateRarityFromAverage(0.75), "mythic");
    assert.strictEqual(calculateRarityFromAverage(0.6), "epic");
    assert.strictEqual(calculateRarityFromAverage(0.5), "epic");
    assert.strictEqual(calculateRarityFromAverage(0.4), "rare");
    assert.strictEqual(calculateRarityFromAverage(0.25), "rare");
    assert.strictEqual(calculateRarityFromAverage(0.2), "common");
    assert.strictEqual(calculateRarityFromAverage(0), "common");
    console.log("✅ testRarityThresholds passed");
}

function testRarityLimits() {
    console.log("Running testRarityLimits...");
    const teachers = [
        { id: "t1", avg_rating: 0.95 }, // legendary
        { id: "t2", avg_rating: 0.92 }, // legendary
        { id: "t3", avg_rating: 0.8 },  // mythic
        { id: "t4", avg_rating: 0.76 }, // mythic
        { id: "t5", avg_rating: 0.6 },  // epic
        { id: "t6", avg_rating: 0.3 },  // rare
    ];

    const limits = {
        legendary: 1,
        mythic: 1,
        epic: 1,
        rare: 1
    };

    const results = applyRarityLimits(teachers, limits);

    assert.strictEqual(results.get("t1"), "legendary", "t1 should be legendary");
    assert.strictEqual(results.get("t2"), "mythic", "t2 should be demoted to mythic");
    assert.strictEqual(results.get("t3"), "epic", "t3 should be demoted to epic");
    assert.strictEqual(results.get("t4"), "rare", "t4 should be demoted to rare");
    assert.strictEqual(results.get("t5"), "common", "t5 should be demoted to common");
    assert.strictEqual(results.get("t6"), "common", "t6 should be demoted to common");

    console.log("✅ testRarityLimits passed");
}

function testNoLimits() {
    console.log("Running testNoLimits...");
    const teachers = [
        { id: "t1", avg_rating: 0.95 },
        { id: "t2", avg_rating: 0.92 },
    ];
    const limits = {};
    const results = applyRarityLimits(teachers, limits);
    assert.strictEqual(results.get("t1"), "legendary");
    assert.strictEqual(results.get("t2"), "legendary");
    console.log("✅ testNoLimits passed");
}

try {
    testRarityThresholds();
    testRarityLimits();
    testNoLimits();
    console.log("\nALL TESTS PASSED! 🎉");
} catch (error) {
    console.error("\nTEST FAILED! ❌");
    console.error(error);
    process.exit(1);
}

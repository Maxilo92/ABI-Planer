import * as assert from "node:assert";

/**
 * Mocking the logic found in functions/src/referrals.ts to verify the reward math.
 * Base reward: min(2 + totalPastReferrals, 10) boosters
 * Monthly cap: 30 boosters
 * Referred user: 3 boosters (not simulated here)
 */
function simulateReferrals(totalPastReferrals: number, monthlyAwarded: number) {
    const baseReward = Math.min(2 + totalPastReferrals, 10);
    const allowedReward = Math.max(0, Math.min(baseReward, 30 - monthlyAwarded));
    
    return {
        baseReward,
        allowedReward
    };
}

function runSimulation() {
    console.log("Running Referral Scaling & Cap Simulation...");

    let totalPastReferrals = 0;
    let monthlyAwarded = 0;

    const results = [];

    // Simulate 10 referrals in one month
    // Referral 1: 2 boosters (2 + 0)
    // Referral 2: 3 boosters (2 + 1)
    // Referral 3: 4 boosters (2 + 2)
    // Referral 4: 5 boosters (2 + 3)
    // Referral 5: 6 boosters (2 + 4)
    // Referral 6: 7 boosters (2 + 5)
    // Referral 7: 3 boosters (Remaining from cap 30: 2+3+4+5+6+7 = 27, 30-27 = 3)
    // Referral 8: 0 boosters (Cap reached)

    for (let i = 1; i <= 10; i++) {
        const reward = simulateReferrals(totalPastReferrals, monthlyAwarded);
        
        monthlyAwarded += reward.allowedReward;
        totalPastReferrals++;

        results.push({
            referral: i,
            base: reward.baseReward,
            awarded: reward.allowedReward,
            cumulative: monthlyAwarded
        });
    }

    console.table(results);

    // Verification
    assert.strictEqual(results[0].awarded, 2, "Referral 1 should award 2 boosters");
    assert.strictEqual(results[1].awarded, 3, "Referral 2 should award 3 boosters");
    assert.strictEqual(results[5].awarded, 7, "Referral 6 should award 7 boosters");
    assert.strictEqual(results[6].awarded, 3, "Referral 7 should award only 3 boosters due to 30-cap");
    assert.strictEqual(results[7].awarded, 0, "Referral 8 should award 0 boosters (Monthly cap reached)");
    assert.strictEqual(monthlyAwarded, 30, "Total boosters for 10 referrals should be capped at 30");

    console.log("✅ Simulation passed: Referral scaling and monthly cap (30) correctly handled.");
}

try {
    runSimulation();
} catch (error) {
    console.error("❌ Simulation failed!");
    console.error(error);
    process.exit(1);
}

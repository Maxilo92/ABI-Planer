import * as assert from "node:assert";

/**
 * Mocking the logic found in functions/src/referrals.ts to verify the reward math.
 * Base reward: 4, 5, 6, 7, 8 for first 5 referrals this month.
 * Monthly cap: 30 boosters (which is exactly 4+5+6+7+8)
 * Referred user: 5 boosters (not simulated here)
 */
function simulateReferrals(pastMonthlyReferrals: number, monthlyAwarded: number) {
    // NEW SCALE: 4, 5, 6, 7, 8 (total 30 for 5 referrals). Resets monthly.
    const baseReward = pastMonthlyReferrals < 5 ? (4 + pastMonthlyReferrals) : 0;
    const allowedReward = Math.max(0, Math.min(baseReward, 30 - monthlyAwarded));
    
    return {
        baseReward,
        allowedReward
    };
}

function runSimulation() {
    console.log("Running Referral Scaling & Cap Simulation (Robust v2)...");

    let pastMonthlyReferrals = 0;
    let monthlyAwarded = 0;

    const results = [];

    // Simulate 7 referrals in one month
    // Referral 1: 4 boosters
    // Referral 2: 5 boosters
    // Referral 3: 6 boosters
    // Referral 4: 7 boosters
    // Referral 5: 8 boosters
    // Referral 6: 0 boosters (Monthly cap reached)

    for (let i = 1; i <= 7; i++) {
        const reward = simulateReferrals(pastMonthlyReferrals, monthlyAwarded);
        
        monthlyAwarded += reward.allowedReward;
        pastMonthlyReferrals++;

        results.push({
            referral: i,
            base: reward.baseReward,
            awarded: reward.allowedReward,
            cumulative: monthlyAwarded
        });
    }

    console.table(results);

    // Verification
    assert.strictEqual(results[0].awarded, 4, "Referral 1 should award 4 boosters");
    assert.strictEqual(results[1].awarded, 5, "Referral 2 should award 5 boosters");
    assert.strictEqual(results[2].awarded, 6, "Referral 3 should award 6 boosters");
    assert.strictEqual(results[3].awarded, 7, "Referral 4 should award 7 boosters");
    assert.strictEqual(results[4].awarded, 8, "Referral 5 should award 8 boosters");
    assert.strictEqual(results[5].awarded, 0, "Referral 6 should award 0 boosters (Monthly cap reached)");
    assert.strictEqual(monthlyAwarded, 30, "Total boosters for 5+ referrals should be exactly 30");

    console.log(" Simulation passed: New 4-8 scaling and monthly cap (30) correctly handled.");
}

try {
    runSimulation();
} catch (error) {
    console.error(" Simulation failed!");
    console.error(error);
    process.exit(1);
}

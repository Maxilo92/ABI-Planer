import * as assert from "node:assert";
import { AI_FIRST_NAMES, buildAiOpponentName } from "../src/constants/aiOpponentName";

function testPrefixAndNamePool() {
  console.log("Running testPrefixAndNamePool...");

  for (let i = 0; i < AI_FIRST_NAMES.length; i++) {
    const random = () => i / AI_FIRST_NAMES.length;
    const aiName = buildAiOpponentName(undefined, random);
    assert.ok(aiName.startsWith("ki-"), `Name must start with ki-: ${aiName}`);

    const firstName = aiName.replace("ki-", "");
    assert.ok(AI_FIRST_NAMES.includes(firstName), `Unexpected first name: ${firstName}`);
  }

  console.log("✅ testPrefixAndNamePool passed");
}

function testCustomEloSuffix() {
  console.log("Running testCustomEloSuffix...");

  const aiName = buildAiOpponentName(1500, () => 0);
  assert.strictEqual(aiName, "ki-tom (ELO 1500)");

  console.log("✅ testCustomEloSuffix passed");
}

try {
  testPrefixAndNamePool();
  testCustomEloSuffix();
  console.log("\nALL TESTS PASSED! 🎉");
} catch (error) {
  console.error("\nTEST FAILED! ❌");
  console.error(error);
  process.exit(1);
}
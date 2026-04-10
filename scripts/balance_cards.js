
const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src/constants/sets/teachers_v1.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Balancing Targets
const TARGETS = {
  common: { hp: [90, 100], dmg: [12, 18] },
  rare: { hp: [100, 115], dmg: [18, 25] },
  epic: { hp: [115, 125], dmg: [25, 35] },
  mythic: { hp: [125, 135], dmg: [35, 45] },
  legendary: { hp: [135, 150], dmg: [45, 60] },
  iconic: { hp: [150, 180], dmg: [60, 90] }
};

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Extract the array part
const startIdx = content.indexOf('[');
const endIdx = content.lastIndexOf(']');
const arrayStr = content.substring(startIdx, endIdx + 1);

// This is a bit hacky because it's TS, not JSON, but the structure is simple enough for a regex-based replacement
// or we can evaluate it if it's safe. Since I'm an AI, I'll use a safer approach: regex replacement per object.

const teacherObjects = arrayStr.match(/\{[\s\S]*?\}/g);

const updatedTeachers = teacherObjects.map(objStr => {
  // Extract rarity
  const rarityMatch = objStr.match(/rarity:\s*["'](.*?)["']/);
  if (!rarityMatch) return objStr;
  const rarity = rarityMatch[1];
  const target = TARGETS[rarity] || TARGETS.common;

  // Update HP
  let updatedObj = objStr.replace(/hp:\s*\d+/, `hp: ${getRandomInt(target.hp[0], target.hp[1])}`);

  // Update Attacks
  // Find the attacks array
  const attacksMatch = objStr.match(/attacks:\s*(\[[\s\S]*?\])/);
  if (attacksMatch) {
    let attacksStr = attacksMatch[1];
    const attackItems = attacksStr.match(/\{[\s\S]*?\}/g);
    
    if (attackItems) {
      const totalTargetDmg = getRandomInt(target.dmg[0], target.dmg[1]);
      
      if (attackItems.length === 1) {
        // Single attack gets full damage
        const newAttack = attackItems[0].replace(/damage:\s*\d+/, `damage: ${totalTargetDmg}`);
        updatedObj = updatedObj.replace(attacksStr, `[ ${newAttack} ]`);
      } else {
        // Multiple attacks: distribute damage
        // Usually one is weaker, one is stronger
        const newAttacks = attackItems.map((atk, idx) => {
          let dmg;
          if (idx === 0) {
            dmg = Math.round(totalTargetDmg * 0.4); // 40% for first
          } else if (idx === 1 && attackItems.length === 2) {
            dmg = totalTargetDmg - Math.round(totalTargetDmg * 0.4); // Rest for second
          } else {
            dmg = Math.round(totalTargetDmg / attackItems.length); // Fallback
          }
          return atk.replace(/damage:\s*\d+/, `damage: ${dmg}`);
        });
        updatedObj = updatedObj.replace(attacksStr, `[ ${newAttacks.join(', ')} ]`);
      }
    }
  }

  return updatedObj;
});

const newContent = content.substring(0, startIdx) + '[\n  ' + updatedTeachers.join(',\n  ') + '\n];\n';

fs.writeFileSync(filePath, newContent);
console.log('Balancing update complete.');

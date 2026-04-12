"use client";

import React, { useState, useImperativeHandle, forwardRef } from "react";
import { motion, useAnimation } from "framer-motion";

export interface DiceRollerRef {
  roll: (result: number) => Promise<void>;
}

const DiceRoller = forwardRef<DiceRollerRef, {}>((props, ref) => {
  const controls = useAnimation();
  const [currentResult, setCurrentResult] = useState<number | null>(null);

  const faceRotations = {
    1: { x: 0, y: 0 },
    2: { x: 0, y: 180 },
    3: { x: 0, y: -90 },
    4: { x: 0, y: 90 },
    5: { x: -90, y: 0 },
    6: { x: 90, y: 0 },
  };

  useImperativeHandle(ref, () => ({
    roll: async (result: number) => {
      setCurrentResult(null);
      const target = faceRotations[result as keyof typeof faceRotations];
      
      // Add multiple full rotations for a "rolling" effect
      const extraX = (Math.floor(Math.random() * 3) + 5) * 360;
      const extraY = (Math.floor(Math.random() * 3) + 5) * 360;
      const extraZ = (Math.floor(Math.random() * 3) + 5) * 360;

      await controls.start({
        rotateX: [0, target.x + extraX],
        rotateY: [0, target.y + extraY],
        rotateZ: [0, extraZ],
        transition: {
          duration: 2.5,
          ease: "easeOut",
        },
      });
      
      setCurrentResult(result);
    },
  }));

  const faceStyle = "absolute w-full h-full border-2 border-white/20 flex items-center justify-center text-4xl font-bold bg-white text-black rounded-xl shadow-inner backface-hidden";

  return (
    <div className="perspective-1000 mx-auto [--dice-size:6rem] [--dice-half:calc(var(--dice-size)/2)] sm:[--dice-size:8rem]" style={{ width: 'var(--dice-size)', height: 'var(--dice-size)' }}>
      <motion.div
        animate={controls}
        className="relative w-full h-full preserve-3d will-change-3d"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Face 1: Front */}
        <div className={faceStyle} style={{ transform: "rotateY(0deg) translateZ(var(--dice-half))" }}>
          <DiceDots count={1} />
        </div>
        {/* Face 2: Back */}
        <div className={faceStyle} style={{ transform: "rotateY(180deg) translateZ(var(--dice-half))" }}>
          <DiceDots count={2} />
        </div>
        {/* Face 3: Right */}
        <div className={faceStyle} style={{ transform: "rotateY(90deg) translateZ(var(--dice-half))" }}>
          <DiceDots count={3} />
        </div>
        {/* Face 4: Left */}
        <div className={faceStyle} style={{ transform: "rotateY(-90deg) translateZ(var(--dice-half))" }}>
          <DiceDots count={4} />
        </div>
        {/* Face 5: Top */}
        <div className={faceStyle} style={{ transform: "rotateX(90deg) translateZ(var(--dice-half))" }}>
          <DiceDots count={5} />
        </div>
        {/* Face 6: Bottom */}
        <div className={faceStyle} style={{ transform: "rotateX(-90deg) translateZ(var(--dice-half))" }}>
          <DiceDots count={6} />
        </div>
      </motion.div>
    </div>
  );
});

const DiceDots = ({ count }: { count: number }) => {
  const dotPositions = {
    1: ["center"],
    2: ["top-right", "bottom-left"],
    3: ["top-right", "center", "bottom-left"],
    4: ["top-left", "top-right", "bottom-left", "bottom-right"],
    5: ["top-left", "top-right", "center", "bottom-left", "bottom-right"],
    6: ["top-left", "top-right", "center-left", "center-right", "bottom-left", "bottom-right"],
  };

  const getDotClass = (pos: string) => {
    switch (pos) {
      case "center": return "col-start-2 row-start-2";
      case "top-left": return "col-start-1 row-start-1";
      case "top-right": return "col-start-3 row-start-1";
      case "center-left": return "col-start-1 row-start-2";
      case "center-right": return "col-start-3 row-start-2";
      case "bottom-left": return "col-start-1 row-start-3";
      case "bottom-right": return "col-start-3 row-start-3";
      default: return "";
    }
  };

  return (
    <div className="grid grid-cols-3 grid-rows-3 w-[65%] h-[65%] p-2">
      {dotPositions[count as keyof typeof dotPositions].map((pos, i) => (
        <div key={i} className={`w-[22%] h-[22%] bg-black rounded-full self-center justify-self-center ${getDotClass(pos)}`} />
      ))}
    </div>
  );
};

DiceRoller.displayName = "DiceRoller";

export default DiceRoller;

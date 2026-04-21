import { motion } from "framer-motion";
import { SEED_TYPES, FocusTree } from "@/lib/game-data";

interface TreeVisualProps {
  tree: FocusTree;
  index: number;
}

export function TreeVisual({ tree }: TreeVisualProps) {
  const seed = SEED_TYPES.find(s => s.id === tree.seedType) || SEED_TYPES[0];
  const growth = tree.growth;
  
  // Tree stages based on growth
  let emoji = "??";
  let size = 24;
  
  if (growth < 20) {
    emoji = "??";
    size = 16;
  } else if (growth < 50) {
    emoji = "??";
    size = 20;
  } else if (growth < 100) {
    emoji = "??";
    size = 24;
  } else if (growth < 200) {
    emoji = "??";
    size = 28;
  } else if (growth < 500) {
    emoji = "??";
    size = 32;
  } else {
    emoji = "??";
    size = 36;
  }

  return (
    <motion.div
      className="relative flex items-center justify-center"
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
    >
      <div 
        className="text-4xl font-bold leading-none"
        style={{ fontSize: `${size}px` }}
      >
        {seed.emoji}
      </div>
      
      {/* Growth particles */}
      {growth > 0 && growth < 500 && (
        <motion.div
          className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
          style={{ backgroundColor: seed.leafColor }}
          animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      
      {/* Glow for ancient trees */}
      {growth >= 500 && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: seed.canopyColor }}
          animate={{ opacity: [0.2, 0.4, 0.2], scale: [1, 1.2, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}

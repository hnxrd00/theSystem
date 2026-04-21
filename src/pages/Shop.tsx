import { useState } from "react";
import { useGame } from "@/context/GameContext";
import { useParticles } from "@/context/ParticleContext";
import { SHOP_ITEMS, SHOP_CATEGORY_LABELS, ShopItemCategory } from "@/lib/game-data";
import { playSound } from "@/lib/sounds";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Check, Coins } from "lucide-react";

const CATEGORIES: ShopItemCategory[] = ["armor", "weapon", "avatar", "theme", "celebration"];

export default function Shop() {
  const { gold, inventory, purchaseItem } = useGame();
  const [filter, setFilter] = useState<ShopItemCategory | "all">("all");
  const [confirmItem, setConfirmItem] = useState<string | null>(null);
  const [justPurchased, setJustPurchased] = useState<string | null>(null);

  const filtered = filter === "all" ? SHOP_ITEMS : SHOP_ITEMS.filter(i => i.category === filter);

  const { emit } = useParticles();

  const handlePurchase = (id: string, price: number) => {
    purchaseItem(id, price);
    playSound("purchase");
    emit("questComplete", 0.5, 0.5);
    setConfirmItem(null);
    setJustPurchased(id);
    setTimeout(() => setJustPurchased(null), 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingBag className="w-5 h-5" />
          <h1 className="text-2xl font-bold tracking-tight font-display">Shop</h1>
        </div>
        <div className="flex items-center gap-2 bg-secondary px-4 py-2 rounded-lg">
          <Coins className="w-4 h-4 text-gold" />
          <span className="font-mono font-bold text-sm">{gold}</span>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filter === "all" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"}`}
        >All</button>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setFilter(c)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filter === c ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"}`}
          >{SHOP_CATEGORY_LABELS[c]}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((item, i) => {
            const owned = inventory.includes(item.id);
            const canAfford = gold >= item.price;
            const wasJustPurchased = justPurchased === item.id;
            return (
              <motion.div key={item.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.03 }}
                className={`border rounded-lg p-4 transition-all ${owned ? "border-foreground/20 bg-card opacity-70" : "border-border bg-card hover:border-foreground/40"}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-3xl" style={{ imageRendering: "pixelated" }}>{item.pixelIcon}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-0.5 bg-secondary rounded-full">
                    {SHOP_CATEGORY_LABELS[item.category]}
                  </span>
                </div>
                <h3 className="font-semibold text-sm">{item.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                <div className="flex items-center justify-between mt-4">
                  <span className="font-mono text-sm flex items-center gap-1">🪙 {item.price}</span>
                  {owned ? (
                    <span className="text-xs flex items-center gap-1 text-muted-foreground font-medium"><Check className="w-3.5 h-3.5" /> Owned</span>
                  ) : wasJustPurchased ? (
                    <motion.span initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-xs font-medium text-success flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Purchased!
                    </motion.span>
                  ) : (
                    <button onClick={() => setConfirmItem(item.id)} disabled={!canAfford}
                      className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:opacity-90 disabled:opacity-30 transition-opacity"
                    >{canAfford ? "Buy" : "Can't afford"}</button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {confirmItem && (() => {
          const item = SHOP_ITEMS.find(i => i.id === confirmItem);
          if (!item) return null;
          return (
            <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 p-4"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConfirmItem(null)}
            >
              <motion.div className="bg-background border border-border rounded-lg p-6 w-full max-w-sm text-center"
                initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()}
              >
                <span className="text-5xl block mb-4">{item.pixelIcon}</span>
                <h2 className="text-lg font-bold font-display">{item.name}</h2>
                <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                <div className="flex items-center justify-center gap-2 mt-3 font-mono"><span className="text-lg">🪙 {item.price}</span></div>
                <p className="text-xs text-muted-foreground mt-2">Balance after: 🪙 {gold - item.price}</p>
                <div className="flex gap-2 mt-5">
                  <button onClick={() => setConfirmItem(null)} className="flex-1 py-2 border border-border rounded-md text-sm hover:bg-accent transition-colors">Cancel</button>
                  <button onClick={() => handlePurchase(item.id, item.price)} className="flex-1 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity">Confirm</button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}

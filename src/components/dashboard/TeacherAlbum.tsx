"use client";

import { useUserTeachers } from "@/hooks/useUserTeachers";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LootTeacher,
  TeacherRarity,
  Profile,
  CardVariant,
} from "@/types/database";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Trophy,
  Star,
  Lock,
  Search,
  Filter,
  X,
  ChevronRight,
  ChevronLeft,
  Rotate3d,
  ArrowDownAZ,
  ArrowDownZA,
  ArrowUp10,
  LayoutGrid,
  Package,
  ArrowUpNarrowWide,
  ArrowDownWideNarrow,
  Heart,
  Swords,
  Sparkles,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { TeacherCard } from "@/components/cards/TeacherCard";
import { TeacherSpecCard } from "@/components/cards/TeacherSpecCard";
import { CardData, CardVariant as NewCardVariant } from "@/types/cards";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const DEFAULT_TEACHERS: LootTeacher[] = [
  { id: "max-mustermann", name: "Max Mustermann", rarity: "common" },
  { id: "erika-musterfrau", name: "Erika Musterfrau", rarity: "rare" },
  { id: "marie-curie", name: "Marie Curie", rarity: "mythic" },
  { id: "albert-einstein", name: "Albert Einstein", rarity: "legendary" },
];

const getNextLevelCount = (level: number): number => {
  return Math.pow(level, 2) + 1;
};

const getPrevLevelCount = (level: number): number => {
  if (level <= 1) return 0;
  return Math.pow(level - 1, 2) + 1;
};

const getVariantLabel = (variant: CardVariant) => {
  switch (variant) {
    case "normal":
      return "Normal";
    case "holo":
      return "Holo";
    case "shiny":
      return "Shiny";
    case "black_shiny_holo":
      return "Secret Rare";
    default:
      return variant;
  }
};

const getVariantBadge = (variant: CardVariant) => {
  switch (variant) {
    case "normal":
      return "bg-slate-500";
    case "holo":
      return "bg-gradient-to-r from-blue-400 to-purple-500";
    case "shiny":
      return "bg-gradient-to-r from-yellow-400 to-orange-500";
    case "black_shiny_holo":
      return "bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600";
    default:
      return "bg-slate-500";
  }
};

const getRarityColor = (rarity: TeacherRarity) => {
  switch (rarity) {
    case "common":
      return "text-slate-500";
    case "rare":
      return "text-emerald-500";
    case "epic":
      return "text-purple-500";
    case "mythic":
      return "text-red-500";
    case "legendary":
      return "text-amber-500";
    default:
      return "";
  }
};

const getRarityBadge = (rarity: TeacherRarity) => {
  switch (rarity) {
    case "common":
      return "bg-slate-500";
    case "rare":
      return "bg-emerald-500";
    case "epic":
      return "bg-purple-500";
    case "mythic":
      return "bg-red-500";
    case "legendary":
      return "bg-amber-500";
    default:
      return "";
  }
};

const getRarityLabel = (rarity: TeacherRarity) => {
  switch (rarity) {
    case "common":
      return "Gewöhnlich";
    case "rare":
      return "Selten";
    case "epic":
      return "Episch";
    case "mythic":
      return "Mythisch";
    case "legendary":
      return "Legendär";
    default:
      return rarity;
  }
};

const getRarityGlow = (rarity: TeacherRarity) => {
  switch (rarity) {
    case "common":
      return "shadow-[0_0_20px_rgba(100,116,139,0.3)]";
    case "rare":
      return "shadow-[0_0_25px_rgba(16,185,129,0.5)]";
    case "epic":
      return "shadow-[0_0_30px_rgba(147,51,234,0.6)]";
    case "mythic":
      return "shadow-[0_0_35px_rgba(220,38,38,0.7)]";
    case "legendary":
      return "shadow-[0_0_40px_rgba(245,158,11,0.8)]";
    default:
      return "";
  }
};

function getTeacherRarityHex(rarity: TeacherRarity) {
  switch (rarity) {
    case "common":
      return "#64748b";
    case "rare":
      return "#10b981";
    case "epic":
      return "#9333ea";
    case "mythic":
      return "#dc2626";
    case "legendary":
      return "#f59e0b";
    default:
      return "#64748b";
  }
}

const RARITY_MAP: Record<string, number> = {
  legendary: 0,
  mythic: 1,
  epic: 2,
  rare: 3,
  common: 4,
};

const VARIANT_MAP: Record<string, number> = {
  black_shiny_holo: 0,
  shiny: 1,
  holo: 2,
  normal: 3,
};

function getBestVariant(
  variants: Record<string, number> | undefined,
): NewCardVariant {
  if (!variants) return "normal";
  if (variants.black_shiny_holo) return "black_shiny_holo";
  if (variants.shiny) return "shiny";
  if (variants.holo) return "holo";
  return "normal";
}

function mapTeacherToCardData(
  teacher: LootTeacher,
  userData: any,
  globalTeachers: LootTeacher[] | Map<string, number> | number,
  forcedVariant?: NewCardVariant,
): CardData {
  const variant = forcedVariant || getBestVariant(userData?.variants);

  let globalIndex: number;
  if (typeof globalTeachers === "number") {
    globalIndex = globalTeachers;
  } else if (globalTeachers instanceof Map) {
    globalIndex = globalTeachers.get(teacher.id || teacher.name) ?? -1;
  } else {
    globalIndex = globalTeachers.findIndex(
      (t) => (t.id || t.name) === (teacher.id || teacher.name),
    );
  }

  return {
    id: teacher.id || teacher.name,
    name: teacher.name,
    rarity: teacher.rarity,
    variant,
    color: getTeacherRarityHex(teacher.rarity),
    cardNumber: (globalIndex + 1).toString().padStart(3, "0"),
    description: teacher.description,
    hp: teacher.hp,
    attacks: teacher.attacks,
  };
}

function TeacherCardDetail({
  teacher,
  userData,
  onClose,
  globalTeachers,
  allTeachers,
  currentIndex,
  onNavigate,
}: {
  teacher: LootTeacher;
  userData: any;
  onClose: () => void;
  globalTeachers: LootTeacher[] | Map<string, number>;
  allTeachers: any[];
  currentIndex: number;
  onNavigate: (index: number) => void;
}) {
  const isOwned = !!userData;
  const level = userData?.level || 1;
  const count = userData?.count || 0;
  const [displayVariant, setDisplayVariant] = useState<NewCardVariant>(
    getBestVariant(userData?.variants),
  );
  const [activeCard, setActiveCard] = useState<"visual" | "spec">("visual");
  const [direction, setDirection] = useState(0);

  const cardData = mapTeacherToCardData(
    teacher,
    userData,
    globalTeachers,
    displayVariant,
  );

  const ownedVariants = useMemo(() => {
    if (!userData?.variants) return ["normal"];
    return Object.keys(userData.variants).filter(
      (v) => userData.variants[v] > 0,
    );
  }, [userData]);

  const handleNext = () => {
    if (currentIndex < allTeachers.length - 1) {
      setDirection(1);
      onNavigate(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      onNavigate(currentIndex - 1);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-6 py-8 px-4 w-full">
      <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-[2.5/3.5] mb-4 group">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={`${teacher.id || teacher.name}-${activeCard}`}
            custom={direction}
            initial={{
              x: direction > 0 ? 100 : direction < 0 ? -100 : 0,
              opacity: 0,
              scale: 0.9,
            }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{
              x: direction > 0 ? -100 : direction < 0 ? 100 : 0,
              opacity: 0,
              scale: 0.9,
            }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.x < -70) handleNext();
              else if (info.offset.x > 70) handlePrev();
            }}
            className="w-full h-full cursor-pointer touch-none"
            onClick={() =>
              setActiveCard(activeCard === "visual" ? "spec" : "visual")
            }
          >
            {activeCard === "visual" ? (
              <TeacherCard
                data={cardData}
                className="w-full h-auto"
                styleVariant="modern-flat"
                isFlippedExternally={true}
                interactive={false}
              />
            ) : (
              <TeacherSpecCard
                data={cardData}
                className="w-full h-auto"
                styleVariant="modern-flat"
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          disabled={currentIndex === 0}
          className="absolute left-[-20%] top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/40 transition-all opacity-0 group-hover:opacity-100 max-sm:hidden disabled:opacity-0"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          disabled={currentIndex === allTeachers.length - 1}
          className="absolute right-[-20%] top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/40 transition-all opacity-0 group-hover:opacity-100 max-sm:hidden disabled:opacity-0"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="text-center animate-pulse flex items-center gap-2 text-white/50 text-xs font-medium bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
          <Sparkles className="h-3.5 w-3.5 text-blue-400" />
          Wischen für andere Lehrer
        </div>

        {/* Pagination Dots */}
        <div className="flex gap-1.5 items-center">
          <div className="text-[10px] font-black text-white/20 mr-1">
            {currentIndex + 1} / {allTeachers.length}
          </div>
          <button
            onClick={() => setActiveCard("visual")}
            className={cn(
              "h-1 rounded-full transition-all",
              activeCard === "visual" ? "bg-white w-6" : "bg-white/20 w-3",
            )}
          />
          <button
            onClick={() => setActiveCard("spec")}
            className={cn(
              "h-1 rounded-full transition-all",
              activeCard === "spec" ? "bg-white w-6" : "bg-white/20 w-3",
            )}
          />
        </div>
      </div>

      <div className="w-full max-w-sm space-y-4 px-4">
        {/* Variant Gallery */}
        <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-2xl">
          <p className="text-[10px] font-black uppercase text-white/40 mb-3 tracking-widest px-1">
            Deine Varianten
          </p>
          <div className="flex flex-wrap gap-2">
            {(
              [
                "normal",
                "holo",
                "shiny",
                "black_shiny_holo",
              ] as NewCardVariant[]
            ).map((v) => {
              const isAvailable = ownedVariants.includes(v);
              const isActive = displayVariant === v;
              return (
                <button
                  key={v}
                  disabled={!isAvailable}
                  onClick={() => setDisplayVariant(v)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all border-2",
                    isAvailable
                      ? isActive
                        ? "bg-white text-black border-white shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                        : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10"
                      : "opacity-20 cursor-not-allowed border-transparent grayscale",
                  )}
                >
                  {getVariantLabel(v as any)}
                  {isAvailable &&
                    userData.variants?.[v] &&
                    userData.variants[v] > 1 && (
                      <span className="ml-1 text-[8px] opacity-60">
                        x{userData.variants[v]}
                      </span>
                    )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-6 space-y-4 border border-white/10 shadow-2xl">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-white">
              Sammlungs-Fortschritt
            </span>
            <Badge
              variant="outline"
              className="text-[10px] text-white/70 border-white/20"
            >
              {count}x gesammelt
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold px-1 text-white/80">
              <span>Level {level}</span>
              <span>EP</span>
            </div>
            <Progress
              value={
                ((count - getPrevLevelCount(level)) /
                  (getNextLevelCount(level) - getPrevLevelCount(level))) *
                100
              }
              className="h-2 bg-white/10"
            />
            <p className="text-[10px] text-center text-white/40 pt-1">
              Noch {getNextLevelCount(level) - count} Karten bis Level{" "}
              {level + 1}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TeacherAlbum({
  userId,
  targetProfile,
  initialLimit,
}: {
  userId?: string;
  targetProfile?: Profile | null;
  initialLimit?: number;
}) {
  const router = useRouter();
  const { profile: currentProfile } = useAuth();
  const activeProfile =
    targetProfile !== undefined ? targetProfile : currentProfile;
  const { teachers: userTeachers, loading: loadingUserTeachers } =
    useUserTeachers(userId);
  const [globalTeachers, setGlobalTeachers] = useState<LootTeacher[]>([]);
  const [loadingGlobal, setLoadingGlobal] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  // Filters state
  const [search, setSearch] = useState("");
  const [rarityFilters, setRarityFilters] = useState<TeacherRarity[]>([]);
  const [variantFilters, setVariantFilters] = useState<NewCardVariant[]>([]);
  const [ownershipFilter, setOwnershipFilter] = useState<
    "all" | "owned" | "missing"
  >(initialLimit ? "owned" : "all");
  const [sortKey, setSortKey] = useState<
    "rarity" | "variant" | "name" | "level"
  >("rarity");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Selection state
  const [selectedTeacherIndex, setSelectedTeacherIndex] = useState<
    number | null
  >(null);

  const isPreview = !!initialLimit && !isExpanded;

  const globalIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    globalTeachers.forEach((t, i) => {
      map.set(t.id || t.name, i);
    });
    return map;
  }, [globalTeachers]);

  const teacherMetadata = useMemo(() => {
    return globalTeachers.map((t, index) => {
      const userData = userTeachers?.[t.id] || userTeachers?.[t.name];
      const isOwned = !!userData;
      const bestVariant = getBestVariant(userData?.variants);
      return {
        teacher: t,
        userData,
        isOwned,
        bestVariant,
        rarityWeight: RARITY_MAP[t.rarity] ?? 99,
        variantWeight: VARIANT_MAP[bestVariant] ?? 99,
        level: userData?.level || 1,
        nameLower: t.name.toLowerCase(),
        cardData: mapTeacherToCardData(t, userData, index, bestVariant),
      };
    });
  }, [globalTeachers, userTeachers]);

  const handleSortChange = (key: "rarity" | "variant" | "name" | "level") => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("desc"); // Default to desc for new key
    }
  };

  useEffect(() => {
    let unsubscribeGlobal: (() => void) | null = null;

    const deduplicate = (teachers: LootTeacher[]) => {
      const seen = new Set();
      return teachers.filter((t) => {
        const id = t.id || t.name;
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
    };

    // Listen to sammelkarten settings as primary source
    const unsubscribeSammelkarten = onSnapshot(
      doc(db, "settings", "sammelkarten"),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (
            Array.isArray(data.loot_teachers) &&
            data.loot_teachers.length > 0
          ) {
            setGlobalTeachers(deduplicate(data.loot_teachers));
            setLoadingGlobal(false);
            // If we found data in sammelkarten, we don't need the global listener anymore
            if (unsubscribeGlobal) {
              unsubscribeGlobal();
              unsubscribeGlobal = null;
            }
            return;
          }
        }

        // Fallback to global settings if sammelkarten doesn't exist or has no teachers
        if (!unsubscribeGlobal) {
          unsubscribeGlobal = onSnapshot(
            doc(db, "settings", "global"),
            (globalSnap) => {
              if (globalSnap.exists()) {
                const globalData = globalSnap.data();
                setGlobalTeachers(
                  Array.isArray(globalData.loot_teachers) &&
                    globalData.loot_teachers.length > 0
                    ? deduplicate(globalData.loot_teachers)
                    : DEFAULT_TEACHERS,
                );
              } else {
                setGlobalTeachers(DEFAULT_TEACHERS);
              }
              setLoadingGlobal(false);
            },
          );
        }
      },
    );

    return () => {
      unsubscribeSammelkarten();
      if (unsubscribeGlobal) unsubscribeGlobal();
    };
  }, []);

  const filteredTeachers = useMemo(() => {
    const searchLower = search.toLowerCase();

    const result = teacherMetadata.filter((m) => {
      const t = m.teacher;
      // Search filter
      if (search && !m.nameLower.includes(searchLower)) return false;

      // Rarity filter
      if (rarityFilters.length > 0 && !rarityFilters.includes(t.rarity))
        return false;

      // Ownership filter
      if (ownershipFilter === "owned" && !m.isOwned) return false;
      if (ownershipFilter === "missing" && m.isOwned) return false;

      // Variant filter
      if (variantFilters.length > 0) {
        const variants = m.userData?.variants;
        if (!m.isOwned || !variants) return false;
        const hasVariant = variantFilters.some(
          (v) => (variants[v] || 0) > 0,
        );
        if (!hasVariant) return false;
      }

      return true;
    });

    // Sorting logic
    result.sort((a, b) => {
      // If we have an initialLimit and are not expanded, we PRIORITIZE rarity (rarity > version) for the preview
      if (
        initialLimit &&
        !isExpanded &&
        !search &&
        rarityFilters.length === 0 &&
        variantFilters.length === 0 &&
        (ownershipFilter === "all" || ownershipFilter === "owned")
      ) {
        // Ownership first even in preview
        if (a.isOwned !== b.isOwned) return b.isOwned ? 1 : -1;

        if (a.rarityWeight !== b.rarityWeight)
          return a.rarityWeight - b.rarityWeight;

        if (a.variantWeight !== b.variantWeight)
          return a.variantWeight - b.variantWeight;

        if (a.level !== b.level) return b.level - a.level;

        return a.teacher.name.localeCompare(b.teacher.name);
      }

      // Ownership always comes first in normal sorting
      if (a.isOwned !== b.isOwned) return b.isOwned ? 1 : -1;

      // Secondary sorting based on user selection
      if (sortKey === "level") {
        if (a.level !== b.level)
          return sortOrder === "desc" ? b.level - a.level : a.level - b.level;
      } else if (sortKey === "rarity") {
        if (a.rarityWeight !== b.rarityWeight)
          return sortOrder === "desc"
            ? a.rarityWeight - b.rarityWeight
            : b.rarityWeight - a.rarityWeight;

        if (a.variantWeight !== b.variantWeight)
          return sortOrder === "desc"
            ? a.variantWeight - b.variantWeight
            : b.variantWeight - a.variantWeight;
      } else if (sortKey === "variant") {
        if (a.variantWeight !== b.variantWeight)
          return sortOrder === "desc"
            ? a.variantWeight - b.variantWeight
            : b.variantWeight - a.variantWeight;

        if (a.rarityWeight !== b.rarityWeight)
          return sortOrder === "desc"
            ? a.rarityWeight - b.rarityWeight
            : b.rarityWeight - a.rarityWeight;
      } else if (sortKey === "name") {
        return sortOrder === "desc"
          ? b.teacher.name.localeCompare(a.teacher.name)
          : a.teacher.name.localeCompare(b.teacher.name);
      }

      // Default: sort by name
      return a.teacher.name.localeCompare(b.teacher.name);
    });

    return result;
  }, [
    teacherMetadata,
    search,
    rarityFilters,
    variantFilters,
    ownershipFilter,
    sortKey,
    sortOrder,
    initialLimit,
    isExpanded,
  ]);

  if (loadingUserTeachers || loadingGlobal) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="aspect-[3/4] rounded-xl bg-muted animate-pulse"
          />
        ))}
      </div>
    );
  }

  const totalTeachers = globalTeachers.length;
  const ownedCount = Object.keys(userTeachers || {}).length;
  const totalCardsCollected = Object.values(userTeachers || {}).reduce(
    (acc: number, curr: any) => acc + (curr.count || 0),
    0,
  );
  const packsOpened = activeProfile?.booster_stats?.total_opened || 0;

  // Determine which teachers to show based on expansion state
  const displayedTeachers =
    initialLimit && !isExpanded
      ? filteredTeachers.slice(0, initialLimit)
      : filteredTeachers;

  const selectedTeacher =
    selectedTeacherIndex !== null
      ? displayedTeachers[selectedTeacherIndex]
      : null;

  const toggleRarity = (rarity: TeacherRarity) => {
    setRarityFilters((prev) =>
      prev.includes(rarity)
        ? prev.filter((r) => r !== rarity)
        : [...prev, rarity],
    );
  };

  const toggleVariant = (variant: NewCardVariant) => {
    setVariantFilters((prev) =>
      prev.includes(variant)
        ? prev.filter((v) => v !== variant)
        : [...prev, variant],
    );
  };

  const clearFilters = () => {
    setSearch("");
    setRarityFilters([]);
    setVariantFilters([]);
    setOwnershipFilter("all");
    setSortKey("rarity");
    setSortOrder("desc");
  };

  const activeFilterCount =
    (search ? 1 : 0) +
    rarityFilters.length +
    variantFilters.length +
    (ownershipFilter !== "all" ? 1 : 0) +
    (sortKey !== "rarity" || sortOrder !== "desc" ? 1 : 0);

  return (
    <div className="space-y-6">
      {isPreview ? (
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
              Seltenste Karten
            </h2>
            <p className="text-xs text-muted-foreground font-medium">
              Die wertvollsten Funde aus der Sammlung
            </p>
          </div>
          <div className="flex items-center gap-2 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20">
            <Trophy className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-xs font-black text-amber-600 dark:text-amber-400">
              {ownedCount} / {totalTeachers}
            </span>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Trophy className="h-6 w-6 text-amber-500" />
                Lehrer-Album
              </h2>
              <p className="text-sm text-muted-foreground">
                {userId
                  ? `Sammlung von ${activeProfile?.full_name || "diesem Nutzer"}`
                  : "Sammle Lehrer aus Packs und vervollständige dein Album!"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {!userId && (
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black uppercase tracking-tighter gap-2 shadow-lg shadow-blue-500/20 mr-2 max-sm:w-full max-sm:mr-0"
                  onClick={() => router.push("/sammelkarten")}
                >
                  <Package className="h-3.5 w-3.5" />
                  Booster öffnen
                </Button>
              )}
              <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full border max-sm:w-full max-sm:justify-center">
                <Trophy className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-xs font-bold">
                  {ownedCount} / {totalTeachers} Entdeckt
                </span>
              </div>
              <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full border">
                <Package className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-xs font-bold">{packsOpened} Packs</span>
              </div>
              <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full border">
                <LayoutGrid className="h-3.5 w-3.5 text-purple-500" />
                <span className="text-xs font-bold">
                  {totalCardsCollected as number} Karten
                </span>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Lehrer suchen..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="outline" className="gap-2 shrink-0" />
                  }
                >
                  <Filter className="h-4 w-4" />
                  Filter & Sortierung
                  {activeFilterCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-primary text-primary-foreground"
                    >
                      {activeFilterCount}
                    </Badge>
                  )}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 p-2 space-y-2">
                  <div className="space-y-1">
                    <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest opacity-50 px-2 py-1">
                      Besitz
                    </DropdownMenuLabel>
                    <div className="flex p-1 bg-muted/50 rounded-lg gap-1">
                      {(["all", "owned", "missing"] as const).map((status) => (
                        <button
                          key={status}
                          onClick={() => setOwnershipFilter(status)}
                          className={cn(
                            "flex-1 px-2 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all",
                            ownershipFilter === status
                              ? "bg-background shadow-sm text-foreground"
                              : "text-muted-foreground hover:bg-background/50",
                          )}
                        >
                          {status === "all"
                            ? "Alle"
                            : status === "owned"
                              ? "Entdeckt"
                              : "Fehlt"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <DropdownMenuSeparator />

                  <div className="space-y-1">
                    <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest opacity-50 px-2 py-1">
                      Sortierung
                    </DropdownMenuLabel>
                    <div className="grid grid-cols-1 gap-1">
                      {[
                        {
                          key: "rarity",
                          label: "Seltenheit",
                          icon: LayoutGrid,
                        },
                        {
                          key: "variant",
                          label: "Variante",
                          icon: Sparkles,
                        },
                        { key: "name", label: "Alphabet", icon: ArrowDownAZ },
                        { key: "level", label: "Level", icon: ArrowUp10 },
                      ].map((s) => (
                        <button
                          key={s.key}
                          onClick={() => handleSortChange(s.key as any)}
                          className={cn(
                            "flex items-center justify-between w-full px-2 py-1.5 rounded-md text-xs transition-all",
                            sortKey === s.key
                              ? "bg-primary/10 text-primary font-bold"
                              : "hover:bg-muted text-muted-foreground",
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <s.icon className="h-3.5 w-3.5" />
                            {s.label}
                          </div>
                          {sortKey === s.key &&
                            (sortOrder === "desc" ? (
                              <ArrowDownWideNarrow className="h-3.5 w-3.5" />
                            ) : (
                              <ArrowUpNarrowWide className="h-3.5 w-3.5" />
                            ))}
                        </button>
                      ))}
                    </div>
                  </div>

                  <DropdownMenuSeparator />

                  <div className="space-y-1">
                    <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest opacity-50 px-2 py-1">
                      Seltenheit
                    </DropdownMenuLabel>
                    <div className="grid grid-cols-5 gap-1 px-1">
                      {(
                        [
                          "legendary",
                          "mythic",
                          "epic",
                          "rare",
                          "common",
                        ] as TeacherRarity[]
                      ).map((rarity) => (
                        <button
                          key={rarity}
                          onClick={() => toggleRarity(rarity)}
                          className={cn(
                            "aspect-square rounded-md flex items-center justify-center transition-all border-2",
                            rarityFilters.includes(rarity)
                              ? cn(
                                  "border-transparent shadow-sm",
                                  getRarityBadge(rarity),
                                )
                              : "border-muted-foreground/10 bg-muted/30 hover:border-muted-foreground/30",
                          )}
                          title={getRarityLabel(rarity)}
                        >
                          <div
                            className={cn(
                              "w-2 h-2 rounded-full",
                              rarityFilters.includes(rarity)
                                ? "bg-white"
                                : getRarityBadge(rarity),
                            )}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <DropdownMenuSeparator />

                  <div className="space-y-1">
                    <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest opacity-50 px-2 py-1">
                      Variante
                    </DropdownMenuLabel>
                    <div className="grid grid-cols-4 gap-1 px-1">
                      {(
                        [
                          "black_shiny_holo",
                          "shiny",
                          "holo",
                          "normal",
                        ] as NewCardVariant[]
                      ).map((v) => (
                        <button
                          key={v}
                          onClick={() => toggleVariant(v)}
                          className={cn(
                            "aspect-square rounded-md border-2 transition-all flex items-center justify-center",
                            variantFilters.includes(v)
                              ? cn(
                                  "border-transparent shadow-sm",
                                  getVariantBadge(v as any),
                                )
                              : "border-muted-foreground/10 bg-muted/30 hover:border-muted-foreground/30",
                          )}
                          title={getVariantLabel(v as any)}
                        >
                          <div
                            className={cn(
                              "w-2 h-2 rounded-full",
                              variantFilters.includes(v)
                                ? "bg-white"
                                : getVariantBadge(v as any),
                            )}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {activeFilterCount > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <button
                        onClick={clearFilters}
                        className="w-full px-2 py-2 text-[10px] font-black uppercase text-destructive hover:bg-destructive/10 rounded-md transition-all text-center"
                      >
                        Alles zurücksetzen
                      </button>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </>
      )}

      {filteredTeachers.length === 0 ? (
        <div className="text-center py-20 bg-muted/30 rounded-2xl border-2 border-dashed">
          <p className="text-muted-foreground italic">
            {totalTeachers === 0
              ? "Noch keine Lehrer verfügbar."
              : "Keine Lehrer gefunden, die den Filtern entsprechen."}
          </p>

          {activeFilterCount > 0 && (
            <Button variant="link" onClick={clearFilters} className="mt-2">
              Alle Filter löschen
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
            {displayedTeachers.map((m, idx) => {
              const teacher = m.teacher;
              const teacherId = teacher.id || teacher.name;
              const isOwned = m.isOwned;

              return (
                <div
                  key={`${teacherId}-${idx}`}
                  className="flex flex-col items-center w-full mx-auto"
                >
                  <div
                    onClick={() => isOwned && setSelectedTeacherIndex(idx)}
                    className={cn(
                      "relative transition-all duration-300 transform group w-full aspect-[2.5/3.5]",
                      !isOwned && "cursor-not-allowed opacity-80",
                      isOwned &&
                        "cursor-pointer hover:scale-[1.05] hover:-rotate-1 active:scale-95 hover:z-10 active:z-10",
                    )}
                  >
                    <TeacherCard
                      data={m.cardData}
                      className="w-full h-auto"
                      styleVariant="modern-flat"
                      isFlippedExternally={isOwned}
                      isLocked={!isOwned}
                      interactive={false}
                    />
                  </div>

                  {isOwned && (
                    <div className="w-full mt-2 text-center">
                      <h3 className="font-black text-[9px] sm:text-[10px] uppercase tracking-tighter line-clamp-1 opacity-80">
                        {teacher.name}
                      </h3>
                      <div className="flex items-center justify-center gap-1.5 mt-1">
                        <div className="bg-black text-white rounded-full px-1.5 py-0 text-[8px] font-black border border-white/10">
                          LVL {m.level}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {initialLimit && filteredTeachers.length > initialLimit && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => setIsExpanded(!isExpanded)}
                className="gap-2"
              >
                {isExpanded
                  ? "Weniger anzeigen"
                  : `Alle ${filteredTeachers.length} Lehrer anzeigen`}
                <ChevronRight
                  className={cn(
                    "h-4 w-4 transition-transform",
                    isExpanded && "rotate-90",
                  )}
                />
              </Button>
            </div>
          )}
        </>
      )}

      <Dialog
        open={selectedTeacherIndex !== null}
        onOpenChange={(open) => !open && setSelectedTeacherIndex(null)}
      >
        <DialogContent className="max-w-[95vw] sm:max-w-md p-0 overflow-y-auto max-h-[90vh] bg-neutral-950/90 backdrop-blur-2xl border-white/10 shadow-2xl rounded-3xl ring-0">
          <div className="relative w-full">
            {selectedTeacher && selectedTeacherIndex !== null && (
              <TeacherCardDetail
                teacher={selectedTeacher.teacher}
                userData={selectedTeacher.userData}
                onClose={() => setSelectedTeacherIndex(null)}
                globalTeachers={globalIndexMap}
                allTeachers={displayedTeachers}
                currentIndex={selectedTeacherIndex}
                onNavigate={(index) => setSelectedTeacherIndex(index)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

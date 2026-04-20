"use client";

import { useUserTeachers } from "@/hooks/useUserTeachers";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
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
import { Skeleton } from "@/components/ui/skeleton";
import { Skeleton as BoneyardSkeleton } from "boneyard-js/react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CardRenderer } from "@/components/cards/CardRenderer";
import { CardDetailView } from "@/components/cards/CardDetailView";
import { usePopupManager } from "@/modules/popup/usePopupManager";
import { ShareResourceButton } from "@/components/ui/share-resource-button";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { buildTeacherCatalogFromSettings, findUserTeacherEntry, TeacherCatalogEntry } from "@/lib/cardCatalog";
import { getBestVariant, mapTeacherCatalogToCardData } from '@/modules/cards/cardData'

import { CARD_SETS } from "@/constants/cardRegistry";

const DEFAULT_TEACHERS: TeacherCatalogEntry[] = buildTeacherCatalogFromSettings({ sets: CARD_SETS });

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
    case "iconic":
      return "text-amber-200 dark:text-amber-400 font-black";
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
    case "iconic":
      return "bg-neutral-950 border border-amber-500/50 text-amber-500";
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
    case "iconic":
      return "Ikonen";
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
    case "iconic":
      return "shadow-[0_0_50px_rgba(251,191,36,0.6)]";
    default:
      return "";
  }
};

const RARITY_MAP: Record<string, number> = {
  iconic: 0,
  legendary: 1,
  mythic: 2,
  epic: 3,
  rare: 4,
  common: 5,
};

const VARIANT_MAP: Record<string, number> = {
  black_shiny_holo: 0,
  shiny: 1,
  holo: 2,
  normal: 3,
};

const INFINITE_SCROLL_BATCH_SIZE = 24;

function mapTeacherToCardData(
  teacher: TeacherCatalogEntry,
  userData: any,
  globalTeachers: TeacherCatalogEntry[] | Map<string, number> | number,
  forcedVariant?: NewCardVariant,
): CardData {
  return mapTeacherCatalogToCardData(
    teacher,
    userData,
    globalTeachers,
    forcedVariant,
  )
}

export function TeacherAlbum({
  userId,
  targetProfile,
  initialLimit,
  initialSelectedCardId,
}: {
  userId?: string;
  targetProfile?: Profile | null;
  initialLimit?: number;
  initialSelectedCardId?: string;
}) {
  const router = useRouter();
  const { profile: currentProfile, loading } = useAuth();
  const { drawer, dismiss } = usePopupManager();
  const activeProfile =
    targetProfile !== undefined ? targetProfile : currentProfile;
  const { teachers: userTeachers, loading: loadingUserTeachers } =
    useUserTeachers(userId);
  const [globalTeachers, setGlobalTeachers] = useState<TeacherCatalogEntry[]>([]);
  const [loadingGlobal, setLoadingGlobal] = useState(true);
  const [visibleCount, setVisibleCount] = useState(
    initialLimit && initialLimit > 0 ? initialLimit : INFINITE_SCROLL_BATCH_SIZE,
  );
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);

  // Filters state
  const [search, setSearch] = useState("");
  const [rarityFilters, setRarityFilters] = useState<TeacherRarity[]>([]);
  const [setFilters, setSetFilters] = useState<string[]>([]);
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

  const isPreview = !!initialLimit;

  const globalIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    globalTeachers.forEach((t, i) => {
      map.set(t.fullId, i);
    });
    return map;
  }, [globalTeachers]);

  const availableSets = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    globalTeachers.forEach((teacher) => {
      if (!map.has(teacher.setId)) {
        map.set(teacher.setId, { id: teacher.setId, name: teacher.setName });
      }
    });
    return Array.from(map.values());
  }, [globalTeachers]);

  const teacherMetadata = useMemo(() => {
    return globalTeachers.map((t, index) => {
      const userData = findUserTeacherEntry(userTeachers, t);
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
        nameLower: `${t.name} ${t.setName}`.toLowerCase(),
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
    const canAccessSammelkartenConfig = currentProfile?.role === "viewer" || !!currentProfile?.is_approved;

    if (loading || !canAccessSammelkartenConfig) return;

    let unsubscribeGlobal: (() => void) | null = null;

    const deduplicate = (teachers: TeacherCatalogEntry[]) => {
      const map = new Map<string, TeacherCatalogEntry>();
      teachers.forEach((t) => {
        // Use a composite key of setId and baseId to catch duplicates across legacy/new ID formats
        const baseKey = `${t.setId}:${t.baseId}`;
        const existing = map.get(baseKey);
        
        // We prefer the entry that already has the setId prefix in its fullId
        // or if we don't have an entry for this teacher yet.
        if (!existing || t.fullId === baseKey) {
          map.set(baseKey, t);
        }
      });
      return Array.from(map.values());
    };

    // Listen to sammelkarten settings as primary source
    const unsubscribeSammelkarten = onSnapshot(
      doc(db, "settings", "sammelkarten"),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const catalog = buildTeacherCatalogFromSettings(data);
          if (catalog.length > 0) {
            setGlobalTeachers(deduplicate([...DEFAULT_TEACHERS, ...catalog]));
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
                const catalog = buildTeacherCatalogFromSettings(globalData);
                setGlobalTeachers(
                  catalog.length > 0
                    ? deduplicate([...DEFAULT_TEACHERS, ...catalog])
                    : DEFAULT_TEACHERS,
                );
              } else {
                setGlobalTeachers(DEFAULT_TEACHERS);
              }
              setLoadingGlobal(false);
            },
            (error) => {
              console.error('TeacherAlbum: Error listening to global settings fallback:', error);
              setLoadingGlobal(false);
            }
          );
        }
      },
      (error) => {
        console.error('TeacherAlbum: Error listening to sammelkarten settings:', error);
        setLoadingGlobal(false);
      }
    );

    return () => {
      unsubscribeSammelkarten();
      if (unsubscribeGlobal) unsubscribeGlobal();
    };
  }, [currentProfile?.is_approved, currentProfile?.role, loading]);

  const filteredTeachers = useMemo(() => {
    const searchLower = search.toLowerCase();

    const result = teacherMetadata.filter((m) => {
      const t = m.teacher;
      // Search filter
      if (search && !m.nameLower.includes(searchLower)) return false;

      // Rarity filter
      if (rarityFilters.length > 0 && !rarityFilters.includes(t.rarity))
        return false;

      // Set filter
      if (setFilters.length > 0 && !setFilters.includes(t.setId))
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
    setFilters,
    variantFilters,
    ownershipFilter,
    sortKey,
    sortOrder,
    initialLimit,
  ]);

  // Sync drawer with selection state
  useEffect(() => {
    if (selectedTeacherIndex !== null) {
      const selectedTeacher = filteredTeachers[selectedTeacherIndex];
      if (selectedTeacher) {
        drawer({
          id: 'card-detail-drawer',
          title: '', 
          content: (
            <div className="relative w-full bg-neutral-950 min-h-screen">
               {/* Fixed Share Button in Corner */}
               <div className="absolute top-4 right-12 z-[110]">
                  <ShareResourceButton 
                    resourcePath={`/album/karte/${selectedTeacher.teacher.fullId.includes(':') ? selectedTeacher.teacher.fullId.split(':')[1] : selectedTeacher.teacher.id}`}
                    title={`${selectedTeacher.teacher.name} - Sammelkarte`}
                    variant="outline"
                    size="icon"
                    className="rounded-full bg-white/5 border-white/10 text-white hover:bg-white/10"
                  />
               </div>
               
               <CardDetailView
                  teacher={selectedTeacher.teacher}
                  userData={selectedTeacher.userData}
                  onClose={() => handleSelectCard(null)}
                  allCards={filteredTeachers}
                  currentIndex={selectedTeacherIndex}
                  onNavigate={(index) => handleSelectCard(index)}
                />
            </div>
          ),
          isDismissible: true,
          onDismiss: () => {
            setSelectedTeacherIndex(prev => {
              if (prev !== null) {
                // Only reset URL if we were actually selecting something
                if (window.location.pathname.includes('/karte/')) {
                  window.history.pushState({}, '', userId ? `/profil/${userId}` : '/album');
                }
                return null;
              }
              return prev;
            });
          }
        }); 
      }
    } else {
      dismiss('card-detail-drawer');
    }
  }, [selectedTeacherIndex, filteredTeachers]);


  const totalTeachers = globalTeachers.length;
  const ownedCount = globalTeachers.reduce(
    (acc, teacher) => (findUserTeacherEntry(userTeachers, teacher) ? acc + 1 : acc),
    0,
  );
  const totalCardsCollected = Object.values(userTeachers || {}).reduce(
    (acc: number, curr: any) => acc + (curr.count || 0),
    0,
  );
  const packsOpened = activeProfile?.booster_stats?.total_opened || 0;

  // Infinite scroll window on top of the filtered result list.
  const displayedTeachers = filteredTeachers.slice(0, visibleCount);
  const hasMoreTeachers = displayedTeachers.length < filteredTeachers.length;

  // Sync initial card selection
  useEffect(() => {
    if (initialSelectedCardId && filteredTeachers.length > 0 && selectedTeacherIndex === null) {
      const idx = filteredTeachers.findIndex(m => {
        const id = m.teacher.fullId.includes(':') ? m.teacher.fullId.split(':')[1] : m.teacher.id;
        return id === initialSelectedCardId || m.teacher.fullId === initialSelectedCardId;
      });
      if (idx !== -1) {
        // Ensure the card is within the visible batch
        if (idx >= visibleCount) {
           setVisibleCount(idx + 1);
        }
        setSelectedTeacherIndex(idx);
      }
    }
  }, [initialSelectedCardId, filteredTeachers, visibleCount, selectedTeacherIndex]);

  // Update URL when card is selected
  const handleSelectCard = (index: number | null) => {
    setSelectedTeacherIndex(index);
    if (index !== null) {
      const teacher = filteredTeachers[index].teacher;
      const cardId = teacher.fullId.includes(':') ? teacher.fullId.split(':')[1] : teacher.id;
      window.history.pushState({}, '', `/album/karte/${cardId}`);
    } else {
      window.history.pushState({}, '', '/album');
    }
  };

  const selectedTeacher =
    selectedTeacherIndex !== null
      ? displayedTeachers[selectedTeacherIndex]
      : null;

  useEffect(() => {
    const baseVisible =
      initialLimit && initialLimit > 0
        ? initialLimit
        : INFINITE_SCROLL_BATCH_SIZE;
    setVisibleCount(baseVisible);
    setIsLoadingMore(false);
  }, [
    initialLimit,
    search,
    ownershipFilter,
    rarityFilters,
    setFilters,
    variantFilters,
    sortKey,
    sortOrder,
  ]);

  useEffect(() => {
    if (selectedTeacherIndex === null) return;
    if (selectedTeacherIndex >= displayedTeachers.length) {
      setSelectedTeacherIndex(null);
    }
  }, [displayedTeachers.length, selectedTeacherIndex]);

  useEffect(() => {
    if (!hasMoreTeachers) return;

    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || isLoadingMore) return;

        setIsLoadingMore(true);
        setVisibleCount((prev) =>
          Math.min(prev + INFINITE_SCROLL_BATCH_SIZE, filteredTeachers.length),
        );
      },
      {
        root: null,
        rootMargin: "240px 0px",
        threshold: 0,
      },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [filteredTeachers.length, hasMoreTeachers, isLoadingMore]);

  useEffect(() => {
    if (!isLoadingMore) return;

    setIsLoadingMore(false);
  }, [visibleCount, isLoadingMore]);

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

  const toggleSet = (setId: string) => {
    setSetFilters((prev) =>
      prev.includes(setId)
        ? prev.filter((id) => id !== setId)
        : [...prev, setId],
    );
  };

  const clearFilters = () => {
    setSearch("");
    setRarityFilters([]);
    setSetFilters([]);
    setVariantFilters([]);
    setOwnershipFilter("all");
    setSortKey("rarity");
    setSortOrder("desc");
  };

  const activeFilterCount =
    (search ? 1 : 0) +
    rarityFilters.length +
    setFilters.length +
    variantFilters.length +
    (ownershipFilter !== "all" ? 1 : 0) +
    (sortKey !== "rarity" || sortOrder !== "desc" ? 1 : 0);

  const isLoading = loading || loadingUserTeachers || loadingGlobal;

  return (
    <BoneyardSkeleton name="teacher-album" loading={isLoading}>
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
                    <Button variant="outline" className="gap-2 shrink-0">
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
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-64 p-2 space-y-2">                  <div className="space-y-1">
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
                    <div className="grid grid-cols-6 gap-1 px-1">
                      {(
                        [
                          "iconic",
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

                  {availableSets.length > 1 && (
                    <>
                      <DropdownMenuSeparator />
                      <div className="space-y-1">
                        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest opacity-50 px-2 py-1">
                          Sets
                        </DropdownMenuLabel>
                        <div className="space-y-1 px-1 max-h-32 overflow-y-auto">
                          {availableSets.map((set) => (
                            <button
                              key={set.id}
                              onClick={() => toggleSet(set.id)}
                              className={cn(
                                "w-full text-left px-2 py-1.5 rounded-md text-xs transition-all",
                                setFilters.includes(set.id)
                                  ? "bg-primary/10 text-primary font-bold"
                                  : "text-muted-foreground hover:bg-muted",
                              )}
                            >
                              {set.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

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
              const teacherId = teacher.fullId;
              const isOwned = m.isOwned;

              return (
                <div
                  key={`${teacherId}-${idx}`}
                  className="flex flex-col items-center w-full mx-auto"
                >
                  <div
                    onClick={() => handleSelectCard(idx)}
                    className={cn(
                      "relative transition-all duration-300 transform group w-full aspect-[2.5/3.5] overflow-visible rounded-xl cursor-pointer",
                      !isOwned && "opacity-80",
                      isOwned &&
                        "hover:scale-[1.05] hover:-rotate-1 active:scale-95 hover:z-10 active:z-10",
                    )}
                  >
                    <CardRenderer
                      data={m.cardData}
                      className="w-full h-auto"
                      isFlippedExternally={isOwned}
                      isLocked={!isOwned}
                      interactive={false}
                    />
                  </div>

                  {isOwned && (
                    <div className="w-full mt-2 text-center">
                      <h3 className="font-black text-[9px] sm:text-[10px] uppercase tracking-tight line-clamp-1 opacity-80">
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

          <div ref={loadMoreSentinelRef} className="h-1" aria-hidden />

          {hasMoreTeachers && (
            <div className="flex justify-center pt-4">
              <p className="text-xs text-muted-foreground">
                Lade weitere Karten... ({displayedTeachers.length}/
                {filteredTeachers.length})
              </p>
            </div>
          )}
        </>
      )}
    </div>
    </BoneyardSkeleton>
  );
}

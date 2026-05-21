"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, BookOpen, Users, ArrowLeft, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface RatingItem {
  rating: number;
  tomeId: number;
  tomeNumero: number;
  tomeCoverImage: string | null;
  mangaId: number;
  mangaTitle: string;
  mangaCoverImage: string | null;
}

interface UserProgress {
  id: number;
  username: string;
  userlogo?: string | null;
  readCount: number;
  totalTomes: number;
  progress: number;
  averageRating: number | null;
  ratings: RatingItem[];
}

function MangaCover({ src, alt, className }: { src: string | null; alt: string; className?: string }) {
  const [error, setError] = useState(false);
  if (!src || error) {
    return (
      <div className={`bg-gradient-to-br from-[#CE6A6B] to-[#EBACA2] flex items-center justify-center ${className}`}>
        <BookOpen className="w-4 h-4 text-white/60" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={`object-cover ${className}`}
      onError={() => setError(true)}
    />
  );
}

function StarRating({ value }: { value: number }) {
  const full = Math.round(value);
  return (
    <div className="flex items-center space-x-0.5">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((s) => (
        <Star
          key={s}
          className={`w-2.5 h-2.5 ${s <= full ? "text-yellow-400 fill-current" : "text-white/20"}`}
        />
      ))}
      <span className="ml-1 text-xs text-white/70">{value.toFixed(1)}</span>
    </div>
  );
}

export default function CommunityPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUser, setExpandedUser] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/community/users");
      const data = await res.json();
      if (res.ok) {
        setUsers(data.data);
      } else {
        toast.error("Impossible de charger la communauté");
      }
    } catch {
      toast.error("Erreur de réseau");
    } finally {
      setLoading(false);
    }
  };

  const topReader = users.length > 0
    ? users.reduce((a, b) => (a.readCount > b.readCount ? a : b))
    : null;
  const topRater = users.length > 0
    ? users.filter((u) => u.averageRating !== null).reduce<UserProgress | null>(
        (a, b) => (!a || (b.averageRating ?? 0) > (a.averageRating ?? 0) ? b : a),
        null
      )
    : null;
  const totalReadings = users.reduce((s, u) => s + u.readCount, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#212E53] to-[#4A919E] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto" />
          <p className="mt-6 text-white text-lg font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#212E53] to-[#4A919E]">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10 p-2"
                onClick={() => router.push("/dashboard")}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#CE6A6B] to-[#EBACA2] rounded-full flex items-center justify-center">
                  <span className="text-white text-lg">🌸</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Communauté</h1>
                  <p className="text-white/50 text-xs">Progressions & notes</p>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10"
              onClick={() => router.push("/profile")}
            >
              Mon Profil
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats globales */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 flex items-center space-x-4">
            <div className="w-12 h-12 bg-[#4A919E]/30 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-[#4A919E]" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Membres</p>
              <p className="text-2xl font-bold text-white">{users.length}</p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 flex items-center space-x-4">
            <div className="w-12 h-12 bg-[#BED3C3]/20 rounded-full flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-[#BED3C3]" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Lectures totales</p>
              <p className="text-2xl font-bold text-white">{totalReadings}</p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 flex items-center space-x-4">
            <div className="w-12 h-12 bg-[#CE6A6B]/20 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-[#CE6A6B]" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Plus actif</p>
              <p className="text-lg font-bold text-white truncate max-w-[140px]">
                {topReader?.username ?? "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Liste des utilisateurs */}
        {users.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🌸</div>
            <h3 className="text-xl font-semibold text-white mb-2">Aucun membre pour l&apos;instant</h3>
            <p className="text-white/60">La communauté sera bientôt active !</p>
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((u, index) => {
              const isExpanded = expandedUser === u.id;
              const isTop = topReader?.id === u.id;
              const ratedMangas = u.ratings.reduce<{ [mangaId: number]: { title: string; cover: string | null; ratings: number[] } }>(
                (acc, r) => {
                  if (!acc[r.mangaId]) {
                    acc[r.mangaId] = { title: r.mangaTitle, cover: r.mangaCoverImage, ratings: [] };
                  }
                  acc[r.mangaId].ratings.push(r.rating);
                  return acc;
                },
                {}
              );

              return (
                <div
                  key={u.id}
                  className={`bg-white/10 backdrop-blur-md border rounded-xl overflow-hidden transition-all duration-300 ${
                    isTop ? "border-[#CE6A6B]/50" : "border-white/20"
                  }`}
                >
                  {/* Ligne principale */}
                  <div
                    className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => setExpandedUser(isExpanded ? null : u.id)}
                  >
                    <div className="flex items-center gap-4">
                      {/* Rang */}
                      <div className="w-8 text-center">
                        {index === 0 ? (
                          <span className="text-2xl">🥇</span>
                        ) : index === 1 ? (
                          <span className="text-2xl">🥈</span>
                        ) : index === 2 ? (
                          <span className="text-2xl">🥉</span>
                        ) : (
                          <span className="text-white/40 font-bold text-sm">#{index + 1}</span>
                        )}
                      </div>

                      {/* Avatar */}
                      <Avatar className="h-12 w-12 border-2 border-white/20 flex-shrink-0">
                        {u.userlogo ? (
                          <AvatarImage src={u.userlogo} />
                        ) : (
                          <AvatarFallback className="bg-gradient-to-br from-[#CE6A6B] to-[#EBACA2] text-white font-bold">
                            {u.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>

                      {/* Infos utilisateur */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white text-lg truncate">{u.username}</span>
                          {isTop && (
                            <Badge className="bg-[#CE6A6B]/20 text-[#CE6A6B] border-[#CE6A6B]/30 text-xs">
                              Top lecteur
                            </Badge>
                          )}
                          {topRater?.id === u.id && (
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                              Top noteur
                            </Badge>
                          )}
                        </div>

                        {/* Barre de progression */}
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 bg-white/10 h-2 rounded-full overflow-hidden max-w-xs">
                            <div
                              className="h-2 bg-gradient-to-r from-[#CE6A6B] to-[#EBACA2] rounded-full transition-all duration-500"
                              style={{ width: `${u.progress}%` }}
                            />
                          </div>
                          <span className="text-white/60 text-xs whitespace-nowrap">
                            {u.readCount}/{u.totalTomes} tomes ({u.progress}%)
                          </span>
                        </div>
                      </div>

                      {/* Note moyenne + aperçu des couvertures */}
                      <div className="flex items-center gap-4 flex-shrink-0">
                        {/* Mini couvertures top 5 mangas (meilleure note) */}
                        <div className="hidden md:flex -space-x-2">
                          {Object.values(ratedMangas)
                            .map((m) => ({
                              ...m,
                              avg: m.ratings.reduce((s, r) => s + r, 0) / m.ratings.length,
                            }))
                            .sort((a, b) => b.avg - a.avg)
                            .slice(0, 5)
                            .map((m, i) => (
                              <div
                                key={i}
                                className="w-8 h-10 rounded overflow-hidden border border-white/20"
                                title={`${m.title} — ${m.avg.toFixed(1)}/10`}
                              >
                                <MangaCover src={m.cover} alt={m.title} className="w-full h-full" />
                              </div>
                            ))}
                          {Object.keys(ratedMangas).length > 5 && (
                            <div className="w-8 h-10 rounded bg-white/10 border border-white/20 flex items-center justify-center">
                              <span className="text-white/60 text-xs font-bold">
                                +{Object.keys(ratedMangas).length - 5}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Note moyenne */}
                        {u.averageRating !== null && (
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-white font-semibold">
                              {u.averageRating.toFixed(1)}
                            </span>
                            <span className="text-white/40 text-sm">/10</span>
                          </div>
                        )}

                        {/* Chevron */}
                        <span className="text-white/40 text-sm transition-transform duration-200" style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>
                          ▼
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Section expandée : notes par manga */}
                  {isExpanded && (
                    <div className="border-t border-white/10 bg-white/5 p-4">
                      {Object.keys(ratedMangas).length === 0 ? (
                        <p className="text-white/50 text-sm text-center py-4">Aucune note pour l&apos;instant</p>
                      ) : (
                        <>
                          <h3 className="text-white/70 text-sm font-medium mb-3">
                            Mangas notés ({Object.keys(ratedMangas).length})
                          </h3>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            {Object.entries(ratedMangas)
                              .map(([mangaId, m]) => ({
                                mangaId,
                                ...m,
                                avg: m.ratings.reduce((s, r) => s + r, 0) / m.ratings.length,
                              }))
                              .sort((a, b) => b.avg - a.avg)
                              .map(({ mangaId, avg, ...m }) => {
                              return (
                                <div key={mangaId} className="flex flex-col items-center gap-2">
                                  <div className="w-full aspect-[2/3] rounded-lg overflow-hidden border border-white/20">
                                    <MangaCover src={m.cover} alt={m.title} className="w-full h-full" />
                                  </div>
                                  <div className="w-full text-center">
                                    <p className="text-white text-xs font-medium line-clamp-2 leading-tight mb-1">
                                      {m.title}
                                    </p>
                                    <StarRating value={avg} />
                                    <p className="text-white/40 text-xs mt-0.5">
                                      {m.ratings.length} tome{m.ratings.length > 1 ? "s" : ""}
                                    </p>
                                  </div>
                                </div>
                              );
                            })
                            }
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

import { useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useGameStore } from "../store/gameStore";
import { Cell } from "../types";

export function useMapCells() {
  const { setCells, updateCell, removeCell } = useGameStore();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // 초기 셀 로드 + 글로벌 Realtime 구독
  useEffect(() => {
    // 전체 셀 로드 (MVP에서는 전체 로드, 추후 viewport 기반으로 최적화)
    supabase
      .from("cells")
      .select("*")
      .limit(500)
      .then(({ data }) => {
        if (data) setCells(data as Cell[]);
      });

    // Realtime 구독
    const channel = supabase
      .channel("cells-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "cells" },
        (payload) => {
          updateCell(payload.new as Cell);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "cells" },
        (payload) => {
          updateCell(payload.new as Cell);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "cells" },
        (payload) => {
          removeCell((payload.old as Cell).h3_index);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, []);
}

import { useEffect, useRef } from "react";
import type { WsEvent } from "../types/wsEvents";
import { useTaskStore } from "../store/taskStore";
import { useListStore } from "../store/listStore";
import { useBoardStore } from "../store/boardStore";

const TASK_EVENTS = new Set([
  "TASK_CREATED",
  "TASK_UPDATED",
  "TASK_DELETED",
  "TASK_MOVED",
  "TASK_ASSIGNED",
  "TASK_UNASSIGNED",
]);
const LIST_EVENTS = new Set([
  "LIST_CREATED",
  "LIST_UPDATED",
  "LIST_DELETED",
  "LIST_REORDERED",
]);

const WS_URL =
  (import.meta.env.VITE_WS_URL as string | undefined) ?? "ws://localhost:3001";

export function useBoardSocket(boardId: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retries = useRef(0);
  const unmounted = useRef(false);

  useEffect(() => {
    unmounted.current = false;

    function connect() {
      if (unmounted.current) return;

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        retries.current = 0;
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "JOIN_BOARD", boardId }));
        }
      };

      ws.onmessage = (e) => {
        let event: WsEvent;
        try {
          event = JSON.parse(e.data as string) as WsEvent;
        } catch {
          return;
        }

        if (TASK_EVENTS.has(event.type)) {
          useTaskStore.getState().applyWsEvent(event);
        } else if (LIST_EVENTS.has(event.type)) {
          useListStore.getState().applyWsEvent(event);
        } else if (event.type === "BOARD_UPDATED") {
          useBoardStore.getState().applyWsEvent(event);
        }
      };

      ws.onclose = (e) => {
        if (unmounted.current) return;
        if (e.code === 1000) return;
        const delay = Math.min(1000 * 2 ** retries.current, 30_000);
        retries.current += 1;
        reconnectTimer.current = setTimeout(connect, delay);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      unmounted.current = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      const ws = wsRef.current;
      if (ws) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "LEAVE_BOARD", boardId }));
        }
        ws.close(1000, "Component unmounted");
      }
    };
  }, [boardId]);
}

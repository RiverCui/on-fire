import { useEffect, useRef } from "react";

export function useScrollToBottom<T>(items: T[], streaming: boolean) {
  const endRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);
  const prevStreamingRef = useRef(false);

  useEffect(() => {
    const grew = items.length > prevCountRef.current;
    const justStopped = prevStreamingRef.current && !streaming;

    if(grew || justStopped) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    prevCountRef.current = items.length;
    prevStreamingRef.current = streaming;
  }, [items.length, streaming])
  return endRef;
}
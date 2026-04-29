'use client';

import { useEffect, useRef, useReducer } from 'react';
import { SendHorizontal, Square } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

type Props = {
  onSend: (text: string) => void;
  onStop: () => void;
  streaming: boolean;
  disabled?: boolean;
};

type State = {
  value: string;  // textarea 当前内容
  history: string[];  // 已发过的消息（最新在末尾）
  historyIndex: number;  // -1 = 不在历史里；0...n-1 = 历史索引
};

type Action =
  | { type: 'TYPE', value: string }  // 用户打字
  | { type: 'SUBMIT' }  // 发送后调
  | { type: 'HISTORY_PREV' }  // 按 ↑
  | { type: 'HISTORY_NEXT' }  // 按 ↓

const initial: State = { value: '', history: [], historyIndex: -1 };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'TYPE':
      return { ...state, value: action.value, historyIndex: -1 };  // 用户打字：更新 value，退出历史模式（historyIndex 重置 -1）
    case 'SUBMIT':
      const trimmed = state.value.trim();
      if (!trimmed) return state;  // 空消息不处理
      return {
        ...state,
        history: [...state.history, trimmed],
        value: '',
        historyIndex: -1,
      };
    case 'HISTORY_PREV':
      if (state.history.length === 0) return state;
      if (state.historyIndex === 0) return state;
      const prevIndex = state.historyIndex < 0
        ? state.history.length - 1
        : state.historyIndex - 1;
      return {
        ...state,
        value: state.history[prevIndex],
        historyIndex: prevIndex,
      };
    case 'HISTORY_NEXT':
      if (state.historyIndex < 0) return state; // 还没开始历史模式，不处理
      const nextIndex = state.historyIndex >= state.history.length - 1
        ? -1
        : state.historyIndex + 1;
        return {
          ...state,
          value: nextIndex === -1 ? '' : state.history[nextIndex],
          historyIndex: nextIndex,
        };
    default:
      return state;
  }
}

export function ChatInput({ onSend, onStop, streaming, disabled }: Props) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const t = useTranslations('Chat');

  const [state, dispatch] = useReducer(reducer, initial);

  const submit = () => {
    const trimmed = state.value.trim();
    if (!trimmed || streaming || disabled) return;
    onSend(trimmed);
    dispatch({ type: 'SUBMIT' });
  };

  return (
    <div className="flex items-end gap-2 border-t border-slate-200/80 bg-white/60 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
      <textarea
        ref={inputRef}
        value={state.value}
        onChange={(e) => dispatch({ type: 'TYPE', value: e.target.value })}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            dispatch({ type: 'HISTORY_PREV' });
          }
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            dispatch({ type: 'HISTORY_NEXT' });
          }
        }}
        placeholder={t('placeholderInput')}
        rows={2}
        disabled={disabled}
        className="flex-1 resize-none rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none backdrop-blur-xl transition focus-visible:border-slate-400 focus-visible:ring-2 focus-visible:ring-slate-300 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40 dark:focus-visible:border-white/30 dark:focus-visible:ring-white/20"
      />
      {streaming ? (
        <Button
          type="button"
          variant="outline"
          onClick={onStop}
          className="border-slate-200/80 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
        >
          <Square className="mr-1 h-4 w-4" /> {t('stop')}
        </Button>
      ) : (
        <Button
          type="button"
          onClick={submit}
          disabled={!state.value.trim() || disabled}
          className="bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-white/90 dark:text-slate-900 dark:hover:bg-white"
        >
          <SendHorizontal className="mr-1 h-4 w-4" /> {t('send')}
        </Button>
      )}
    </div>
  );
}

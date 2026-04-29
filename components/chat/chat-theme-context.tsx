import { createContext } from "react";

export type ChatTheme = 'compact' | 'default';

export const ChatThemeContext = createContext<ChatTheme>('default');
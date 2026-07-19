import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface IframeAction {
  id: string;
  url: string;
  title: string;
  width?: number;
  height?: number;
  isMinimized?: boolean;
  backgroundColor?: string; 
}

interface AgentState {
  iframes: IframeAction[];
  activeIframeId: string | null;
  isChatOpen: boolean;
  agentPendingApproval: {
    message: string;
    actionType: string;
  } | null;
  scrapedContext: Record<string, string>;
  progressLogs: string[];
}

const initialState: AgentState = {
  iframes: [],
  activeIframeId: null,
  isChatOpen: false,
  agentPendingApproval: null,
  scrapedContext: {},
  progressLogs: [],
};

const agentSlice = createSlice({
  name: 'agent',
  initialState,
  reducers: {
    openIframe: (state, action: PayloadAction<Omit<IframeAction, 'id'> & { id?: string }>) => {
      const id = action.payload.id || `window-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newIframe = { 
        ...action.payload, 
        id,
        backgroundColor: action.payload.backgroundColor || '#0a0a0a' 
      };
      state.iframes.push(newIframe);
      state.activeIframeId = id;
    },
    closeIframe: (state, action: PayloadAction<string>) => {
      state.iframes = state.iframes.filter((f) => f.id !== action.payload);
      if (state.activeIframeId === action.payload) {
        state.activeIframeId = state.iframes.length > 0 ? state.iframes[state.iframes.length - 1].id : null;
      }
    },
    focusIframe: (state, action: PayloadAction<string>) => {
      state.activeIframeId = action.payload;
    },
    toggleMinimizeIframe: (state, action: PayloadAction<string>) => {
      const iframe = state.iframes.find((f) => f.id === action.payload);
      if (iframe) {
        iframe.isMinimized = !iframe.isMinimized;
        if (!iframe.isMinimized) {
          state.activeIframeId = action.payload;
        }
      }
    },
    toggleChat: (state) => {
      state.isChatOpen = !state.isChatOpen;
    },
    setPendingApproval: (
      state,
      action: PayloadAction<{ message: string; payload: any; actionType: string } | null>
    ) => {
      state.agentPendingApproval = action.payload;
    },
    clearAllIframes: (state) => {
      state.iframes = [];
      state.activeIframeId = null;
    },
    updateScrapedContext: (state, action: PayloadAction<{ url: string; data: string }>) => {
      state.scrapedContext[action.payload.url] = action.payload.data;
    },
    addProgressLog: (state, action: PayloadAction<string>) => {
      state.progressLogs.push(action.payload);
    },
    clearProgressLogs: (state) => {
      state.progressLogs = [];
    }
  },
});

export const {
  openIframe,
  closeIframe,
  focusIframe,
  toggleMinimizeIframe,
  toggleChat,
  setPendingApproval,
  clearAllIframes,
  updateScrapedContext,
  addProgressLog,
  clearProgressLogs,
} = agentSlice.actions;

export default agentSlice.reducer;
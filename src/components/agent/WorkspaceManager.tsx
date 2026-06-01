'use client';

import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { closeIframe, toggleMinimizeIframe, focusIframe } from '@/store/slices/agentSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Maximize2 } from 'lucide-react';

export default function WorkspaceManager() {
  const dispatch = useDispatch();
  const { iframes, activeIframeId } = useSelector((state: RootState) => state.agent);

  if (iframes.length === 0) return null;

  return (
    <>
      <AnimatePresence>
        {iframes.map((iframe, index) => {
          const isActive = activeIframeId === iframe.id;
          const staggerOffset = (index % 5) * 30; // 30px stagger

          return (
            <motion.div
              key={iframe.id}
              initial={{ opacity: 0, scale: 0.9, y: 100 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                y: iframe.isMinimized ? 'calc(100vh - 80px)' : 0,
                x: iframe.isMinimized ? (index * 220) - 200 : 0,
                zIndex: isActive ? 100 : 50 + index
              }}
              onMouseDown={() => dispatch(focusIframe(iframe.id))}
              exit={{ opacity: 0, scale: 0.9, y: 100 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              drag={!iframe.isMinimized}
              dragMomentum={false}
              className={`fixed overflow-hidden bg-[#0A0A0A] shadow-2xl flex flex-col border transition-all duration-200 ${
                isActive ? 'border-[#00CED1] ring-1 ring-[#00CED1]/30' : 'border-[#00CED1]/20'
              }`}
              style={{
                width: iframe.isMinimized ? '200px' : (iframe.width || 800) + 'px',
                height: iframe.isMinimized ? '50px' : (iframe.height || 600) + 'px',
                bottom: iframe.isMinimized ? '20px' : `calc(50vh - 300px + ${staggerOffset}px)`,
                left: iframe.isMinimized ? '20px' : `calc(50vw - 400px + ${staggerOffset}px)`,
              }}
            >
              {/* Window Header */}
              <div 
                className={`h-12 border-b flex items-center justify-between px-4 cursor-move ${
                  isActive ? 'bg-[#111111]' : 'bg-[#0A0A0A]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-[#00CED1] neon-glow-teal' : 'bg-gray-600'}`}></div>
                  <span className={`font-cairo text-sm font-bold max-w-[120px] truncate ${isActive ? 'text-white' : 'text-gray-400'}`}>
                    {iframe.title}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); dispatch(toggleMinimizeIframe(iframe.id)); }}
                    className="p-1 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                  >
                    {iframe.isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                  </button>
                  <button 
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); dispatch(closeIframe(iframe.id)); }}
                    className="p-1 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Iframe Content */}
              {!iframe.isMinimized && (
                <div className="flex-1 w-full bg-[#050505] relative">
                  <iframe 
                    src={`${iframe.url}${iframe.url.includes('?') ? '&' : '?'}copilot=true`}
                    className="w-full h-full border-none"
                    title={iframe.title}
                  />
                  {/* Overlay to catch mouse events when not active if needed, but standard iframe focus works */}
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </>
  );
}

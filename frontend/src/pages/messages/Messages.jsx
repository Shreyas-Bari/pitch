import React from 'react';
import ChatWorkspace from '../../components/chat/ChatWorkspace';

export function Messages() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold font-display text-slate-900 tracking-tight">
          Business Communication Workspace
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time sponsorship coordination, package discussions, and contact exchange.
        </p>
      </div>

      <ChatWorkspace basePath="/messages" />
    </div>
  );
}

export default Messages;

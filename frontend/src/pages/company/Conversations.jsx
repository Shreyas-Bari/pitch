import React from 'react';
import ChatWorkspace from '../../components/chat/ChatWorkspace';

export function CompanyConversations() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold font-display text-slate-900 tracking-tight">
          Sponsorship Messages
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Structured communication channels with campus fest organizers and student committees.
        </p>
      </div>

      <ChatWorkspace basePath="/company/conversations" />
    </div>
  );
}

export default CompanyConversations;

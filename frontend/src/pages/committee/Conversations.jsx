import React from 'react';
import ChatWorkspace from '../../components/chat/ChatWorkspace';

export function CommitteeConversations() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold font-display text-slate-900 tracking-tight">
          Brand Sponsor Messages
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Coordinate deliverables, share packages, and exchange contact details with corporate sponsors.
        </p>
      </div>

      <ChatWorkspace basePath="/committee/conversations" />
    </div>
  );
}

export default CommitteeConversations;

import React from 'react';
import DealWorkspace from '../../components/deals/DealWorkspace';

export function DealDetails() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <DealWorkspace basePath="/deals" />
    </div>
  );
}

export default DealDetails;

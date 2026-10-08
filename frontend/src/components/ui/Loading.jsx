import React from 'react';
import Spinner from './Spinner';

export function Loading({ size = 'md', color = 'primary', className = '' }) {
  return <Spinner size={size} color={color} className={className} />;
}

export default Loading;

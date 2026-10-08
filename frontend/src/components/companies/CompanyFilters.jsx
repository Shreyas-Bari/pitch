import React from 'react';
import { Search, RotateCcw, MapPin } from 'lucide-react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';

const INDUSTRIES = [
  { value: '', label: 'All Industries' },
  { value: 'Technology', label: 'Technology / Software' },
  { value: 'Beverage', label: 'Beverage / FMCG' },
  { value: 'Financial Services', label: 'FinTech / Banking' },
  { value: 'Education', label: 'Education / EdTech' },
  { value: 'E-commerce', label: 'E-commerce / Retail' },
  { value: 'Automotive', label: 'Automotive / EV' },
  { value: 'Media', label: 'Media & Entertainment' },
  { value: 'Fashion', label: 'Fashion & Apparel' },
];

export function CompanyFilters({
  filters,
  onChange,
  onReset,
  totalResults = null,
  className = '',
}) {
  const handleTextChange = (key, value) => {
    onChange({ ...filters, [key]: value, page: 1 });
  };

  const hasActiveFilters = Boolean(filters.search || filters.industry || filters.city);

  return (
    <div className={`bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4 ${className}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Search */}
        <div className="lg:col-span-2">
          <Input
            placeholder="Search brands, companies, industries, sponsorship keywords..."
            value={filters.search || ''}
            onChange={(e) => handleTextChange('search', e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            className="bg-slate-50 border-slate-200 text-sm focus:bg-white"
          />
        </div>

        {/* Industry */}
        <Select
          options={INDUSTRIES}
          value={filters.industry || ''}
          onChange={(e) => handleTextChange('industry', e.target.value)}
          className="text-xs"
        />
      </div>

      {/* Auxiliary Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-2 max-w-xs">
          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Filter by city (e.g. Bengaluru, Mumbai)..."
            value={filters.city || ''}
            onChange={(e) => handleTextChange('city', e.target.value)}
            className="w-full text-xs text-pitch-text placeholder:text-slate-400 bg-transparent focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3 ml-auto">
          {totalResults !== null && (
            <span className="text-pitch-muted font-medium">
              Showing <strong className="text-pitch-text">{totalResults}</strong> brand{totalResults === 1 ? '' : 's'}
            </span>
          )}

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              leftIcon={<RotateCcw className="w-3 h-3" />}
              className="text-xs text-pitch-muted hover:text-pitch-navy"
            >
              Reset Filters
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default CompanyFilters;

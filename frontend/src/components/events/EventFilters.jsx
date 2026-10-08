import React from 'react';
import { Search, Filter, RotateCcw, MapPin, Tag } from 'lucide-react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'Technical', label: 'Technical' },
  { value: 'Cultural', label: 'Cultural' },
  { value: 'Sports', label: 'Sports' },
  { value: 'Management', label: 'Management' },
  { value: 'Literary', label: 'Literary' },
  { value: 'Entrepreneurship', label: 'Entrepreneurship' },
  { value: 'Social Impact', label: 'Social Impact' },
  { value: 'Fine Arts', label: 'Fine Arts' },
  { value: 'Gaming / Esports', label: 'Gaming / Esports' },
];

const EVENT_TYPES = [
  { value: '', label: 'All Event Types' },
  { value: 'Festival', label: 'Festival' },
  { value: 'Hackathon', label: 'Hackathon' },
  { value: 'Competition', label: 'Competition' },
  { value: 'Conference', label: 'Conference' },
  { value: 'Conclave', label: 'Conclave' },
  { value: 'Workshop', label: 'Workshop' },
];

const LOCATION_MODES = [
  { value: '', label: 'Any Mode' },
  { value: 'PHYSICAL', label: 'On Campus (Physical)' },
  { value: 'ONLINE', label: 'Online / Virtual' },
  { value: 'HYBRID', label: 'Hybrid' },
];

const SORT_OPTIONS = [
  { value: 'eventDate:asc', label: 'Date: Upcoming First' },
  { value: 'eventDate:desc', label: 'Date: Furthest First' },
  { value: 'estimatedReach:desc', label: 'Reach: Highest First' },
  { value: 'createdAt:desc', label: 'Recently Listed' },
];

export function EventFilters({
  filters,
  onChange,
  onReset,
  totalResults = null,
  className = '',
}) {
  const handleTextChange = (key, value) => {
    onChange({ ...filters, [key]: value, page: 1 });
  };

  const handleSortChange = (combinedValue) => {
    const [sort, order] = combinedValue.split(':');
    onChange({ ...filters, sort, order, page: 1 });
  };

  const currentSort = `${filters.sort || 'eventDate'}:${filters.order || 'asc'}`;

  const hasActiveFilters = Boolean(
    filters.search ||
    filters.category ||
    filters.eventType ||
    filters.locationMode ||
    filters.city
  );

  return (
    <div className={`bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4 ${className}`}>
      {/* Search Input Bar */}
      <div className="relative">
        <Input
          placeholder="Search college fests, hackathons, categories, campus cities..."
          value={filters.search || ''}
          onChange={(e) => handleTextChange('search', e.target.value)}
          leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          className="bg-slate-50 border-slate-200 text-sm focus:bg-white"
        />
      </div>

      {/* Filters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Select
          options={CATEGORIES}
          value={filters.category || ''}
          onChange={(e) => handleTextChange('category', e.target.value)}
          className="text-xs"
        />

        <Select
          options={EVENT_TYPES}
          value={filters.eventType || ''}
          onChange={(e) => handleTextChange('eventType', e.target.value)}
          className="text-xs"
        />

        <Select
          options={LOCATION_MODES}
          value={filters.locationMode || ''}
          onChange={(e) => handleTextChange('locationMode', e.target.value)}
          className="text-xs"
        />

        <Select
          options={SORT_OPTIONS}
          value={currentSort}
          onChange={(e) => handleSortChange(e.target.value)}
          className="text-xs"
        />
      </div>

      {/* Auxiliary Row: City & Quick Reset */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-2 max-w-xs">
          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Filter by city (e.g. Mumbai, Delhi)..."
            value={filters.city || ''}
            onChange={(e) => handleTextChange('city', e.target.value)}
            className="w-full text-xs text-pitch-text placeholder:text-slate-400 bg-transparent focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3 ml-auto">
          {totalResults !== null && (
            <span className="text-pitch-muted font-medium">
              Showing <strong className="text-pitch-text">{totalResults}</strong> event{totalResults === 1 ? '' : 's'}
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

export default EventFilters;

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Calendar,
  ArrowLeft,
  Sparkles,
  MapPin,
  Users,
  Target,
  DollarSign,
  Gift,
  CheckCircle2,
  Building2
} from 'lucide-react';
import { eventService } from '../../services/eventService';
import { useToast } from '../../hooks/useToast';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Select from '../../components/ui/Select';

const CATEGORIES = [
  { value: 'Technical', label: 'Technical / Engineering' },
  { value: 'Cultural', label: 'Cultural / Arts' },
  { value: 'Sports', label: 'Sports & Athletics' },
  { value: 'Management', label: 'Management & Business' },
  { value: 'Literary', label: 'Literary & Debating' },
  { value: 'Entrepreneurship', label: 'Entrepreneurship / E-Cell' },
  { value: 'Social Impact', label: 'Social Impact / Outreach' },
  { value: 'Fine Arts', label: 'Fine Arts & Design' },
  { value: 'Gaming / Esports', label: 'Gaming & Esports' },
];

const EVENT_TYPES = [
  { value: 'Festival', label: 'Festival / Annual Fest' },
  { value: 'Hackathon', label: 'Hackathon' },
  { value: 'Competition', label: 'Competition / Contest' },
  { value: 'Conference', label: 'Academic Conference' },
  { value: 'Conclave', label: 'Leadership Conclave' },
  { value: 'Workshop', label: 'Interactive Workshop' },
];

const LOCATION_MODES = [
  { value: 'PHYSICAL', label: 'On Campus (Physical)' },
  { value: 'ONLINE', label: 'Virtual (Online)' },
  { value: 'HYBRID', label: 'Hybrid' },
];

const CONTRIBUTION_TYPES = ['CASH', 'IN_KIND', 'GOODIES', 'MENTORSHIP'];

const createEventSchema = z.object({
  title: z.string().min(3, 'Event title must be at least 3 characters'),
  category: z.string().min(1, 'Category is required'),
  eventType: z.string().min(1, 'Event type is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  locationMode: z.enum(['PHYSICAL', 'ONLINE', 'HYBRID']),
  venue: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  eventDate: z.string().min(1, 'Event start date is required'),
  endDate: z.string().optional(),
  expectedAudienceMin: z.coerce.number().min(0).optional(),
  expectedAudienceMax: z.coerce.number().min(1, 'Max audience must be at least 1'),
  estimatedReach: z.coerce.number().min(0).optional(),
  budgetMin: z.coerce.number().min(0).optional(),
  budgetMax: z.coerce.number().min(0).optional(),
});

export function CommitteeCreateEvent() {
  const navigate = useNavigate();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [selectedContributions, setSelectedContributions] = useState(['CASH']);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      category: 'Technical',
      eventType: 'Festival',
      locationMode: 'PHYSICAL',
      city: '',
      venue: 'Campus Grounds',
      expectedAudienceMin: 500,
      expectedAudienceMax: 2000,
      estimatedReach: 5000,
      budgetMin: 50000,
      budgetMax: 200000,
    },
  });

  const handleContributionToggle = (type) => {
    setSelectedContributions((prev) => {
      const set = new Set(prev);
      if (set.has(type)) {
        if (set.size > 1) set.delete(type);
      } else {
        set.add(type);
      }
      return Array.from(set);
    });
  };

  const onSubmit = async (values) => {
    try {
      setSubmitting(true);
      setServerError(null);

      const payload = {
        title: values.title.trim(),
        category: values.category,
        eventType: values.eventType,
        description: values.description.trim(),
        eventDate: new Date(values.eventDate).toISOString(),
        endDate: values.endDate ? new Date(values.endDate).toISOString() : undefined,
        location: {
          mode: values.locationMode,
          venue: values.venue?.trim() || 'Campus Grounds',
          city: values.city.trim(),
        },
        expectedAudience: {
          min: values.expectedAudienceMin || 0,
          max: values.expectedAudienceMax || 1000,
        },
        estimatedReach: values.estimatedReach || values.expectedAudienceMax,
        sponsorshipRequirements: {
          budgetMin: values.budgetMin || 0,
          budgetMax: values.budgetMax || 0,
          contributionTypes: selectedContributions,
        },
      };

      const res = await eventService.createEvent(payload);
      const createdEvent = res?.data?.event || res?.data;
      const eventId = createdEvent?._id || createdEvent?.id;

      toast.success('Campus event created in DRAFT mode! You can now add sponsorship packages.');
      if (eventId) {
        navigate(`/committee/events/${eventId}`);
      } else {
        navigate('/committee/events');
      }
    } catch (err) {
      const msg = err?.response?.data?.error?.message || err.message || 'Failed to create event';
      setServerError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <Link
          to="/committee/events"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-pitch-muted hover:text-pitch-navy transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to My Events</span>
        </Link>
        <h1 className="text-2xl font-extrabold text-pitch-navy font-display flex items-center gap-2">
          <Calendar className="w-6 h-6 text-pitch-blue" />
          <span>Publish New Campus Fest or Event</span>
        </h1>
        <p className="text-sm text-pitch-muted mt-1">
          Provide festival details, estimated student footfall, and sponsorship target tiers to attract brands.
        </p>
      </div>

      {serverError && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 leading-relaxed font-medium"
        >
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Core Event Overview */}
        <Card className="p-6 sm:p-8 border-slate-200 space-y-4">
          <h2 className="text-base font-bold font-display text-pitch-navy mb-2">
            Event Overview & Categorization
          </h2>

          <Input
            label="Event / Fest Title"
            placeholder="e.g. InnovateX 2026 Annual Hackathon"
            required
            error={errors.title?.message}
            {...register('title')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Primary Category"
              options={CATEGORIES}
              error={errors.category?.message}
              {...register('category')}
            />

            <Select
              label="Event Type"
              options={EVENT_TYPES}
              error={errors.eventType?.message}
              {...register('eventType')}
            />
          </div>

          <Textarea
            label="Event Description"
            rows={5}
            required
            placeholder="Describe the fest background, key competitions, pro-nights, guest speakers, and why brands should sponsor..."
            error={errors.description?.message}
            {...register('description')}
          />
        </Card>

        {/* Location & Dates */}
        <Card className="p-6 sm:p-8 border-slate-200 space-y-4">
          <h2 className="text-base font-bold font-display text-pitch-navy mb-2">
            Schedule & Location
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              required
              error={errors.eventDate?.message}
              {...register('eventDate')}
            />

            <Input
              label="End Date (Optional)"
              type="date"
              error={errors.endDate?.message}
              {...register('endDate')}
            />

            <Select
              label="Location Format"
              options={LOCATION_MODES}
              error={errors.locationMode?.message}
              {...register('locationMode')}
            />

            <Input
              label="Campus City"
              placeholder="e.g. Mumbai"
              required
              leftIcon={<MapPin className="w-4 h-4 text-slate-400" />}
              error={errors.city?.message}
              {...register('city')}
            />

            <div className="sm:col-span-2">
              <Input
                label="Venue Details"
                placeholder="e.g. Main Auditorium & Campus Sports Arena"
                error={errors.venue?.message}
                {...register('venue')}
              />
            </div>
          </div>
        </Card>

        {/* Audience Reach & Metrics */}
        <Card className="p-6 sm:p-8 border-slate-200 space-y-4">
          <h2 className="text-base font-bold font-display text-pitch-navy mb-2">
            Expected Audience & Footfall
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Expected Footfall (Min)"
              type="number"
              placeholder="500"
              error={errors.expectedAudienceMin?.message}
              {...register('expectedAudienceMin')}
            />

            <Input
              label="Expected Footfall (Max)"
              type="number"
              placeholder="2000"
              required
              error={errors.expectedAudienceMax?.message}
              {...register('expectedAudienceMax')}
            />

            <Input
              label="Estimated Total Reach"
              type="number"
              placeholder="5000"
              helperText="Campus + social impressions"
              error={errors.estimatedReach?.message}
              {...register('estimatedReach')}
            />
          </div>
        </Card>

        {/* Sponsorship Requirements */}
        <Card className="p-6 sm:p-8 border-slate-200 space-y-6">
          <div>
            <h2 className="text-base font-bold font-display text-pitch-navy">
              Sponsorship Requirements & Contribution Modes
            </h2>
            <p className="text-xs text-pitch-muted mt-1">
              Specify your expected sponsorship budget pool and the contribution formats your fest accepts.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Target Budget Pool (Min INR)"
              type="number"
              placeholder="50000"
              leftIcon={<DollarSign className="w-4 h-4 text-slate-400" />}
              error={errors.budgetMin?.message}
              {...register('budgetMin')}
            />

            <Input
              label="Target Budget Pool (Max INR)"
              type="number"
              placeholder="200000"
              leftIcon={<DollarSign className="w-4 h-4 text-slate-400" />}
              error={errors.budgetMax?.message}
              {...register('budgetMax')}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-pitch-muted mb-2">
              Accepted Contribution Types
            </label>
            <div className="flex flex-wrap gap-2">
              {CONTRIBUTION_TYPES.map((type) => {
                const isSelected = selectedContributions.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleContributionToggle(type)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-500 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    <span>{type}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link to="/committee/events">
            <Button variant="ghost" size="md">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={submitting}
          >
            Create Event (Draft)
          </Button>
        </div>
      </form>
    </div>
  );
}

export default CommitteeCreateEvent;

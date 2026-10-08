import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  Building2,
  ExternalLink,
  Save,
  Plus,
  Trash2,
  MapPin,
  Globe,
  Mail,
  Phone,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { companyService } from '../../services/companyService';
import { useToast } from '../../hooks/useToast';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import PageLoading from '../../components/ui/PageLoading';
import ErrorState from '../../components/ui/ErrorState';
import SelfReportedBadge from '../../components/common/SelfReportedBadge';

const INDUSTRIES = [
  { value: 'Technology', label: 'Technology / Software' },
  { value: 'Beverage', label: 'Beverage / FMCG' },
  { value: 'Financial Services', label: 'FinTech / Banking' },
  { value: 'Education', label: 'Education / EdTech' },
  { value: 'E-commerce', label: 'E-commerce / Retail' },
  { value: 'Automotive', label: 'Automotive / EV' },
  { value: 'Media', label: 'Media & Entertainment' },
  { value: 'Fashion', label: 'Fashion & Apparel' },
  { value: 'Healthcare', label: 'Healthcare & Wellness' },
  { value: 'Other', label: 'Other Sector' },
];

const AVAILABLE_CATEGORIES = [
  'Technical',
  'Cultural',
  'Sports',
  'Management',
  'Literary',
  'Entrepreneurship',
  'Social Impact',
  'Gaming / Esports',
];

const CONTRIBUTION_FORMATS = ['CASH', 'IN_KIND', 'GOODIES', 'MENTORSHIP'];

export function CompanyProfile() {
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Self-reported history creation state
  const [isAddingHistory, setIsAddingHistory] = useState(false);
  const [newHistory, setNewHistory] = useState({
    eventName: '',
    partnerName: '',
    title: '',
    description: '',
  });
  const [historySubmitting, setHistorySubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm();

  const selectedCategories = watch('eventCategories') || [];
  const selectedContributions = watch('contributionTypes') || [];

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [profRes, histRes] = await Promise.all([
        companyService.getMyProfile(),
        companyService.getMyHistory().catch(() => ({ data: [] })),
      ]);

      const companyData = profRes?.data?.company || profRes?.data;
      setProfile(companyData);

      const histData = Array.isArray(histRes?.data) ? histRes.data : histRes?.data?.history || [];
      setHistory(Array.isArray(histData) ? histData : []);

      if (companyData) {
        reset({
          name: companyData.name || '',
          industry: companyData.industry || 'Technology',
          description: companyData.description || '',
          website: companyData.website || '',
          city: companyData.location?.city || '',
          state: companyData.location?.state || '',
          country: companyData.location?.country || 'India',
          phone: companyData.contact?.phone || '',
          email: companyData.contact?.email || '',
          eventCategories: companyData.sponsorshipPreferences?.eventCategories || [],
          contributionTypes: companyData.sponsorshipPreferences?.contributionTypes || ['CASH'],
        });
      }
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message || 'Failed to load company profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCategoryToggle = (category) => {
    const current = new Set(selectedCategories);
    if (current.has(category)) {
      current.delete(category);
    } else {
      current.add(category);
    }
    setValue('eventCategories', Array.from(current));
  };

  const handleContributionToggle = (type) => {
    const current = new Set(selectedContributions);
    if (current.has(type)) {
      current.delete(type);
    } else {
      current.add(type);
    }
    setValue('contributionTypes', Array.from(current));
  };

  const onSubmit = async (values) => {
    try {
      setSaving(true);

      const payload = {
        name: values.name.trim(),
        industry: values.industry,
        description: values.description?.trim() || undefined,
        website: values.website?.trim() || undefined,
        location: {
          city: values.city?.trim() || undefined,
          state: values.state?.trim() || undefined,
          country: values.country?.trim() || 'India',
        },
        contact: {
          phone: values.phone?.trim() || undefined,
          email: values.email?.trim() || undefined,
        },
        sponsorshipPreferences: {
          eventCategories: values.eventCategories || [],
          contributionTypes: values.contributionTypes || ['CASH'],
        },
      };

      await companyService.updateMyProfile(payload);
      toast.success('Company profile updated successfully');
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || err.message || 'Failed to update company profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateHistory = async (e) => {
    e.preventDefault();
    if (!newHistory.eventName.trim()) {
      toast.error('Please enter the event name');
      return;
    }

    try {
      setHistorySubmitting(true);
      await companyService.createMyHistory({
        eventName: newHistory.eventName.trim(),
        partnerName: newHistory.partnerName?.trim() || undefined,
        title: newHistory.title?.trim() || newHistory.eventName.trim(),
        description: newHistory.description?.trim() || undefined,
      });
      toast.success('Self-reported sponsorship record added');
      setIsAddingHistory(false);
      setNewHistory({ eventName: '', partnerName: '', title: '', description: '' });
      const histRes = await companyService.getMyHistory();
      setHistory(Array.isArray(histRes?.data) ? histRes.data : histRes?.data?.history || []);
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || err.message || 'Failed to create history record');
    } finally {
      setHistorySubmitting(false);
    }
  };

  const handleDeleteHistory = async (id) => {
    try {
      await companyService.deleteMyHistory(id);
      toast.success('History record deleted');
      setHistory((prev) => prev.filter((item) => (item._id || item.id) !== id));
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || err.message || 'Failed to delete record');
    }
  };

  if (loading) {
    return <PageLoading message="Loading company profile..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to Load Profile"
        message={error}
        onRetry={loadData}
      />
    );
  }

  const companyId = profile?._id || profile?.id;

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-pitch-navy font-display flex items-center gap-2">
            <Building2 className="w-6 h-6 text-pitch-blue" />
            <span>Company Profile Management</span>
          </h1>
          <p className="text-sm text-pitch-muted mt-1">
            Update your public brand information, target student demographics, and sponsorship preferences.
          </p>
        </div>
        {companyId && (
          <Link
            to={`/companies/${companyId}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl text-pitch-blue bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-200"
          >
            <span>Preview Public Profile</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Core Identity */}
        <Card className="p-6 sm:p-8 border-slate-200">
          <h2 className="text-lg font-bold font-display text-pitch-navy mb-4">
            Brand Identity & Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Company / Brand Name"
              placeholder="e.g. Red Bull India"
              required
              error={errors.name?.message}
              {...register('name', { required: 'Company name is required' })}
            />

            <Select
              label="Industry Sector"
              options={INDUSTRIES}
              error={errors.industry?.message}
              {...register('industry')}
            />

            <div className="md:col-span-2">
              <Textarea
                label="Company Overview"
                rows={4}
                placeholder="Briefly describe your company, brand ethos, and goals for campus engagements..."
                {...register('description')}
              />
            </div>

            <Input
              label="Official Website"
              placeholder="https://brand.com"
              leftIcon={<Globe className="w-4 h-4 text-slate-400" />}
              {...register('website')}
            />

            <Input
              label="Headquarters City"
              placeholder="Mumbai"
              leftIcon={<MapPin className="w-4 h-4 text-slate-400" />}
              {...register('city')}
            />

            <Input
              label="State / Province"
              placeholder="Maharashtra"
              {...register('state')}
            />

            <Input
              label="Country"
              placeholder="India"
              {...register('country')}
            />
          </div>
        </Card>

        {/* Sponsorship Interests & Preferences */}
        <Card className="p-6 sm:p-8 border-slate-200 space-y-6">
          <div>
            <h2 className="text-lg font-bold font-display text-pitch-navy">
              Sponsorship Interests & Contribution Modes
            </h2>
            <p className="text-xs text-pitch-muted mt-1">
              Student committees search by these dimensions to invite relevant sponsors.
            </p>
          </div>

          {/* Event Categories */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-pitch-muted mb-2">
              Target Campus Fest Categories
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_CATEGORIES.map((cat) => {
                const isSelected = selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryToggle(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      isSelected
                        ? 'bg-blue-50 text-pitch-blue border-pitch-blue shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contribution Types */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-pitch-muted mb-2">
              Preferred Contribution Types
            </label>
            <div className="flex flex-wrap gap-2">
              {CONTRIBUTION_FORMATS.map((type) => {
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

        {/* Save Button Bar */}
        <div className="flex items-center justify-end">
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={saving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Profile Changes
          </Button>
        </div>
      </form>

      {/* External Self-Reported History Section */}
      <Card className="p-6 sm:p-8 border-slate-200 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold font-display text-pitch-navy">
                External Self-Reported Sponsorship History
              </h2>
              <SelfReportedBadge />
            </div>
            <p className="text-xs text-pitch-muted mt-1 leading-relaxed">
              Showcase past campus events sponsored prior to joining PITCH. Per platform governance, external records are strictly labeled as SELF-REPORTED and do not count toward official PITCH reputation scores.
            </p>
          </div>

          {!isAddingHistory && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsAddingHistory(true)}
            >
              Add Past Sponsorship
            </Button>
          )}
        </div>

        {/* Add History Form */}
        {isAddingHistory && (
          <form
            onSubmit={handleCreateHistory}
            className="p-5 rounded-2xl border border-blue-200 bg-blue-50/30 space-y-4"
          >
            <h3 className="text-sm font-bold text-pitch-navy">
              Add External Sponsorship Entry
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Event / Fest Name"
                placeholder="e.g. Techfest 2024"
                required
                value={newHistory.eventName}
                onChange={(e) => setNewHistory({ ...newHistory, eventName: e.target.value })}
              />

              <Input
                label="College / Partner Organization"
                placeholder="e.g. IIT Bombay"
                value={newHistory.partnerName}
                onChange={(e) => setNewHistory({ ...newHistory, partnerName: e.target.value })}
              />

              <div className="sm:col-span-2">
                <Textarea
                  label="Description / Deliverable Notes"
                  rows={2}
                  placeholder="e.g. Title sponsor for hackathon track, provided product goodies and prize money..."
                  value={newHistory.description}
                  onChange={(e) => setNewHistory({ ...newHistory, description: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsAddingHistory(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={historySubmitting}
              >
                Add Record
              </Button>
            </div>
          </form>
        )}

        {/* Existing History List */}
        {history.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400 italic">
            No external sponsorships added. Click "Add Past Sponsorship" to showcase prior brand campus engagements.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {history.map((item) => (
              <div
                key={item._id || item.id}
                className="py-3.5 flex items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-pitch-navy">
                      {item.eventName || item.title}
                    </h4>
                    <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      SELF-REPORTED
                    </span>
                  </div>
                  <p className="text-xs text-pitch-muted mt-0.5">
                    {item.partnerName || 'Campus Partner'}
                  </p>
                  {item.description && (
                    <p className="text-xs text-slate-600 mt-1 italic">
                      "{item.description}"
                    </p>
                  )}
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:bg-red-50"
                  onClick={() => handleDeleteHistory(item._id || item.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export default CompanyProfile;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  GraduationCap,
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
  Building
} from 'lucide-react';
import { committeeService } from '../../services/committeeService';
import { useToast } from '../../hooks/useToast';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Select from '../../components/ui/Select';
import PageLoading from '../../components/ui/PageLoading';
import ErrorState from '../../components/ui/ErrorState';
import SelfReportedBadge from '../../components/common/SelfReportedBadge';

const COMMITTEE_TYPES = [
  { value: 'Cultural', label: 'Cultural Committee / Board' },
  { value: 'Technical', label: 'Technical Board / Robotics Club' },
  { value: 'Sports', label: 'Sports Council / Committee' },
  { value: 'E-Cell', label: 'Entrepreneurship Cell (E-Cell)' },
  { value: 'Management', label: 'Management / Fest Organizing Body' },
  { value: 'Literary', label: 'Literary / Debating Society' },
  { value: 'Social Impact', label: 'Social Outreach / NSS' },
  { value: 'Fine Arts', label: 'Fine Arts / Design Club' },
];

export function CommitteeProfile() {
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Self-reported fest history state
  const [isAddingHistory, setIsAddingHistory] = useState(false);
  const [newHistory, setNewHistory] = useState({
    eventName: '',
    year: '',
    footfall: '',
    sponsorName: '',
    description: '',
  });
  const [historySubmitting, setHistorySubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [profRes, histRes] = await Promise.all([
        committeeService.getMyProfile(),
        committeeService.getMyHistory().catch(() => ({ data: [] })),
      ]);

      const committeeData = profRes?.data?.committee || profRes?.data;
      setProfile(committeeData);

      const histData = Array.isArray(histRes?.data) ? histRes.data : histRes?.data?.history || [];
      setHistory(Array.isArray(histData) ? histData : []);

      if (committeeData) {
        reset({
          name: committeeData.name || '',
          committeeType: committeeData.committeeType || 'Cultural',
          description: committeeData.description || '',
          collegeName: committeeData.college?.name || '',
          city: committeeData.college?.location?.city || '',
          state: committeeData.college?.location?.state || '',
          country: committeeData.college?.location?.country || 'India',
          website: committeeData.website || '',
          phone: committeeData.contact?.phone || '',
          email: committeeData.contact?.email || '',
        });
      }
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message || 'Failed to load committee profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onSubmit = async (values) => {
    try {
      setSaving(true);

      const payload = {
        name: values.name.trim(),
        committeeType: values.committeeType,
        description: values.description?.trim() || undefined,
        college: {
          name: values.collegeName.trim(),
          location: {
            city: values.city?.trim() || undefined,
            state: values.state?.trim() || undefined,
            country: values.country?.trim() || 'India',
          },
        },
        website: values.website?.trim() || undefined,
        contact: {
          phone: values.phone?.trim() || undefined,
          email: values.email?.trim() || undefined,
        },
      };

      await committeeService.updateMyProfile(payload);
      toast.success('Committee profile updated successfully');
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || err.message || 'Failed to update committee profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateHistory = async (e) => {
    e.preventDefault();
    if (!newHistory.eventName.trim()) {
      toast.error('Please enter the event / fest name');
      return;
    }

    try {
      setHistorySubmitting(true);
      await committeeService.createMyHistory({
        eventName: newHistory.eventName.trim(),
        title: newHistory.eventName.trim(),
        year: newHistory.year ? Number(newHistory.year) : undefined,
        footfall: newHistory.footfall ? Number(newHistory.footfall) : undefined,
        sponsorName: newHistory.sponsorName?.trim() || undefined,
        description: newHistory.description?.trim() || undefined,
      });
      toast.success('Self-reported historical fest record added');
      setIsAddingHistory(false);
      setNewHistory({ eventName: '', year: '', footfall: '', sponsorName: '', description: '' });
      const histRes = await committeeService.getMyHistory();
      setHistory(Array.isArray(histRes?.data) ? histRes.data : histRes?.data?.history || []);
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || err.message || 'Failed to create record');
    } finally {
      setHistorySubmitting(false);
    }
  };

  const handleDeleteHistory = async (id) => {
    try {
      await committeeService.deleteMyHistory(id);
      toast.success('History record deleted');
      setHistory((prev) => prev.filter((item) => (item._id || item.id) !== id));
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || err.message || 'Failed to delete record');
    }
  };

  if (loading) {
    return <PageLoading message="Loading committee profile..." />;
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

  const committeeId = profile?._id || profile?.id;

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-pitch-navy font-display flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-pitch-blue" />
            <span>Committee Profile Management</span>
          </h1>
          <p className="text-sm text-pitch-muted mt-1">
            Maintain your college affiliation, committee classification, and historical fest achievements.
          </p>
        </div>
        {committeeId && (
          <Link
            to={`/committees/${committeeId}`}
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
            Committee Identity & Campus Context
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Committee / Club Name"
              placeholder="e.g. Cultural Council"
              required
              error={errors.name?.message}
              {...register('name', { required: 'Committee name is required' })}
            />

            <Select
              label="Committee Type"
              options={COMMITTEE_TYPES}
              error={errors.committeeType?.message}
              {...register('committeeType')}
            />

            <Input
              label="Affiliated College / University Name"
              placeholder="e.g. IIT Bombay"
              required
              error={errors.collegeName?.message}
              {...register('collegeName', { required: 'College name is required' })}
            />

            <Input
              label="Campus City"
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

            <div className="md:col-span-2">
              <Textarea
                label="Committee Description"
                rows={4}
                placeholder="Describe your student body, annual events, campus reach, and legacy..."
                {...register('description')}
              />
            </div>

            <Input
              label="Campus / Committee Website"
              placeholder="https://fest.college.ac.in"
              leftIcon={<Globe className="w-4 h-4 text-slate-400" />}
              {...register('website')}
            />

            <Input
              label="Official Contact Phone"
              placeholder="+91 9876543210"
              leftIcon={<Phone className="w-4 h-4 text-slate-400" />}
              {...register('phone')}
            />
          </div>
        </Card>

        {/* Save Bar */}
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

      {/* External Historical Fest Portfolio Section */}
      <Card className="p-6 sm:p-8 border-slate-200 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold font-display text-pitch-navy">
                Historical Fests & Campus Track Record
              </h2>
              <SelfReportedBadge />
            </div>
            <p className="text-xs text-pitch-muted mt-1 leading-relaxed">
              Showcase past fest editions organized by your committee prior to PITCH. Per platform governance, external records are strictly labeled as SELF-REPORTED and do not count toward official PITCH reputation scores.
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
              Add Past Fest Edition
            </Button>
          )}
        </div>

        {/* Add Form */}
        {isAddingHistory && (
          <form
            onSubmit={handleCreateHistory}
            className="p-5 rounded-2xl border border-blue-200 bg-blue-50/30 space-y-4"
          >
            <h3 className="text-sm font-bold text-pitch-navy">
              Add Historical Fest Edition
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Fest / Event Name"
                placeholder="e.g. Mood Indigo 2024"
                required
                value={newHistory.eventName}
                onChange={(e) => setNewHistory({ ...newHistory, eventName: e.target.value })}
              />

              <Input
                label="Year / Edition"
                type="number"
                placeholder="2024"
                value={newHistory.year}
                onChange={(e) => setNewHistory({ ...newHistory, year: e.target.value })}
              />

              <Input
                label="Estimated Student Footfall"
                type="number"
                placeholder="25000"
                value={newHistory.footfall}
                onChange={(e) => setNewHistory({ ...newHistory, footfall: e.target.value })}
              />

              <Input
                label="Key Past Corporate Sponsor"
                placeholder="e.g. Red Bull India"
                value={newHistory.sponsorName}
                onChange={(e) => setNewHistory({ ...newHistory, sponsorName: e.target.value })}
              />

              <div className="sm:col-span-2">
                <Textarea
                  label="Description / Event Highlights"
                  rows={2}
                  placeholder="e.g. Three-day national cultural festival featuring 40+ competitions..."
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
                Add Historical Record
              </Button>
            </div>
          </form>
        )}

        {/* List */}
        {history.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400 italic">
            No historical fests added. Click "Add Past Fest Edition" to showcase prior editions of your campus festivals.
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
                    {item.year && `Edition: ${item.year}`}
                    {item.footfall && ` • Footfall: ${Number(item.footfall).toLocaleString()}`}
                    {item.sponsorName && ` • Past Sponsor: ${item.sponsorName}`}
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

export default CommitteeProfile;

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  ArrowLeft,
  Edit,
  Globe,
  Plus,
  Trash2,
  Users,
  DollarSign,
  Package,
  Inbox,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Eye,
  Check,
  X
} from 'lucide-react';
import { eventService } from '../../services/eventService';
import { packageService } from '../../services/packageService';
import { applicationService } from '../../services/applicationService';
import { formatDate } from '../../utils/formatDate';
import { formatCurrency } from '../../utils/formatCurrency';
import { useToast } from '../../hooks/useToast';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Dialog, { DialogFooter } from '../../components/ui/Dialog';
import PageLoading from '../../components/ui/PageLoading';
import ErrorState from '../../components/ui/ErrorState';
import ConfirmationDialog from '../../components/ui/ConfirmationDialog';

const CONTRIBUTION_TYPES = ['CASH', 'IN_KIND', 'GOODIES', 'MENTORSHIP'];

export function CommitteeEventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [event, setEvent] = useState(null);
  const [packages, setPackages] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('PACKAGES');
  const [actionLoading, setActionLoading] = useState(false);

  // Package creation modal state
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [packageFormData, setPackageFormData] = useState({
    title: '',
    description: '',
    cashAmount: '',
    contributionTypes: ['CASH'],
    benefitsText: '',
    availability: 1,
  });
  const [savingPackage, setSavingPackage] = useState(false);
  const [deletePackageId, setDeletePackageId] = useState(null);
  const [deletingPackage, setDeletingPackage] = useState(false);

  const loadAllEventData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);

      const [eventRes, pkgRes, appRes] = await Promise.allSettled([
        eventService.getEvent(id),
        packageService.getPackagesByEvent(id),
        applicationService.getEventApplications(id).catch(() => ({ data: [] })),
      ]);

      if (eventRes.status === 'fulfilled') {
        const evData = eventRes.value?.data?.event || eventRes.value?.data;
        if (!evData) {
          setError('Event not found.');
          return;
        }
        setEvent(evData);
      } else {
        setError(eventRes.reason?.message || 'Failed to load event details.');
        return;
      }

      if (pkgRes.status === 'fulfilled') {
        const pList = Array.isArray(pkgRes.value?.data) ? pkgRes.value.data : [];
        setPackages(pList);
      }

      if (appRes.status === 'fulfilled') {
        const aList = Array.isArray(appRes.value?.data) ? appRes.value.data : appRes.value?.applications || [];
        setApplications(Array.isArray(aList) ? aList : []);
      }
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message || 'Failed to load event data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllEventData();
  }, [id]);

  const handlePublishToggle = async () => {
    if (!event) return;
    try {
      setActionLoading(true);
      if (event.status === 'DRAFT') {
        await eventService.publishEvent(id);
        toast.success('Event is now PUBLISHED and visible on the public marketplace!');
      } else {
        await eventService.unpublishEvent(id);
        toast.success('Event reverted to DRAFT status.');
      }
      loadAllEventData();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || err.message || 'Failed to update event status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreatePackage = async (e) => {
    e.preventDefault();
    if (!packageFormData.title.trim()) {
      toast.error('Please enter a package title');
      return;
    }

    try {
      setSavingPackage(true);
      const benefits = packageFormData.benefitsText
        .split('\n')
        .map((b) => b.trim())
        .filter(Boolean);

      const payload = {
        title: packageFormData.title.trim(),
        description: packageFormData.description?.trim() || undefined,
        contributionTypes: packageFormData.contributionTypes,
        cashRequirement: packageFormData.cashAmount
          ? { amount: Number(packageFormData.cashAmount) }
          : undefined,
        benefits,
        availability: Number(packageFormData.availability) || 1,
        status: 'ACTIVE',
      };

      await packageService.createPackage(id, payload);
      toast.success('Sponsorship package tier created successfully!');
      setIsPackageModalOpen(false);
      setPackageFormData({
        title: '',
        description: '',
        cashAmount: '',
        contributionTypes: ['CASH'],
        benefitsText: '',
        availability: 1,
      });

      const res = await packageService.getPackagesByEvent(id);
      setPackages(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || err.message || 'Failed to create package');
    } finally {
      setSavingPackage(false);
    }
  };

  const handleDeletePackageConfirm = async () => {
    if (!deletePackageId) return;
    try {
      setDeletingPackage(true);
      await packageService.deletePackage(deletePackageId);
      toast.success('Package tier deleted successfully');
      setDeletePackageId(null);
      const res = await packageService.getPackagesByEvent(id);
      setPackages(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || err.message || 'Failed to delete package');
    } finally {
      setDeletingPackage(false);
    }
  };

  const handleAcceptApplication = async (appId) => {
    try {
      await applicationService.acceptApplication(appId);
      toast.success('Application accepted! You can now proceed to communication and MoU generation.');
      loadAllEventData();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || err.message || 'Failed to accept application');
    }
  };

  const handleRejectApplication = async (appId) => {
    try {
      await applicationService.rejectApplication(appId);
      toast.success('Application rejected.');
      loadAllEventData();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || err.message || 'Failed to reject application');
    }
  };

  if (loading) {
    return <PageLoading message="Loading event workspace..." />;
  }

  if (error || !event) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <ErrorState
          title="Event Not Found"
          message={error || 'Unable to load event details.'}
          action={
            <Link to="/committee/events">
              <Button variant="primary">Back to Events</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header */}
      <div className="pb-4 border-b border-slate-200">
        <Link
          to="/committee/events"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-pitch-muted hover:text-pitch-navy transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to My Events</span>
        </Link>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-extrabold text-pitch-navy font-display">
                {event.title}
              </h1>
              <Badge variant={event.status === 'PUBLISHED' ? 'success' : 'warning'}>
                {event.status === 'PUBLISHED' ? 'Live on Marketplace' : 'Draft Mode'}
              </Badge>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">
                {event.category || 'Festival'}
              </span>
            </div>
            <p className="text-xs text-pitch-muted mt-1">
              Date: {formatDate(event.eventDate || event.startDate)} • Mode: {event.location?.mode || 'PHYSICAL'} • Campus: {event.location?.city || 'India'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link to={`/events/${id}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}>
                Public View
              </Button>
            </Link>

            <Link to={`/committee/events/${id}/edit`}>
              <Button variant="outline" size="sm" leftIcon={<Edit className="w-3.5 h-3.5" />}>
                Edit Details
              </Button>
            </Link>

            <Button
              variant={event.status === 'DRAFT' ? 'primary' : 'outline'}
              size="sm"
              isLoading={actionLoading}
              onClick={handlePublishToggle}
            >
              {event.status === 'DRAFT' ? 'Publish Event' : 'Unpublish Event'}
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('PACKAGES')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'PACKAGES'
              ? 'bg-pitch-surface-1 text-pitch-blue border border-pitch-blue shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Sponsorship Packages ({packages.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('APPLICATIONS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'APPLICATIONS'
              ? 'bg-pitch-surface-1 text-pitch-blue border border-pitch-blue shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Inbox className="w-4 h-4" />
          <span>Applications Received ({applications.length})</span>
        </button>
      </div>

      {/* Tab 1: Sponsorship Packages Management */}
      {activeTab === 'PACKAGES' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-pitch-navy">
                Sponsorship Package Tiers
              </h2>
              <p className="text-xs text-pitch-muted mt-0.5">
                Define deliverable packages (e.g. Title, Co-sponsor, Stall partner) for prospective brand sponsors.
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsPackageModalOpen(true)}
            >
              Add Package Tier
            </Button>
          </div>

          {packages.length === 0 ? (
            <Card className="text-center py-12 border-dashed border-slate-300">
              <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-pitch-navy">No Sponsorship Packages Created</h3>
              <p className="text-xs text-pitch-muted max-w-sm mx-auto mt-1 mb-4">
                Packages give corporate sponsors clarity on pricing, stall space, and branding deliverables.
              </p>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => setIsPackageModalOpen(true)}
              >
                Create First Package Tier
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages.map((pkg) => (
                <Card key={pkg._id || pkg.id} className="p-5 border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-bold text-base text-pitch-navy">
                        {pkg.title}
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:bg-red-50 p-1"
                        onClick={() => setDeletePackageId(pkg._id || pkg.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="text-lg font-extrabold text-pitch-blue mb-2">
                      {pkg.cashRequirement?.amount
                        ? formatCurrency(pkg.cashRequirement.amount)
                        : 'Custom / In-Kind'}
                    </div>

                    {pkg.description && (
                      <p className="text-xs text-slate-600 mb-3 line-clamp-2">
                        {pkg.description}
                      </p>
                    )}

                    {pkg.benefits && pkg.benefits.length > 0 && (
                      <div className="space-y-1 mb-3 pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-pitch-muted block">
                          Included Deliverables:
                        </span>
                        {pkg.benefits.slice(0, 3).map((b, i) => (
                          <div key={i} className="text-xs text-slate-700 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate">{b}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="text-[11px] text-pitch-muted pt-2 border-t border-slate-100 flex justify-between">
                    <span>Available Spots: {pkg.availability ?? 1}</span>
                    <span className="font-semibold text-emerald-700">{pkg.status || 'ACTIVE'}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Applications Received for This Event */}
      {activeTab === 'APPLICATIONS' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-bold text-pitch-navy">
              Applications for this Event
            </h2>
            <p className="text-xs text-pitch-muted mt-0.5">
              Review incoming brand pitches for this specific campus event.
            </p>
          </div>

          {applications.length === 0 ? (
            <Card className="text-center py-12 border-dashed border-slate-300">
              <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-pitch-muted">
                No sponsorship applications received for this festival yet.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => {
                const company = app.companyId || {};
                const isPending = app.status === 'PENDING';

                return (
                  <Card key={app._id} className="p-5 border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-base text-pitch-navy">
                          {company.name || 'Brand Partner'}
                        </h4>
                        <Badge variant={app.status === 'ACCEPTED' ? 'success' : app.status === 'REJECTED' ? 'danger' : 'warning'}>
                          {app.status || 'PENDING'}
                        </Badge>
                      </div>

                      <p className="text-xs text-slate-600">
                        Package: <span className="font-semibold">{app.packageId?.title || 'Custom Pitch'}</span> • Submitted {formatDate(app.createdAt)}
                      </p>

                      {app.message && (
                        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-700 italic max-w-xl">
                          "{app.message}"
                        </div>
                      )}
                    </div>

                    {isPending && (
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="primary"
                          size="sm"
                          leftIcon={<Check className="w-4 h-4" />}
                          onClick={() => handleAcceptApplication(app._id)}
                        >
                          Accept
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<X className="w-4 h-4" />}
                          onClick={() => handleRejectApplication(app._id)}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Package Creation Dialog */}
      <Dialog
        isOpen={isPackageModalOpen}
        onClose={() => setIsPackageModalOpen(false)}
        title="Create Sponsorship Package Tier"
        description="Define a sponsorship package tier for your campus festival. Packages represent initial offers, not final contracts."
      >
        <form onSubmit={handleCreatePackage} className="space-y-4">
          <Input
            label="Tier Name / Title"
            placeholder="e.g. Title Sponsor or Gold Tier"
            required
            value={packageFormData.title}
            onChange={(e) => setPackageFormData({ ...packageFormData, title: e.target.value })}
          />

          <Input
            label="Cash Amount (INR)"
            type="number"
            placeholder="e.g. 75000"
            leftIcon={<DollarSign className="w-4 h-4 text-slate-400" />}
            value={packageFormData.cashAmount}
            onChange={(e) => setPackageFormData({ ...packageFormData, cashAmount: e.target.value })}
          />

          <Input
            label="Available Sponsorship Spots"
            type="number"
            placeholder="1"
            value={packageFormData.availability}
            onChange={(e) => setPackageFormData({ ...packageFormData, availability: e.target.value })}
          />

          <Textarea
            label="Deliverables & Benefits (one per line)"
            rows={4}
            placeholder={`Logo on main festival banner\n20x20 promotional campus booth\nSocial media shoutout on official fest handle\nVIP passes for pro-night`}
            value={packageFormData.benefitsText}
            onChange={(e) => setPackageFormData({ ...packageFormData, benefitsText: e.target.value })}
          />

          <Textarea
            label="Tier Description (Optional)"
            rows={2}
            placeholder="Briefly summarize what this sponsorship tier enables for the brand..."
            value={packageFormData.description}
            onChange={(e) => setPackageFormData({ ...packageFormData, description: e.target.value })}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsPackageModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={savingPackage}
            >
              Create Package Tier
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Delete Package Confirmation */}
      {deletePackageId && (
        <ConfirmationDialog
          isOpen={Boolean(deletePackageId)}
          onClose={() => setDeletePackageId(null)}
          onConfirm={handleDeletePackageConfirm}
          title="Delete Package Tier?"
          message="Are you sure you want to delete this sponsorship tier? Existing applicants will remain unchanged."
          confirmLabel="Yes, Delete"
          cancelLabel="Cancel"
          variant="danger"
          isLoading={deletingPackage}
        />
      )}
    </div>
  );
}

export default CommitteeEventDetails;

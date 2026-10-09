import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  FileSignature,
  PenTool,
  Download,
  ShieldCheck,
  History,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { mouService } from '../../services/mouService';

import MouViewer from '../../components/mou/MouViewer';
import MouSigningModal from '../../components/mou/MouSigningModal';
import SignatureStatus from '../../components/mou/SignatureStatus';
import Button from '../../components/ui/Button';
import PageLoading from '../../components/ui/PageLoading';
import ErrorState from '../../components/ui/ErrorState';
import { formatDate } from '../../utils/formatDate';

export function MouDetails() {
  const { id: mouId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const currentUserId = user?._id || user?.id;
  const userRole = user?.role;

  const [mou, setMou] = useState(null);
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [signingModalOpen, setSigningModalOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const fetchMouData = useCallback(async () => {
    if (!mouId) return;
    try {
      setLoading(true);
      setError(null);

      const res = await mouService.getMou(mouId);
      const m = res?.data?.mou || (res?.data?._id ? res.data : null) || res?.mou || res;
      setMou(m);

      // Fetch versions
      try {
        const vRes = await mouService.getVersions(mouId);
        const vList = Array.isArray(vRes?.data)
          ? vRes.data
          : (Array.isArray(vRes?.data?.versions)
            ? vRes.data.versions
            : (Array.isArray(vRes?.versions) ? vRes.versions : (Array.isArray(vRes) ? vRes : [])));
        setVersions(vList);
        setSelectedVersion(m?.currentVersionId || vList[0] || null);
      } catch {
        setSelectedVersion(m?.currentVersionId || null);
      }
    } catch (err) {
      const status = err.response?.status;
      if (status === 403) {
        setError('UNAUTHORIZED');
      } else if (status === 404) {
        setError('NOT_FOUND');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to load MoU agreement.');
      }
    } finally {
      setLoading(false);
    }
  }, [mouId]);

  useEffect(() => {
    fetchMouData();
  }, [fetchMouData]);

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);
      const blob = await mouService.downloadMou(mouId);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `PITCH_MoU_${mouId.slice(-6)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success('MoU PDF downloaded.');
    } catch (err) {
      toast.error('Failed to download PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <PageLoading message="Loading formal digital MoU agreement..." />;

  if (error) {
    if (error === 'UNAUTHORIZED') {
      return (
        <div className="max-w-4xl mx-auto px-4 py-8">
          <ErrorState
            type="forbidden"
            title="Access Restricted"
            message="You are not authorized to view or sign this digital MoU agreement."
            backUrl="/"
          />
        </div>
      );
    }
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <ErrorState
          type="notfound"
          title="MoU Document Not Found"
          message="The requested MoU document could not be located."
          backUrl="/"
        />
      </div>
    );
  }

  if (!mou) return null;

  const currentVer = selectedVersion || mou.currentVersionId || {};
  const signatories = currentVer.agreementSnapshot?.signatories || [];
  const mySignatoryRecord = signatories.find(
    (s) => s.role === userRole || String(s.userId?._id || s.userId) === String(currentUserId)
  );
  const hasUserSigned = !!mySignatoryRecord?.signedAt;
  const isExecuted = mou.status === 'EXECUTED' || currentVer.status === 'EXECUTED';

  const dealId = mou.dealId?._id || mou.dealId;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          to={dealId ? (userRole === 'COMPANY' ? `/company/deals/${dealId}` : `/committee/deals/${dealId}`) : '/'}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Deal Workspace</span>
        </Link>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPdf}
            isLoading={downloading}
            leftIcon={<Download className="w-4 h-4" />}
            className="text-xs"
          >
            Download PDF
          </Button>

          {!hasUserSigned && !isExecuted && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setSigningModalOpen(true)}
              leftIcon={<PenTool className="w-4 h-4" />}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Affix Digital Signature
            </Button>
          )}

          {hasUserSigned && !isExecuted && (
            <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              Signed by you • Awaiting counterparty
            </span>
          )}

          {isExecuted && (
            <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Fully Executed Agreement
            </span>
          )}
        </div>
      </div>

      {/* Signature Dual Status Banner */}
      <SignatureStatus
        signatories={signatories}
        mouStatus={mou.status}
        versionNumber={currentVer.versionNumber || 1}
      />

      {/* Version Selector if multiple versions exist */}
      {versions.length > 1 && (
        <div className="flex items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200 text-xs">
          <History className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="font-semibold text-slate-700">Document Versions:</span>
          <div className="flex items-center gap-1.5">
            {versions.map((v) => (
              <button
                key={v._id}
                type="button"
                onClick={() => setSelectedVersion(v)}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-colors ${
                  selectedVersion?._id === v._id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                V{v.versionNumber}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Authoritative MoU Document Viewer */}
      <MouViewer
        mouVersion={currentVer}
        onDownloadPdf={handleDownloadPdf}
        isDownloading={downloading}
      />

      {/* Digital Signing Modal */}
      <MouSigningModal
        isOpen={signingModalOpen}
        onClose={() => setSigningModalOpen(false)}
        mouId={mou._id}
        userRole={userRole}
        defaultName={user?.name || ''}
        onSigned={fetchMouData}
      />
    </div>
  );
}

export default MouDetails;

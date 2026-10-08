import React, { useState } from 'react';
import { PenTool, ShieldCheck, AlertCircle, CheckSquare } from 'lucide-react';
import Dialog, { DialogFooter } from '../ui/Dialog';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { mouService } from '../../services/mouService';
import { useToast } from '../../hooks/useToast';

export function MouSigningModal({
  isOpen,
  onClose,
  mouId,
  userRole,
  defaultName = '',
  onSigned,
}) {
  const toast = useToast();
  const [fullName, setFullName] = useState(defaultName || '');
  const [designation, setDesignation] = useState(
    userRole === 'COMPANY' ? 'Authorized Brand Signatory' : 'Convenor / Head of Committee'
  );
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [typedSignature, setTypedSignature] = useState(defaultName || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const consentDeclaration = `I, ${
    fullName || '[Authorized Signatory]'
  }, representing the ${
    userRole === 'COMPANY' ? 'Sponsor Organization' : 'Event Organising Committee'
  }, hereby confirm that I have reviewed the agreed terms, deliverables, and clauses of this Memorandum of Understanding (PITCH_MOU_V1). I agree to be bound by the obligations outlined herein on behalf of my organization.`;

  const handleSign = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Full legal name is required.');
      return;
    }
    if (!designation.trim()) {
      setError('Signer designation is required.');
      return;
    }
    if (!agreedToTerms) {
      setError('You must check the declaration box agreeing to the MoU terms.');
      return;
    }
    if (!typedSignature.trim()) {
      setError('Please provide your signature representation.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        fullName: fullName.trim(),
        designation: designation.trim(),
        agreedToTerms: true,
        consentText: consentDeclaration,
        signatureData: typedSignature.trim(),
      };

      const res = await mouService.signMou(mouId, payload);
      toast.success('MoU successfully signed. Digital signature recorded.');
      if (onSigned) {
        onSigned(res?.data || res);
      }
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to sign MoU.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Digital Execution & Signature"
      description="Record authorized sign-off on the formal Memorandum of Understanding (PITCH_MOU_V1)."
      size="lg"
    >
      <form onSubmit={handleSign} className="space-y-4">
        {/* Academic / Demo notice */}
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Academic Demonstration Signing</p>
            <p className="text-blue-800 mt-0.5 leading-relaxed">
              PITCH records signer identity, designation, timestamp, and authoritative SHA-256 document hash to enforce dual-party execution immutability.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Signatory Full Name
            </label>
            <Input
              type="text"
              placeholder="e.g. Rahul Sharma"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (!typedSignature) setTypedSignature(e.target.value);
              }}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Official Designation
            </label>
            <Input
              type="text"
              placeholder="e.g. Marketing Director / Fest Head"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Legal Consent Declaration Box */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Statement of Declaration
          </p>
          <p className="text-xs text-slate-700 leading-relaxed italic bg-white p-3 rounded-lg border border-slate-200">
            "{consentDeclaration}"
          </p>
          <label className="flex items-start gap-2 pt-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-0.5 rounded text-primary-600 focus:ring-primary-500 h-4 w-4 border-slate-300"
            />
            <span className="text-xs font-medium text-slate-800">
              I have reviewed the agreement and confirm my explicit assent as an authorized representative.
            </span>
          </label>
        </div>

        {/* Signature representation */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Signature Representation
          </label>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <Input
              type="text"
              placeholder="Type your legal name to sign"
              value={typedSignature}
              onChange={(e) => setTypedSignature(e.target.value)}
              className="font-serif italic text-base tracking-wide"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Your typed legal signature will be cryptographically bound to the document version.
            </p>
          </div>
        </div>

        <DialogFooter className="-mx-6 -mb-6 mt-6">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={loading}
            leftIcon={<PenTool className="w-4 h-4" />}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Affix Signature
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

export default MouSigningModal;

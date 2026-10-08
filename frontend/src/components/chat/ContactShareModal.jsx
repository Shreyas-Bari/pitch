import React, { useState, useEffect } from 'react';
import { Mail, Phone, MessageCircle, MoreHorizontal, ShieldCheck, Send } from 'lucide-react';
import Dialog, { DialogFooter } from '../ui/Dialog';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { conversationService } from '../../services/conversationService';
import { useToast } from '../../hooks/useToast';

export function ContactShareModal({
  isOpen,
  onClose,
  conversationId,
  onContactShared,
  defaultEmail = '',
  defaultPhone = '',
}) {
  const toast = useToast();
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    whatsapp: '',
    other: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        email: defaultEmail || '',
        phone: defaultPhone || '',
        whatsapp: defaultPhone || '',
        other: '',
      });
      setError(null);
    }
  }, [isOpen, defaultEmail, defaultPhone]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email?.trim() && !formData.phone?.trim() && !formData.whatsapp?.trim()) {
      setError('Please provide at least one contact method (Email, Phone, or WhatsApp).');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await conversationService.shareContact(conversationId, {
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        whatsapp: formData.whatsapp.trim(),
        other: formData.other.trim(),
      });

      toast.success('Direct contact details shared successfully with the counter-party.');
      if (onContactShared) {
        onContactShared(res?.data?.contactShare || res?.contactShare);
      }
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to share contact info.';
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
      title="Share Direct Contact Details"
      description="Connect directly over email, phone, or WhatsApp for high-touch sponsor coordination."
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            PITCH encourages external calls, WhatsApp chats, and in-person meetings once mutual interest has been established in the marketplace.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Official Email
            </label>
            <Input
              name="email"
              type="email"
              placeholder="e.g. sponsorships@partner.com"
              value={formData.email}
              onChange={handleChange}
              leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Direct Phone Number
            </label>
            <Input
              name="phone"
              type="tel"
              placeholder="e.g. +91 98765 43210"
              value={formData.phone}
              onChange={handleChange}
              leftIcon={<Phone className="w-4 h-4 text-slate-400" />}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              WhatsApp Number
            </label>
            <Input
              name="whatsapp"
              type="tel"
              placeholder="e.g. +91 98765 43210"
              value={formData.whatsapp}
              onChange={handleChange}
              leftIcon={<MessageCircle className="w-4 h-4 text-emerald-500" />}
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Allows the partner to tap and start a direct WhatsApp business thread.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Other Notes / Availability (Optional)
            </label>
            <Input
              name="other"
              type="text"
              placeholder="e.g. Available weekdays 10 AM – 6 PM"
              value={formData.other}
              onChange={handleChange}
              leftIcon={<MoreHorizontal className="w-4 h-4 text-slate-400" />}
            />
          </div>
        </div>

        <DialogFooter className="-mx-6 -mb-6 mt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={loading}
            leftIcon={<Send className="w-4 h-4" />}
          >
            Share in Chat
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

export default ContactShareModal;

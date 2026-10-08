import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Banknote,
  Package,
  FileText,
  AlertCircle,
  Send,
  Calendar,
} from 'lucide-react';
import Dialog, { DialogFooter } from '../ui/Dialog';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { CONTRIBUTION_TYPES } from '../../utils/constants';

const IN_KIND_TYPES = CONTRIBUTION_TYPES.filter((t) => t !== 'CASH');

export function ProposalFormModal({
  isOpen,
  onClose,
  onSubmit,
  isCounter = false,
  baseProposal = null,
  isSubmitting = false,
}) {
  const [cashAmount, setCashAmount] = useState('');
  const [nonCashItems, setNonCashItems] = useState([]);
  const [deliverables, setDeliverables] = useState([]);
  const [benefits, setBenefits] = useState([]);
  const [terms, setTerms] = useState('');
  const [error, setError] = useState(null);

  // Prepopulate if countering existing proposal
  useEffect(() => {
    if (isOpen) {
      if (isCounter && baseProposal) {
        const c = baseProposal.contribution || {};
        setCashAmount(c.cash?.amount ? String(c.cash.amount) : '');
        setNonCashItems(
          Array.isArray(c.nonCash) && c.nonCash.length > 0
            ? c.nonCash.map((nc) => ({
                type: nc.type || 'PRODUCT',
                name: nc.name || '',
                description: nc.description || '',
                quantity: nc.quantity || 1,
                unit: nc.unit || 'units',
                estimatedValue: nc.estimatedValue || '',
              }))
            : []
        );
        setDeliverables(
          Array.isArray(baseProposal.deliverables) && baseProposal.deliverables.length > 0
            ? baseProposal.deliverables.map((d) => ({
                party: d.party || 'COMPANY',
                description: d.description || '',
                dueDate: d.dueDate ? d.dueDate.slice(0, 10) : '',
              }))
            : [{ party: 'COMPANY', description: '', dueDate: '' }]
        );
        setBenefits(
          Array.isArray(baseProposal.benefits) && baseProposal.benefits.length > 0
            ? baseProposal.benefits.map((b) => ({
                title: b.title || '',
                description: b.description || '',
              }))
            : [{ title: '', description: '' }]
        );
        setTerms(baseProposal.terms || '');
      } else {
        // Fresh initial proposal
        setCashAmount('');
        setNonCashItems([]);
        setDeliverables([
          { party: 'COMPANY', description: '', dueDate: '' },
          { party: 'COMMITTEE', description: '', dueDate: '' },
        ]);
        setBenefits([{ title: '', description: '' }]);
        setTerms('');
      }
      setError(null);
    }
  }, [isOpen, isCounter, baseProposal]);

  // Handlers for in-kind items
  const handleAddInKind = () => {
    setNonCashItems((prev) => [
      ...prev,
      {
        type: 'PRODUCT',
        name: '',
        description: '',
        quantity: 1,
        unit: 'units',
        estimatedValue: '',
      },
    ]);
  };

  const handleRemoveInKind = (index) => {
    setNonCashItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateInKind = (index, field, value) => {
    setNonCashItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  // Handlers for deliverables
  const handleAddDeliverable = () => {
    setDeliverables((prev) => [
      ...prev,
      { party: 'COMPANY', description: '', dueDate: '' },
    ]);
  };

  const handleRemoveDeliverable = (index) => {
    setDeliverables((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateDeliverable = (index, field, value) => {
    setDeliverables((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  // Handlers for benefits
  const handleAddBenefit = () => {
    setBenefits((prev) => [...prev, { title: '', description: '' }]);
  };

  const handleRemoveBenefit = (index) => {
    setBenefits((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateBenefit = (index, field, value) => {
    setBenefits((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    const parsedCash = Number(cashAmount) || 0;
    const validNonCash = nonCashItems.filter((nc) => nc.name.trim() || nc.quantity > 0);

    // 1. Validate contributions
    if (parsedCash <= 0 && validNonCash.length === 0) {
      setError('Please provide at least one contribution (Cash amount or an In-Kind item).');
      return;
    }

    // 2. Validate deliverables
    const validDeliverables = deliverables
      .filter((d) => d.description.trim())
      .map((d) => ({
        party: d.party,
        description: d.description.trim(),
        dueDate: d.dueDate ? new Date(d.dueDate) : null,
      }));

    // 3. Validate benefits
    const validBenefits = benefits
      .filter((b) => b.title.trim())
      .map((b) => ({
        title: b.title.trim(),
        description: b.description.trim(),
      }));

    // Prepare payload
    const payload = {
      contributions: {
        cash: { amount: parsedCash, currency: 'INR' },
        nonCash: validNonCash.map((nc) => ({
          type: nc.type,
          name: nc.name.trim() || `${nc.type} Item`,
          description: nc.description.trim(),
          quantity: Number(nc.quantity) || 1,
          unit: nc.unit.trim() || 'units',
          estimatedValue: Number(nc.estimatedValue) || 0,
        })),
      },
      deliverables: validDeliverables,
      benefits: validBenefits,
      terms: terms.trim(),
    };

    onSubmit(payload);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={isCounter ? `Submit Counter-Proposal (V${(baseProposal?.version || 1) + 1})` : 'Create Structured Proposal (V1)'}
      description={
        isCounter
          ? 'Counter with revised contributions, adjusted quantities, or updated deliverables. This creates an immutable new negotiation version.'
          : 'Define multi-type sponsorship contributions, partner deliverables, and commercial terms.'
      }
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6 max-h-[72vh] overflow-y-auto px-1 pr-2">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Section 1: Contributions */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 font-display flex items-center gap-2">
              <Banknote className="w-4 h-4 text-emerald-600" />
              <span>Sponsorship Contributions</span>
            </h4>
            <span className="text-[11px] text-slate-400">Cash and/or in-kind</span>
          </div>

          {/* Cash input */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Direct Cash Contribution (INR)
            </label>
            <Input
              type="number"
              min="0"
              placeholder="e.g. 50000 (leave blank or 0 if in-kind only)"
              value={cashAmount}
              onChange={(e) => setCashAmount(e.target.value)}
              leftIcon={<span className="text-xs font-bold text-slate-500">₹</span>}
            />
          </div>

          {/* In-Kind dynamic rows */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                In-Kind / Product Contributions ({nonCashItems.length})
              </label>
              <button
                type="button"
                onClick={handleAddInKind}
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add In-Kind Item
              </button>
            </div>

            {nonCashItems.map((nc, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">
                    Item #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveInKind(idx)}
                    className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Type
                    </label>
                    <select
                      value={nc.type}
                      onChange={(e) => handleUpdateInKind(idx, 'type', e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-300 bg-white p-2 text-slate-800 focus:outline-none focus:border-primary-500"
                    >
                      {IN_KIND_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Item Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Energy Drinks / Official Hoodies"
                      value={nc.name}
                      onChange={(e) => handleUpdateInKind(idx, 'name', e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-300 bg-white p-2 text-slate-800 focus:outline-none focus:border-primary-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="1"
                      value={nc.quantity}
                      onChange={(e) => handleUpdateInKind(idx, 'quantity', e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-300 bg-white p-2 text-slate-800 focus:outline-none focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Unit
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. cans, boxes, units"
                      value={nc.unit}
                      onChange={(e) => handleUpdateInKind(idx, 'unit', e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-300 bg-white p-2 text-slate-800 focus:outline-none focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Est. Value (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 25000"
                      value={nc.estimatedValue}
                      onChange={(e) => handleUpdateInKind(idx, 'estimatedValue', e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-300 bg-white p-2 text-slate-800 focus:outline-none focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Deliverables */}
        <div className="space-y-3.5 pt-3.5 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 font-display flex items-center gap-2">
              <Package className="w-4 h-4 text-primary-600" />
              <span>Deliverables & Obligations</span>
            </h4>
            <button
              type="button"
              onClick={handleAddDeliverable}
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Deliverable
            </button>
          </div>

          {deliverables.map((d, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5"
            >
              <select
                value={d.party}
                onChange={(e) => handleUpdateDeliverable(idx, 'party', e.target.value)}
                className="text-xs rounded-xl border border-slate-300 bg-white p-2 text-slate-800 shrink-0 font-semibold focus:outline-none"
              >
                <option value="COMPANY">COMPANY</option>
                <option value="COMMITTEE">COMMITTEE</option>
              </select>

              <input
                type="text"
                placeholder="Description of obligation (e.g. Logo on main fest banner)"
                value={d.description}
                onChange={(e) => handleUpdateDeliverable(idx, 'description', e.target.value)}
                className="flex-1 text-xs rounded-xl border border-slate-300 bg-white p-2 text-slate-800 focus:outline-none focus:border-primary-500"
              />

              <input
                type="date"
                value={d.dueDate}
                onChange={(e) => handleUpdateDeliverable(idx, 'dueDate', e.target.value)}
                className="text-xs rounded-xl border border-slate-300 bg-white p-2 text-slate-800 shrink-0 focus:outline-none"
              />

              <button
                type="button"
                onClick={() => handleRemoveDeliverable(idx)}
                className="p-2 text-slate-400 hover:text-red-500"
                title="Remove deliverable"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Section 3: Benefits */}
        <div className="space-y-3.5 pt-3.5 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 font-display flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600" />
              <span>Sponsor Benefits</span>
            </h4>
            <button
              type="button"
              onClick={handleAddBenefit}
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Benefit
            </button>
          </div>

          {benefits.map((b, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5"
            >
              <input
                type="text"
                placeholder="Benefit title (e.g. 5-min Stage Address)"
                value={b.title}
                onChange={(e) => handleUpdateBenefit(idx, 'title', e.target.value)}
                className="flex-1 text-xs rounded-xl border border-slate-300 bg-white p-2 text-slate-800 focus:outline-none"
              />

              <input
                type="text"
                placeholder="Details (optional)"
                value={b.description}
                onChange={(e) => handleUpdateBenefit(idx, 'description', e.target.value)}
                className="flex-1 text-xs rounded-xl border border-slate-300 bg-white p-2 text-slate-800 focus:outline-none"
              />

              <button
                type="button"
                onClick={() => handleRemoveBenefit(idx)}
                className="p-2 text-slate-400 hover:text-red-500"
                title="Remove benefit"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Section 4: Terms & Conditions */}
        <div className="space-y-2 pt-3.5 border-t border-slate-100">
          <label className="block text-xs font-semibold text-slate-700">
            Commercial Notes & Additional Terms
          </label>
          <textarea
            rows={3}
            placeholder="Specify any payment milestones, venue guidelines, exclusivity conditions, or special requirements..."
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-300 bg-slate-50/50 p-3 text-slate-800 focus:outline-none focus:border-primary-500 focus:bg-white leading-relaxed resize-none"
          />
        </div>

        <DialogFooter className="-mx-6 -mb-6 mt-6">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            leftIcon={<Send className="w-4 h-4" />}
          >
            {isCounter ? 'Submit Counter-Proposal' : 'Submit Proposal'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

export default ProposalFormModal;

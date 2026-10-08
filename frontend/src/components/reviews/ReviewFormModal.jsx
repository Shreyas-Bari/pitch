import React, { useState } from 'react';
import { Award, AlertCircle } from 'lucide-react';
import Dialog, { DialogFooter } from '../ui/Dialog';
import Button from '../ui/Button';
import Input from '../ui/Input';
import RatingStars from './RatingStars';
import { reviewService } from '../../services/reviewService';
import { useToast } from '../../hooks/useToast';

export function ReviewFormModal({ isOpen, onClose, dealId, onReviewSubmitted }) {
  const toast = useToast();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating || rating < 1 || rating > 5) {
      setError('Please provide a rating between 1 and 5 stars.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await reviewService.createReview(dealId, {
        rating,
        title: title.trim(),
        comment: comment.trim(),
      });
      toast.success('Review submitted successfully! Reputation updated.');
      if (onReviewSubmitted) onReviewSubmitted();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to submit review.';
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
      title="Review Sponsorship Partnership"
      description="Leave a verified review and rating for your partnership experience on this completed deal."
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center space-y-2">
          <p className="text-xs font-semibold text-slate-700">Overall Partner Rating</p>
          <RatingStars rating={rating} onRate={setRating} interactive size="lg" />
          <span className="text-xs font-bold text-slate-900 font-display">
            {rating} of 5 Stars
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Review Headline (Optional)
          </label>
          <Input
            type="text"
            placeholder="e.g. Excellent student engagement and professional execution"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Detailed Feedback & Collaboration Experience
          </label>
          <textarea
            rows={4}
            placeholder="Describe the communication quality, deliverable fulfillment, professionalism, and audience response..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-300 p-3 focus:outline-none focus:border-primary-500 leading-relaxed"
          />
        </div>

        <DialogFooter className="-mx-6 -mb-6 mt-4">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={loading}
            leftIcon={<Award className="w-4 h-4" />}
          >
            Submit Verified Review
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

export default ReviewFormModal;

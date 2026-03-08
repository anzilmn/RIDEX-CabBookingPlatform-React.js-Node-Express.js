import React, { useState } from 'react';
import { Star, X, Send, ThumbsUp } from 'lucide-react';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import Button from './Button';

const TAGS = [
  { id: 'punctual', label: '⏰ Punctual' },
  { id: 'clean_car', label: '✨ Clean Car' },
  { id: 'safe_driving', label: '🛡 Safe Driving' },
  { id: 'friendly', label: '😊 Friendly' },
  { id: 'professional', label: '💼 Professional' },
  { id: 'good_route', label: '🗺 Good Route' },
  { id: 'smooth_ride', label: '🌊 Smooth Ride' },
];

const RATING_LABELS = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Great', 5: 'Excellent!' };

export default function ReviewModal({ ride, onClose, onSubmitted }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [review, setReview] = useState('');
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const toggleTag = (tag) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleSubmit = async () => {
    if (!rating) { toast.error('Please select a rating'); return; }
    setLoading(true);
    try {
      await api.put(`/rides/${ride._id}/rate`, { rating, review, tags });
      setSubmitted(true);
      toast.success('Review submitted! Thank you 🙏');
      setTimeout(() => { onSubmitted?.(); onClose?.(); }, 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally { setLoading(false); }
  };

  const driverName = ride?.driverId?.userId?.name || 'Your Driver';
  const stars = hovered || rating;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px'
    }}>
      <div style={{
        background: '#111', border: '1px solid #2a2a2a', borderRadius: '20px',
        width: '100%', maxWidth: '440px', overflow: 'hidden',
        animation: 'slideUp 0.3s ease-out'
      }}>
        {submitted ? (
          <div style={{ padding: '48px 32px', textAlign: 'center' }}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>🎉</div>
            <h2 style={{ fontFamily: 'Syne', fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>
              Thanks for your review!
            </h2>
            <p style={{ color: 'var(--gray-400)' }}>Your feedback helps improve RideX for everyone.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid #1a1a1a',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'linear-gradient(135deg, #0d0d0d, #141414)'
            }}>
              <div>
                <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '20px' }}>Rate Your Ride</h2>
                <p style={{ color: 'var(--gray-400)', fontSize: '13px', marginTop: '2px' }}>
                  How was your ride with {driverName}?
                </p>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              {/* Ride Summary */}
              <div style={{
                background: '#1a1a1a', borderRadius: '12px', padding: '14px 16px',
                marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center',
                border: '1px solid #2a2a2a'
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: '50%', background: 'rgba(232,255,71,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Syne', fontWeight: 800, color: 'var(--accent)', fontSize: '16px'
                }}>
                  {driverName[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{driverName}</div>
                  <div style={{ fontSize: '12px', color: 'var(--gray-400)' }}>
                    {ride?.pickupLocation?.address} → {ride?.dropLocation?.address}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: 'var(--accent)' }}>₹{ride?.fare}</div>
                  <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>{ride?.distance}km</div>
                </div>
              </div>

              {/* Star Rating */}
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <p style={{ color: 'var(--gray-400)', fontSize: '13px', marginBottom: '12px' }}>Tap to rate</p>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '8px' }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <button
                      key={s}
                      onClick={() => setRating(s)}
                      onMouseEnter={() => setHovered(s)}
                      onMouseLeave={() => setHovered(0)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                        transition: 'transform 0.15s'
                      }}
                    >
                      <Star
                        size={36}
                        fill={s <= stars ? '#f39c12' : 'none'}
                        color={s <= stars ? '#f39c12' : '#333'}
                        style={{ transition: 'all 0.15s', transform: s <= stars ? 'scale(1.1)' : 'scale(1)' }}
                      />
                    </button>
                  ))}
                </div>
                {stars > 0 && (
                  <div style={{
                    fontSize: '18px', fontWeight: 700, color: 'var(--accent)',
                    fontFamily: 'Syne', animation: 'fadeIn 0.2s'
                  }}>
                    {RATING_LABELS[stars]}
                  </div>
                )}
              </div>

              {/* Tags */}
              <div style={{ marginBottom: '18px' }}>
                <p style={{ fontSize: '13px', color: 'var(--gray-400)', marginBottom: '10px' }}>What stood out? (optional)</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {TAGS.map(t => (
                    <button key={t.id} onClick={() => toggleTag(t.id)} style={{
                      padding: '7px 14px', borderRadius: '20px', border: '1px solid',
                      borderColor: tags.includes(t.id) ? 'var(--accent)' : '#2a2a2a',
                      background: tags.includes(t.id) ? 'rgba(232,255,71,0.1)' : 'transparent',
                      color: tags.includes(t.id) ? 'var(--accent)' : 'var(--gray-400)',
                      fontSize: '12px', cursor: 'pointer', transition: 'all 0.15s', fontWeight: 500
                    }}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div style={{ marginBottom: '20px' }}>
                <textarea
                  value={review}
                  onChange={e => setReview(e.target.value)}
                  placeholder="Share your experience... (optional)"
                  maxLength={500}
                  rows={3}
                  style={{
                    width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a',
                    borderRadius: '10px', color: 'var(--white)', padding: '12px 14px',
                    fontSize: '14px', resize: 'none', outline: 'none', fontFamily: 'DM Sans',
                    boxSizing: 'border-box'
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = '#2a2a2a'}
                />
                <div style={{ fontSize: '11px', color: '#555', textAlign: 'right', marginTop: '4px' }}>{review.length}/500</div>
              </div>

              {/* Submit */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <Button variant="secondary" onClick={onClose} style={{ flex: 1 }}>
                  Skip for now
                </Button>
                <Button onClick={handleSubmit} loading={loading} disabled={!rating} style={{ flex: 2 }}>
                  <Send size={15} /> Submit Review
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
      `}</style>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

type Lawyer = {
  id: string;
  name: string;
  photo_url?: string;
  bar_council_number?: string;
  specializations?: string[];
  languages?: string[];
  experience_years?: number;
  consultation_fee_video?: number;
  consultation_fee_chat?: number;
  is_available?: boolean;
  rating?: number;
  total_reviews?: number;
  bio?: string;
  city?: string;
};

type Review = {
  id: string;
  user_id: string;
  lawyer_id: string;
  rating: number;
  comment?: string;
  created_at?: string;
};

export default function LawyerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lawyer, setLawyer] = useState<Lawyer | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/lawyers/${id}`);
        if (!res.ok) throw new Error('Lawyer not found');
        const body = await res.json();
        setLawyer(body.lawyer || body);

        const rv = await fetch(`/api/reviews?lawyer_id=${id}`);
        if (rv.ok) {
          const rbody = await rv.json();
          setReviews(rbody.reviews || []);
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleBook = async (type: 'video' | 'chat') => {
    if (!lawyer) return;
    try {
      const resp = await fetch('/api/consultations/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lawyer_id: lawyer.id, type })
      });
      const data = await resp.json();
      const consultationId = data?.consultation?.id || data?.consultation?.id;
      if (!consultationId) throw new Error('Booking failed');
      navigate(`/payment/${consultationId}`);
    } catch (e: any) {
      alert(e?.message || 'Booking failed');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-40 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </div>
      </div>
    );
  }

  if (error || !lawyer) {
    return (
      <div className="p-6">
        <p className="text-red-600">{error || 'Lawyer not found'}</p>
        <Link to="/lawyers" className="text-primary underline mt-4 inline-block">Back to list</Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <button onClick={() => navigate('/lawyers')} className="mb-4 text-sm text-secondary">← Back</button>

      <div className="flex gap-6 items-start">
        <img src={lawyer.photo_url || '/placeholder-profile.png'} alt={lawyer.name} className="w-36 h-36 rounded-lg object-cover shadow" />
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{lawyer.name}</h2>
          <p className="text-sm text-secondary">Bar Council: {lawyer.bar_council_number || '—'}</p>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-2">
              <div className="font-semibold">{(lawyer.rating || 0).toFixed(1)}</div>
              <div className="text-sm text-secondary">({lawyer.total_reviews || 0} reviews)</div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${lawyer.is_available ? 'bg-green-500' : 'bg-gray-400'}`} />
              <div className="text-sm text-secondary">{lawyer.is_available ? 'Available now' : 'Unavailable'}</div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {(lawyer.specializations || []).map((s) => (
              <span key={s} className="px-3 py-1 bg-surface-container-low rounded-full text-sm border">{s}</span>
            ))}
          </div>

          <p className="mt-4 text-sm text-secondary">{lawyer.bio}</p>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="p-4 bg-surface-container rounded">
              <div className="text-xs text-secondary">Languages</div>
              <div className="font-medium">{(lawyer.languages || []).join(', ')}</div>
            </div>
            <div className="p-4 bg-surface-container rounded">
              <div className="text-xs text-secondary">Experience</div>
              <div className="font-medium">{lawyer.experience_years || 0} years</div>
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button onClick={() => handleBook('video')} className="flex-1 bg-primary text-white py-3 rounded">Video Call ₹{lawyer.consultation_fee_video || 500}</button>
            <button onClick={() => handleBook('chat')} className="flex-1 bg-secondary text-white py-3 rounded">Chat ₹{lawyer.consultation_fee_chat || 200}</button>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-bold mb-3">Recent Reviews</h3>
        <div className="space-y-4">
          {reviews.length === 0 && <div className="text-sm text-secondary">No reviews yet.</div>}
          {reviews.slice(0,5).map((r) => (
            <div key={r.id} className="p-4 bg-surface-container rounded">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">User {r.user_id.slice(0,6)}</div>
                <div className="text-sm text-secondary">{new Date(r.created_at || '').toLocaleDateString()}</div>
              </div>
              <div className="text-sm">{r.comment}</div>
              <div className="mt-2 text-xs text-secondary">Rating: {r.rating}/5</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

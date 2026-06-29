import { useOffline } from '../hooks/useOffline';

export function OfflineBanner() {
  const isOffline = useOffline();
  if (!isOffline) return null;

  return (
    <div
      role="alert"
      style={{
        background: '#854F0B',
        color: '#fff',
        padding: '10px 16px',
        textAlign: 'center',
        fontSize: '14px',
      }}
    >
      📡 इंटरनेट कनेक्शन नहीं है — कुछ सुविधाएं उपलब्ध नहीं होंगी
    </div>
  );
}


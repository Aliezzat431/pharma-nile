// lib/api/ai.ts
export interface AiProductChoice {
  name: string;
  company: string;
  type: string;
  unit_conversion: number;
}

export interface ExtractedPrescriptionItem {
  medicine_name: string;
  medicine_name_en?: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes?: string;
  confidence: number;
  raw_text?: string;
}

export interface PrescriptionScanResult {
  success: boolean;
  medicines: ExtractedPrescriptionItem[];
  total: number;
  overall_quality?: 'good' | 'fair' | 'poor';
  reading_notes?: string | null;
  warnings?: {
    low_confidence: number;
    poor_quality: boolean;
  };
  error?: string;
}

export async function analyzeProduct(productName: string): Promise<{ choices: AiProductChoice[] }> {
  const res = await fetch('/api/ai/analyze-product', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productName }),
  });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || 'Failed to analyze product');
  }
  
  return res.json();
}

export async function scanPrescription(file: File): Promise<PrescriptionScanResult> {
  const formData = new FormData();
  formData.append('prescription', file);

  const res = await fetch('/api/prescription-scan', {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error || 'فشل تحليل الروشتة');
  }

  return data;
}
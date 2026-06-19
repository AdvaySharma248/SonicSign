'use client';

import { ChangeEvent, PointerEvent, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { CheckCircle2, Loader2, PenTool, Upload, Type, Calendar } from 'lucide-react';
import { publicSigningApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const PublicSigningPdf = dynamic(
  () => import('@/components/sonicsign/signing/PublicSigningPdf').then((module) => module.PublicSigningPdf),
  {
    ssr: false,
    loading: () => <div className="p-8 text-center">Loading PDF...</div>,
  }
);

type SigningField = {
  _id?: string;
  id?: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'signature' | 'initials' | 'date' | 'text';
  label?: string;
  completed?: boolean;
  signerId: string | { _id?: string; id?: string; name?: string; email?: string };
};

type SigningSession = {
  signer: { id: string; name: string; email: string; expiresAt: string };
  document: { id: string; title: string; pageCount: number };
  fields: SigningField[];
};

type FieldValue = {
  value: string;
  signatureMethod?: 'draw' | 'type' | 'upload';
};

function fieldId(field: SigningField) {
  return field._id || field.id || '';
}

function signerIdFor(field: SigningField) {
  return typeof field.signerId === 'object' ? field.signerId._id || field.signerId.id : field.signerId;
}

function DrawPad({ onChange }: { onChange: (value: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);

  const getPoint = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const emit = () => {
    const canvas = canvasRef.current;
    if (canvas) onChange(canvas.toDataURL('image/png'));
  };

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        width={520}
        height={160}
        className="h-32 w-full touch-none rounded-md border bg-white"
        onPointerDown={(event) => {
          const canvas = canvasRef.current;
          const context = canvas?.getContext('2d');
          if (!context) return;
          drawingRef.current = true;
          const point = getPoint(event);
          context.lineWidth = 4;
          context.lineCap = 'round';
          context.strokeStyle = '#111827';
          context.beginPath();
          context.moveTo(point.x, point.y);
        }}
        onPointerMove={(event) => {
          if (!drawingRef.current) return;
          const context = canvasRef.current?.getContext('2d');
          if (!context) return;
          const point = getPoint(event);
          context.lineTo(point.x, point.y);
          context.stroke();
          emit();
        }}
        onPointerUp={() => {
          drawingRef.current = false;
          emit();
        }}
        onPointerLeave={() => {
          drawingRef.current = false;
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          const canvas = canvasRef.current;
          const context = canvas?.getContext('2d');
          if (!canvas || !context) return;
          context.clearRect(0, 0, canvas.width, canvas.height);
          onChange('');
        }}
      >
        Clear drawing
      </Button>
    </div>
  );
}

export default function PublicSigningPage() {
  const routeParams = useParams<{ token: string }>();
  const token = routeParams.token;
  const [session, setSession] = useState<SigningSession | null>(null);
  const [values, setValues] = useState<Record<string, FieldValue>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let active = true;
    publicSigningApi
      .getSession(token)
      .then((data) => {
        if (active) setSession(data);
      })
      .catch((requestError) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Unable to load signing link');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  const assignedFields = useMemo(
    () => session?.fields.filter((field) => signerIdFor(field) === session.signer.id) || [],
    [session]
  );

  const missingRequired = assignedFields.filter((field) => !values[fieldId(field)]?.value);

  const updateValue = (id: string, nextValue: FieldValue) => {
    setValues((current) => ({ ...current, [id]: nextValue }));
  };

  const submit = async () => {
    if (!token || missingRequired.length) return;
    try {
      setSubmitting(true);
      setError(null);
      await publicSigningApi.complete(
        token,
        assignedFields.map((field) => ({ fieldId: fieldId(field), ...values[fieldId(field)] }))
      );
      setCompleted(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to submit signature');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-[#365CF5]" />
      </main>
    );
  }

  if (error && !session) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-center text-red-600">{error}</main>;
  }

  if (!session) return null;

  if (completed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md rounded-xl bg-white p-8 text-center shadow">
          <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-green-600" />
          <h1 className="text-xl font-semibold">Document signed</h1>
          <p className="mt-2 text-sm text-slate-600">Your completed fields were saved and the audit trail was updated.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">{session.document.title}</h1>
            <p className="text-sm text-slate-600">
              Signing as {session.signer.name} ({session.signer.email}) · Expires {new Date(session.signer.expiresAt).toLocaleString()}
            </p>
          </div>
          <Button onClick={submit} disabled={submitting || missingRequired.length > 0} className="bg-[#365CF5] text-white hover:bg-[#2d4bd0]">
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Complete signing
          </Button>
        </div>
        {error && <p className="mx-auto mt-2 max-w-6xl rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {missingRequired.length > 0 && <p className="mx-auto mt-2 max-w-6xl text-xs text-slate-500">{missingRequired.length} assigned field(s) remaining.</p>}
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 p-4 lg:grid-cols-[1fr_320px]">
        <section className="overflow-auto rounded-xl bg-white p-4 shadow">
          <PublicSigningPdf token={token} session={session} values={values} />
        </section>

        <aside className="h-fit rounded-xl bg-white p-4 shadow">
          <h2 className="mb-3 font-semibold text-slate-900">Your fields</h2>
          <div className="space-y-4">
            {assignedFields.map((field) => {
              const id = fieldId(field);
              const current = values[id];
              return (
                <div key={id} className="rounded-lg border p-3">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium capitalize">
                    {field.type === 'date' ? <Calendar className="h-4 w-4" /> : field.type === 'text' ? <Type className="h-4 w-4" /> : <PenTool className="h-4 w-4" />}
                    {field.label || field.type} · page {field.page}
                  </div>
                  {field.type === 'signature' ? (
                    <Tabs defaultValue="type">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="type">Type</TabsTrigger>
                        <TabsTrigger value="draw">Draw</TabsTrigger>
                        <TabsTrigger value="upload">Upload</TabsTrigger>
                      </TabsList>
                      <TabsContent value="type" className="space-y-2">
                        <Input placeholder="Type your signature" onChange={(event) => updateValue(id, { value: event.target.value, signatureMethod: 'type' })} />
                      </TabsContent>
                      <TabsContent value="draw">
                        <DrawPad onChange={(value) => updateValue(id, { value, signatureMethod: 'draw' })} />
                      </TabsContent>
                      <TabsContent value="upload">
                        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed p-4 text-sm">
                          <Upload className="h-4 w-4" />
                          Upload image
                          <input
                            className="sr-only"
                            type="file"
                            accept="image/png,image/jpeg"
                            onChange={(event: ChangeEvent<HTMLInputElement>) => {
                              const file = event.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = () => updateValue(id, { value: String(reader.result), signatureMethod: 'upload' });
                              reader.readAsDataURL(file);
                            }}
                          />
                        </label>
                      </TabsContent>
                    </Tabs>
                  ) : (
                    <Input
                      type={field.type === 'date' ? 'date' : 'text'}
                      value={current?.value || ''}
                      placeholder={field.type === 'initials' ? 'Initials' : field.type === 'date' ? '' : 'Enter text'}
                      onChange={(event) => updateValue(id, { value: event.target.value })}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </main>
  );
}

'use client';

import { Document as PdfDocument, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { publicSigningApi } from '@/services/api';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

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

function signerNameFor(field: SigningField) {
  return typeof field.signerId === 'object' ? field.signerId.name || field.signerId.email || 'Signer' : 'Signer';
}

export function PublicSigningPdf({
  token,
  session,
  values,
}: {
  token: string;
  session: SigningSession;
  values: Record<string, FieldValue>;
}) {
  return (
    <PdfDocument file={publicSigningApi.pdfUrl(token)} loading={<div className="p-8 text-center">Loading PDF...</div>}>
      <div className="flex flex-col items-center gap-6">
        {Array.from({ length: session.document.pageCount }, (_, index) => {
          const pageNumber = index + 1;
          const pageFields = session.fields.filter((field) => field.page === pageNumber);
          return (
            <div key={pageNumber} className="relative bg-white shadow ring-1 ring-slate-200">
              <Page pageNumber={pageNumber} width={760} renderTextLayer={false} renderAnnotationLayer={false} />
              {pageFields.map((field) => {
                const id = fieldId(field);
                const assigned = signerIdFor(field) === session.signer.id;
                const value = values[id]?.value;
                return (
                  <div
                    key={id}
                    className={`absolute flex items-center justify-center rounded border-2 text-xs ${
                      assigned ? 'border-[#365CF5] bg-blue-50/80 text-blue-700' : 'border-slate-300 bg-slate-100/70 text-slate-500'
                    }`}
                    style={{ left: `${field.x}%`, top: `${field.y}%`, width: `${field.width}%`, height: `${field.height}%` }}
                  >
                    {value ? <span className="truncate px-1">{field.type === 'signature' && value.startsWith('data:image') ? 'Signature saved' : value}</span> : `${field.label || field.type} - ${assigned ? 'You' : signerNameFor(field)}`}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </PdfDocument>
  );
}

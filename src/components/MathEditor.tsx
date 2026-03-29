import React, { useEffect } from 'react';
import ReactQuill from 'react-quill-new';
import katex from 'katex';

// Set global katex for Quill formula module
if (typeof window !== 'undefined') {
  (window as any).katex = katex;
}

interface MathEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    ['formula'], // This enables the KaTeX formula button
    ['clean']
  ],
};

const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list', 'bullet',
  'formula'
];

export default function MathEditor({ value, onChange, placeholder }: MathEditorProps) {
  return (
    <div className="math-editor-container bg-white rounded-xl overflow-hidden border border-slate-200">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder || "Wpisz treść lekcji lub formułę matematyczną..."}
        className="min-h-[300px]"
      />
      <style>{`
        .ql-container {
          font-family: inherit;
          font-size: 1rem;
        }
        .ql-editor {
          min-h-[250px];
        }
        .ql-toolbar.ql-snow {
          border: none;
          border-bottom: 1px solid #e2e8f0;
          background: #f8fafc;
        }
        .ql-container.ql-snow {
          border: none;
        }
      `}</style>
    </div>
  );
}

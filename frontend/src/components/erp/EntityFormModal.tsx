import React, { useState, useEffect } from 'react';

const SparklesIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" /></svg>
);

const BarcodeIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 19.5h.75v.75h-.75v-.75ZM19.5 13.5h.75v.75h-.75v-.75ZM19.5 19.5h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75h-.75v-.75Z" /></svg>
);

interface Field {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  step?: string;
  nested?: boolean;
  options?: { value: string; label: string }[];
  autoEnrich?: 'barcode' | 'fiscal'; // Tipo de enriquecimento automático
}

interface EntityFormModalProps {
  title: string;
  fields: Field[];
  initialData: any | null;
  onSave: (data: any) => void;
  onClose: () => void;
  onAutoEnrich?: (type: 'barcode' | 'fiscal', currentData: any) => Promise<any>;
}

const EntityFormModal: React.FC<EntityFormModalProps> = ({ title, fields, initialData, onSave, onClose, onAutoEnrich }) => {
  const [formData, setFormData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);

  useEffect(() => {
    const initialFormState = fields.reduce((acc, field) => {
        let value = '';
        if (initialData) {
            if (field.nested && field.name.includes('.')) {
                const [parent, child] = field.name.split('.');
                value = initialData[parent]?.[child] || '';
            } else {
                value = initialData[field.name] || '';
            }
        } else if (field.type === 'select') {
            value = field.options?.[0]?.value || '';
        }
        acc[field.name] = value;
        return acc;
    }, {} as any);
    setFormData(initialFormState);
  }, [initialData, fields]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleAutoEnrich = async (type: 'barcode' | 'fiscal') => {
      if (!onAutoEnrich) return;
      setIsEnriching(true);
      try {
          const enrichedData = await onAutoEnrich(type, formData);
          if (enrichedData) {
              setFormData((prev: any) => ({ ...prev, ...enrichedData }));
          }
      } catch (error) {
          console.error('Erro ao enriquecer dados:', error);
      }
      setIsEnriching(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Reconstruct nested data
    const structuredData = Object.keys(formData).reduce((acc, key) => {
        if (key.includes('.')) {
            const [parent, child] = key.split('.');
            if (!acc[parent]) acc[parent] = {};
            acc[parent][child] = formData[key];
        } else {
            acc[key] = formData[key];
        }
        return acc;
    }, {} as any);
    
    await onSave(structuredData);
    setIsLoading(false);
  };

  const renderField = (field: Field) => {
    const commonProps = {
        name: field.name,
        id: field.name,
        value: formData[field.name] || '',
        onChange: handleChange,
        required: field.required,
        className: "w-full bg-brand-primary border border-brand-border text-brand-text rounded-md p-2 focus:ring-brand-accent focus:border-brand-accent",
    };

    if (field.type === 'select') {
        return (
             <select {...commonProps}>
                {field.options?.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                ))}
            </select>
        );
    }
    return (
        <div className="relative">
            <input
                type={field.type}
                step={field.step}
                {...commonProps}
            />
        </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-brand-secondary rounded-lg shadow-2xl border border-brand-border w-full max-w-lg my-8 flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-6 pb-4 border-b border-brand-border sticky top-0 bg-brand-secondary z-10">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-brand-subtle hover:text-white text-3xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* Botões de Busca Automática */}
          {onAutoEnrich && (
            <div className="px-6 py-3 bg-brand-primary/30 border-b border-brand-border flex gap-2">
              {fields.some(f => f.autoEnrich === 'barcode') && formData.barcode && (
                <button
                  type="button"
                  onClick={() => handleAutoEnrich('barcode')}
                  disabled={isEnriching}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-md disabled:opacity-50 transition-colors"
                >
                  <BarcodeIcon className="w-4 h-4" />
                  {isEnriching ? 'Buscando...' : 'Buscar por Código de Barras'}
                </button>
              )}
              {fields.some(f => f.autoEnrich === 'fiscal') && (formData.name || formData.description) && (
                <button
                  type="button"
                  onClick={() => handleAutoEnrich('fiscal')}
                  disabled={isEnriching}
                  className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-md disabled:opacity-50 transition-colors"
                >
                  <SparklesIcon className="w-4 h-4" />
                  {isEnriching ? 'Buscando...' : 'Buscar Dados Fiscais com IA'}
                </button>
              )}
            </div>
          )}
          
          <div className="overflow-y-auto px-6 py-4 space-y-4 flex-1">
            {fields.map((field) => (
              <div key={field.name}>
                <label htmlFor={field.name} className="block text-sm font-medium text-brand-subtle mb-1">{field.label}</label>
                {renderField(field)}
              </div>
            ))}
          </div>
          <div className="px-6 py-4 border-t border-brand-border bg-brand-secondary sticky bottom-0 flex justify-end gap-4">
            <button type="button" onClick={onClose} className="bg-brand-border text-white font-semibold px-4 py-2 rounded-md hover:bg-brand-border/70">
              Cancelar
            </button>
            <button type="submit" disabled={isLoading} className="bg-brand-accent text-white font-semibold px-4 py-2 rounded-md hover:bg-brand-accent/80 disabled:opacity-50">
              {isLoading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EntityFormModal;
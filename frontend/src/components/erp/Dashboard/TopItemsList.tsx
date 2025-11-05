import React from 'react';

interface TopItemsListProps {
    items: { name: string; value?: number; total?: number, quantity?: number }[];
    valueType: 'currency' | 'quantity';
}

const TopItemsList: React.FC<TopItemsListProps> = ({ items, valueType }) => {
    if (!items || items.length === 0) {
        return <div className="text-center text-brand-subtle py-8">Nenhum dado disponível.</div>
    }

    const values = items.map(item => item.value || item.total || 0);
    const maxValue = Math.max(...values, 1);

    return (
        <ul className="space-y-4">
            {items.map((item, index) => {
                const itemValue = item.value || item.total || 0;
                const percentage = maxValue > 0 ? (itemValue / maxValue) * 100 : 0;
                const displayValue = valueType === 'currency' 
                    ? itemValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    : `${item.quantity || 0} un`;

                return (
                    <li key={`${item.name}-${index}`}>
                        <div className="flex justify-between items-center mb-1 text-sm">
                            <span className="font-semibold text-brand-text truncate pr-2">{item.name || 'N/A'}</span>
                            <span className="text-brand-subtle font-mono">{displayValue}</span>
                        </div>
                        <div className="w-full bg-brand-primary/50 rounded-full h-2">
                            <div
                                className="bg-brand-accent h-2 rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                            />
                        </div>
                    </li>
                );
            })}
        </ul>
    );
};

export default TopItemsList;

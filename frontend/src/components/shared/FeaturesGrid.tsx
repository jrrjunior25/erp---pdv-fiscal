import React from 'react';
import Card from './Card';

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status?: 'active' | 'inactive' | 'coming-soon';
}

interface FeaturesGridProps {
  features: Feature[];
  columns?: 2 | 3 | 4;
  onFeatureClick?: (feature: Feature) => void;
}

/**
 * Grid de funcionalidades/features
 * Exibe cards de features em um layout de grid responsivo
 */
const FeaturesGrid: React.FC<FeaturesGridProps> = ({
  features,
  columns = 3,
  onFeatureClick,
}) => {
  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  const getStatusBadge = (status?: Feature['status']) => {
    if (!status || status === 'active') return null;

    const badges = {
      inactive: (
        <span className="px-2 py-1 text-xs rounded-full bg-gray-700 text-gray-300">
          Inativo
        </span>
      ),
      'coming-soon': (
        <span className="px-2 py-1 text-xs rounded-full bg-blue-700 text-blue-200">
          Em Breve
        </span>
      ),
    };

    return badges[status];
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-6`}>
      {features.map((feature) => (
        <Card
          key={feature.id}
          hoverable
          onClick={() => onFeatureClick?.(feature)}
          className={feature.status === 'inactive' ? 'opacity-60' : ''}
        >
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="text-brand-accent">{feature.icon}</div>
            
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-brand-text">
                {feature.title}
              </h3>
              {getStatusBadge(feature.status)}
            </div>

            <p className="text-sm text-brand-subtle">{feature.description}</p>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default FeaturesGrid;

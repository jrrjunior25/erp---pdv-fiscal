import React from 'react';

interface Phase {
  id: string;
  title: string;
  description: string;
  date?: string;
  status: 'completed' | 'in-progress' | 'pending';
}

interface PhasesTimelineProps {
  phases: Phase[];
  orientation?: 'vertical' | 'horizontal';
}

/**
 * Componente de Timeline de Fases
 * Exibe o progresso de fases de um projeto ou processo
 */
const PhasesTimeline: React.FC<PhasesTimelineProps> = ({
  phases,
  orientation = 'vertical',
}) => {
  const getStatusColor = (status: Phase['status']) => {
    const colors = {
      completed: 'bg-green-500',
      'in-progress': 'bg-blue-500',
      pending: 'bg-gray-600',
    };
    return colors[status];
  };

  const getStatusIcon = (status: Phase['status']) => {
    if (status === 'completed') {
      return (
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      );
    }
    if (status === 'in-progress') {
      return (
        <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
      );
    }
    return <div className="w-3 h-3 bg-gray-400 rounded-full" />;
  };

  if (orientation === 'horizontal') {
    return (
      <div className="flex items-start justify-between">
        {phases.map((phase, index) => (
          <div key={phase.id} className="flex-1">
            <div className="flex flex-col items-center">
              {/* Circle */}
              <div
                className={`w-10 h-10 rounded-full ${getStatusColor(
                  phase.status
                )} flex items-center justify-center`}
              >
                {getStatusIcon(phase.status)}
              </div>

              {/* Content */}
              <div className="mt-4 text-center">
                <h4 className="font-semibold text-brand-text">{phase.title}</h4>
                <p className="text-sm text-brand-subtle mt-1">{phase.description}</p>
                {phase.date && (
                  <p className="text-xs text-brand-subtle mt-2">{phase.date}</p>
                )}
              </div>
            </div>

            {/* Connecting Line */}
            {index < phases.length - 1 && (
              <div className="flex items-center justify-center mt-5">
                <div className="w-full h-1 bg-brand-border" />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Vertical orientation
  return (
    <div className="space-y-8">
      {phases.map((phase, index) => (
        <div key={phase.id} className="relative">
          <div className="flex items-start gap-4">
            {/* Circle and Line */}
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full ${getStatusColor(
                  phase.status
                )} flex items-center justify-center flex-shrink-0`}
              >
                {getStatusIcon(phase.status)}
              </div>
              {index < phases.length - 1 && (
                <div className="w-1 h-16 bg-brand-border mt-2" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pt-1">
              <h4 className="font-semibold text-brand-text">{phase.title}</h4>
              <p className="text-sm text-brand-subtle mt-1">{phase.description}</p>
              {phase.date && (
                <p className="text-xs text-brand-subtle mt-2">{phase.date}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PhasesTimeline;

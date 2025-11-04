import React from 'react';
import Card from './Card';
import PhasesTimeline from './PhasesTimeline';

interface ProjectMetric {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'stable';
}

interface ProjectOverviewProps {
  projectName: string;
  description: string;
  metrics: ProjectMetric[];
  phases?: Array<{
    id: string;
    title: string;
    description: string;
    date?: string;
    status: 'completed' | 'in-progress' | 'pending';
  }>;
}

/**
 * Componente de Visão Geral do Projeto
 * Exibe informações consolidadas sobre o projeto, métricas e progresso
 */
const ProjectOverview: React.FC<ProjectOverviewProps> = ({
  projectName,
  description,
  metrics,
  phases,
}) => {
  const getTrendIcon = (trend?: ProjectMetric['trend']) => {
    if (!trend || trend === 'stable') return null;

    if (trend === 'up') {
      return (
        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
            clipRule="evenodd"
          />
        </svg>
      );
    }

    return (
      <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
          clipRule="evenodd"
        />
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-brand-text">{projectName}</h1>
            <p className="text-brand-subtle mt-2">{description}</p>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
            {metrics.map((metric, index) => (
              <div
                key={index}
                className="bg-brand-primary p-4 rounded-lg border border-brand-border"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-brand-subtle">{metric.label}</p>
                  {getTrendIcon(metric.trend)}
                </div>
                <p className="text-2xl font-bold text-brand-text mt-2">
                  {metric.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Timeline */}
      {phases && phases.length > 0 && (
        <Card title="Progresso do Projeto">
          <PhasesTimeline phases={phases} />
        </Card>
      )}
    </div>
  );
};

export default ProjectOverview;

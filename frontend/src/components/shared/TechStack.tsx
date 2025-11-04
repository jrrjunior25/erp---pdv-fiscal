import React from 'react';
import Card from './Card';

interface Technology {
  name: string;
  category: 'Frontend' | 'Backend' | 'Database' | 'DevOps' | 'Tools';
  version?: string;
  description?: string;
  icon?: React.ReactNode;
}

interface TechStackProps {
  technologies: Technology[];
  title?: string;
}

/**
 * Componente de Stack Tecnológico
 * Exibe as tecnologias utilizadas no projeto organizadas por categoria
 */
const TechStack: React.FC<TechStackProps> = ({
  technologies,
  title = 'Stack Tecnológico',
}) => {
  const categories = [
    'Frontend',
    'Backend',
    'Database',
    'DevOps',
    'Tools',
  ] as const;

  const groupedTech = categories.reduce(
    (acc, category) => {
      acc[category] = technologies.filter((tech) => tech.category === category);
      return acc;
    },
    {} as Record<string, Technology[]>
  );

  const getCategoryColor = (category: Technology['category']) => {
    const colors = {
      Frontend: 'bg-blue-900 text-blue-200 border-blue-700',
      Backend: 'bg-green-900 text-green-200 border-green-700',
      Database: 'bg-purple-900 text-purple-200 border-purple-700',
      DevOps: 'bg-orange-900 text-orange-200 border-orange-700',
      Tools: 'bg-gray-800 text-gray-200 border-gray-700',
    };
    return colors[category];
  };

  const getCategoryIcon = (category: Technology['category']) => {
    const icons = {
      Frontend: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14 8a1 1 0 11-2 0 1 1 0 012 0zM8 8a1 1 0 11-2 0 1 1 0 012 0zM2 13a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2zM14 15a1 1 0 11-2 0 1 1 0 012 0zM8 15a1 1 0 11-2 0 1 1 0 012 0z" />
        </svg>
      ),
      Backend: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z"
            clipRule="evenodd"
          />
        </svg>
      ),
      Database: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
          <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
          <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
        </svg>
      ),
      DevOps: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
            clipRule="evenodd"
          />
        </svg>
      ),
      Tools: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
            clipRule="evenodd"
          />
        </svg>
      ),
    };
    return icons[category];
  };

  return (
    <Card title={title}>
      <div className="space-y-6">
        {categories.map((category) => {
          const techs = groupedTech[category];
          if (!techs || techs.length === 0) return null;

          return (
            <div key={category}>
              <div className="flex items-center gap-2 mb-3">
                <div
                  className={`p-2 rounded-lg ${getCategoryColor(category)} border`}
                >
                  {getCategoryIcon(category)}
                </div>
                <h3 className="font-semibold text-brand-text">{category}</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pl-10">
                {techs.map((tech, index) => (
                  <div
                    key={index}
                    className="bg-brand-primary p-3 rounded-lg border border-brand-border hover:border-brand-accent transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {tech.icon}
                          <h4 className="font-medium text-brand-text">
                            {tech.name}
                          </h4>
                        </div>
                        {tech.version && (
                          <p className="text-xs text-brand-subtle mt-1">
                            v{tech.version}
                          </p>
                        )}
                        {tech.description && (
                          <p className="text-sm text-brand-subtle mt-2">
                            {tech.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default TechStack;

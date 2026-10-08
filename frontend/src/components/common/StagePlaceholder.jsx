import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { ArrowLeft, Clock, Layers, ShieldCheck } from 'lucide-react';

export function StagePlaceholder({
  title,
  stage = 'Stage 2+',
  description = 'This route foundation has been established in Stage 1 and will be populated in subsequent frontend stages.',
  expectedIn = 'Next Stage',
}) {
  const location = useLocation();

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Card hover={false} className="border-slate-200">
        <CardHeader className="bg-slate-50/50 rounded-t-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" size="md" icon={<Layers className="w-3.5 h-3.5" />}>
                {stage}
              </Badge>
              <Badge variant="outline" size="md" icon={<Clock className="w-3.5 h-3.5" />}>
                Reserved Route
              </Badge>
            </div>
            <span className="text-xs font-mono text-slate-400 bg-white px-2.5 py-1 rounded-md border border-slate-200">
              {location.pathname}
            </span>
          </div>

          <CardTitle className="mt-3 text-xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="p-4 rounded-xl bg-pitch-surface-1 border border-pitch-surface-2 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-pitch-blue shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 leading-relaxed">
              <p className="font-semibold text-pitch-navy mb-1">
                Foundation & Architecture Ready
              </p>
              <p>
                API service modules, authentication guards, role routing, and UI primitives for this
                route are active and operational. Feature implementation is scheduled for {expectedIn}{' '}
                per the project stage roadmap.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Link to="/">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Return to Public Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default StagePlaceholder;

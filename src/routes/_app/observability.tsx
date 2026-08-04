import { createFileRoute } from '@tanstack/react-router';
import { ObservabilityPage } from '@/components/observability';

export const Route = createFileRoute('/_app/observability')({
  component: ObservabilityPage,
});

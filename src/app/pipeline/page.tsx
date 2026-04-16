import { Metadata } from 'next';
import { PipelineBoard } from '@/components/pipeline/PipelineBoard';

export const metadata: Metadata = {
  title: 'Job Pipeline — JobSearch',
};

export default function PipelinePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PipelineBoard />
    </div>
  );
}

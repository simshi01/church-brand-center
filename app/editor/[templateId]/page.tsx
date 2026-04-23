import { notFound } from 'next/navigation';
import { getTemplate } from '@/templates/registry';
import Editor from '@/components/Editor/Editor';

interface EditorPageProps {
  params: { templateId: string };
}

export default function EditorPage({ params }: EditorPageProps) {
  const entry = getTemplate(params.templateId);
  if (!entry) notFound();

  return <Editor config={entry.config} />;
}

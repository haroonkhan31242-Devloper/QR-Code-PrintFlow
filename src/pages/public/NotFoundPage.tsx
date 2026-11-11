import { FileQuestion } from 'lucide-react';
import { Link, useDocumentTitle } from '../../lib/router';
import { Card, EmptyState } from '../../components/ui';
import { PublicShell } from './PublicShell';

export function NotFoundPage({ embedded = false }: { embedded?: boolean }) {
  useDocumentTitle('Page not found');
  const body = (
    <Card>
      <EmptyState
        icon={<FileQuestion className="size-6" />}
        title="Page not found"
        description="The page you are looking for does not exist or has moved."
        action={
          <Link to={embedded ? (location.pathname.startsWith('/admin') ? '/admin' : '/shop') : '/'} className="text-sm font-semibold text-gold-ink hover:underline">
            Go back home
          </Link>
        }
      />
    </Card>
  );
  if (embedded) return body;
  return (
    <PublicShell>
      <div className="mx-auto max-w-lg px-4 py-16">{body}</div>
    </PublicShell>
  );
}

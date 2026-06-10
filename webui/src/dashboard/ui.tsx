import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  Input,
  ResultSummaryPanel,
  ToastMessage,
  useToastMessage,
} from '@byte-v-forge/common-ui';
export type { ResultTone } from '@byte-v-forge/common-ui';

export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

export function LoadingText({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />{children}</span>;
}

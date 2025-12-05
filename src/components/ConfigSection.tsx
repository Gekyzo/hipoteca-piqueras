import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { t } from '@/i18n';

interface ConfigSectionProps {
  onConnect: (url: string, key: string) => void;
  savedUrl?: string;
  savedKey?: string;
}

export function ConfigSection({
  onConnect,
  savedUrl = '',
  savedKey = '',
}: ConfigSectionProps) {
  const [url, setUrl] = useState(savedUrl);
  const [key, setKey] = useState(savedKey);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim() && key.trim()) {
      onConnect(url.trim(), key.trim());
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{t.config.title}</CardTitle>
        <CardDescription>{t.config.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="supabaseUrl">{t.config.supabaseUrl}</Label>
            <Input
              id="supabaseUrl"
              type="text"
              placeholder={t.config.urlPlaceholder}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supabaseKey">{t.config.supabaseKey}</Label>
            <Input
              id="supabaseKey"
              type="text"
              placeholder={t.config.keyPlaceholder}
              value={key}
              onChange={(e) => setKey(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full">
            {t.config.saveAndConnect}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

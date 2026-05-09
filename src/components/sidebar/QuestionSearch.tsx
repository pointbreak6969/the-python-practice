'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function QuestionSearch({ value, onChange }: Props) {
  return (
    <div className="relative px-2 py-2">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
      <Input
        type="search"
        placeholder="Search questions…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-7 h-8 text-xs"
      />
    </div>
  );
}

'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface Props {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function MobileDrawer({ open, onClose, children }: Props) {
  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <SheetContent side="left" className="p-0 w-80 max-w-[85vw] flex flex-col" showCloseButton>
        <SheetHeader className="px-4 py-3 border-b border-border">
          <SheetTitle className="text-sm">Questions</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-hidden flex flex-col">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}

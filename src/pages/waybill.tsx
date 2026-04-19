import { useState, useMemo } from 'react';
import { Search, Download, Send, CheckCircle, Filter, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { DataTable } from '@/components/DataTable';
import * as dataStore from '@/data/index';
import * as lib from '@/lib/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { springPresets } from '@/lib/motion';

type Receipt = lib.Receipt;

export default function Receipts() {
  const receiptSeed: Receipt[] = Array.isArray(dataStore.mockReceipts)
    ? (dataStore.mockReceipts as Receipt[])
    : [];

  const [receipts] = useState<Receipt[]>(receiptSeed);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedReceipts, setSelectedReceipts] = useState<Set<string>>(new Set());
  const [viewReceiptDialog, setViewReceiptDialog] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [markPaidDialog, setMarkPaidDialog] = useState(false);
  const [sendReminderDialog, setSendReminderDialog] = useState(false);
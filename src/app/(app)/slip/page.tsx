
'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeaderCard } from '@/components/shared/PageHeaderCard';
import { getPaymentSlips, getPatients, formatDate, formatCurrency, PAYMENT_METHOD_LABELS, getPaymentMethodLabel } from '@/lib/localStorage';
import type { PaymentSlip, Patient, PaymentMethod } from '@/lib/types';
import { PaymentSlipModal } from '@/components/slip/PaymentSlipModal';
import { Eye, Loader2, SearchIcon as SearchIconLucide, Filter } from 'lucide-react';

interface EnrichedSlip extends PaymentSlip {
  patientName?: string;
}

const paymentMethodFilterOptions: { value: PaymentMethod | 'all'; label: string }[] = [
  { value: 'all', label: 'সকল মাধ্যম' },
  ...Object.entries(PAYMENT_METHOD_LABELS)
    .filter(([key]) => key !== '') // Exclude the empty key if it exists for type completeness
    .map(([value, label]) => ({ value: value as Exclude<PaymentMethod, ''>, label }))
];


export default function SlipSearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPaymentMethodFilter, setSelectedPaymentMethodFilter] = useState<PaymentMethod | 'all'>('all');
  const [allSlips, setAllSlips] = useState<EnrichedSlip[]>([]);
  const [filteredSlips, setFilteredSlips] = useState<EnrichedSlip[]>([]);
  const [selectedSlip, setSelectedSlip] = useState<EnrichedSlip | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const slipsData = getPaymentSlips();
    const patientsData = getPatients();

    const enrichedSlipsData = slipsData.map(slip => {
      const patient = patientsData.find(p => p.id === slip.patientId);
      return { ...slip, patientName: patient?.name || 'Unknown Patient' };
    }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setAllSlips(enrichedSlipsData);
    setFilteredSlips(enrichedSlipsData);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let results = allSlips;

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      results = results.filter(slip =>
        slip.patientName?.toLowerCase().includes(lowerSearchTerm) ||
        slip.slipNumber.toLowerCase().includes(lowerSearchTerm) ||
        slip.purpose.toLowerCase().includes(lowerSearchTerm)
      );
    }

    if (selectedPaymentMethodFilter !== 'all') {
      results = results.filter(slip => slip.paymentMethod === selectedPaymentMethodFilter);
    }

    setFilteredSlips(results);
  }, [searchTerm, selectedPaymentMethodFilter, allSlips]);

  const handleViewSlip = (slip: EnrichedSlip) => {
    setSelectedSlip(slip);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeaderCard
        title="পেমেন্ট স্লিপ অনুসন্ধান"
        description="রোগীর নাম, স্লিপ আইডি, বা উদ্দেশ্য দ্বারা পেমেন্ট স্লিপ খুঁজুন।"
      />

      <div className="flex flex-col md:flex-row gap-3 items-center">
        <div className="flex h-10 items-center w-full rounded-md border border-input bg-card shadow-inner overflow-hidden focus-within:ring-1 focus-within:ring-ring focus-within:border-primary flex-1">
          <div className="pl-3 pr-2 flex items-center pointer-events-none">
              <SearchIconLucide className="h-5 w-5 text-muted-foreground" />
          </div>
          <Input
              type="text"
              placeholder="রোগীর নাম, স্লিপ আইডি, উদ্দেশ্য দিয়ে খুঁজুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-full flex-1 border-0 bg-transparent shadow-none focus:ring-0 focus-visible:ring-0 px-2 text-base placeholder-muted-foreground"
              aria-label="Search payment slips"
          />
        </div>
        <div className="w-full md:w-auto md:min-w-[200px]">
          <Select
            value={selectedPaymentMethodFilter}
            onValueChange={(value) => setSelectedPaymentMethodFilter(value as PaymentMethod | 'all')}
          >
            <SelectTrigger className="h-10">
              <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="পেমেন্ট মাধ্যম ফিল্টার" />
            </SelectTrigger>
            <SelectContent>
              {paymentMethodFilterOptions.map(option => (
                <SelectItem key={option.value} value={option.value || 'all'}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>


      {isLoading ? (
         <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">স্লিপ লোড হচ্ছে...</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>স্লিপ আইডি</TableHead>
                <TableHead>তারিখ</TableHead>
                <TableHead>রোগীর নাম</TableHead>
                <TableHead>উদ্দেশ্য</TableHead>
                <TableHead>পেমেন্ট মাধ্যম</TableHead>
                <TableHead className="text-right">পরিমাণ</TableHead>
                <TableHead className="text-right">কার্যক্রম</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSlips.length > 0 ? (
                filteredSlips.map((slip) => (
                  <TableRow key={slip.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono">{slip.slipNumber}</TableCell>
                    <TableCell>{formatDate(slip.date)}</TableCell>
                    <TableCell className="font-medium">{slip.patientName}</TableCell>
                    <TableCell>{slip.purpose}</TableCell>
                    <TableCell>{getPaymentMethodLabel(slip.paymentMethod)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(slip.amount)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleViewSlip(slip)} title="স্লিপ দেখুন">
                        <Eye className="h-5 w-5 text-primary" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    কোনো পেমেন্ট স্লিপ খুঁজে পাওয়া যায়নি।
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {selectedSlip && (
        <PaymentSlipModal
          slip={selectedSlip}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}

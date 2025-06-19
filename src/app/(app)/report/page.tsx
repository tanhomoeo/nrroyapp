
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeaderCard } from '@/components/shared/PageHeaderCard';
import { getVisits, getPatients, getPaymentSlips, formatDate, formatCurrency, getClinicSettings, PAYMENT_METHOD_LABELS, getPaymentMethodLabel, getWeekRange, getMonthRange } from '@/lib/firestoreService'; // UPDATED IMPORT
import type { Visit, Patient, PaymentSlip, ClinicSettings, PaymentMethod } from '@/lib/types';
import { CalendarIcon, Printer, Loader2, Filter } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isValid } from 'date-fns';
import { bn } from 'date-fns/locale';
import { APP_NAME } from '@/lib/constants';

interface ReportData {
  visit: Visit;
  patient?: Patient;
  slips: PaymentSlip[];
  totalAmountFromSlips: number;
}

type ReportType = 'daily' | 'weekly' | 'monthly' | 'custom';

const reportTypeOptions: { value: ReportType; label: string }[] = [
  { value: 'daily', label: 'দৈনিক প্রতিবেদন' },
  { value: 'weekly', label: 'সাপ্তাহিক প্রতিবেদন' },
  { value: 'monthly', label: 'মাসিক প্রতিবেদন' },
  { value: 'custom', label: 'কাস্টম তারিখ পরিসীমা' },
];

const paymentMethodFilterOptions: { value: PaymentMethod | 'all'; label: string }[] = [
  { value: 'all', label: 'সকল পেমেন্ট মাধ্যম' },
  ...Object.entries(PAYMENT_METHOD_LABELS)
    .filter(([key]) => key !== '')
    .map(([value, label]) => ({ value: value as Exclude<PaymentMethod, ''>, label }))
];

export default function EnhancedReportPage() {
  const [reportType, setReportType] = useState<ReportType>('daily');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date()); // Used for date picker anchor
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<PaymentMethod | 'all'>('all');
  const [courierDeliveryOnly, setCourierDeliveryOnly] = useState(false);

  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [summary, setSummary] = useState({ totalVisits: 0, totalRevenue: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [clinicSettings, setClinicSettings] = useState<ClinicSettings | null>(null);
  const [clientRenderedTimestamp, setClientRenderedTimestamp] = useState<Date | null>(null);

  useEffect(() => {
    setClientRenderedTimestamp(new Date());
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      const settings = await getClinicSettings();
      setClinicSettings(settings);
    };
    fetchSettings();
  }, []);

  const generateReport = useCallback(async () => {
    setIsLoading(true);

    const [allVisits, allPatients, allSlips] = await Promise.all([
        getVisits(),
        getPatients(),
        getPaymentSlips()
    ]);

    let dateFilteredVisits: Visit[] = [];
    let currentReportStartDate: Date = new Date();
    let currentReportEndDate: Date = new Date();
    currentReportStartDate.setHours(0, 0, 0, 0);
    currentReportEndDate.setHours(23, 59, 59, 999);

    if (reportType === 'daily' && startDate) {
      currentReportStartDate = new Date(startDate);
      currentReportStartDate.setHours(0,0,0,0);
      currentReportEndDate = new Date(startDate);
      currentReportEndDate.setHours(23,59,59,999);
    } else if (reportType === 'weekly' && startDate) {
      const { start, end } = getWeekRange(startDate);
      currentReportStartDate = start;
      currentReportEndDate = end;
    } else if (reportType === 'monthly' && startDate) {
      const { start, end } = getMonthRange(startDate);
      currentReportStartDate = start;
      currentReportEndDate = end;
    } else if (reportType === 'custom' && startDate && endDate && startDate <= endDate) {
      currentReportStartDate = new Date(startDate);
      currentReportStartDate.setHours(0,0,0,0);
      currentReportEndDate = new Date(endDate);
      currentReportEndDate.setHours(23,59,59,999);
    } else {
        setReportData([]);
        setSummary({ totalVisits: 0, totalRevenue: 0 });
        setIsLoading(false);
        return;
    }

    dateFilteredVisits = allVisits.filter(visit => {
        const visitDate = new Date(visit.visitDate);
        return visitDate >= currentReportStartDate && visitDate <= currentReportEndDate;
    });

    let processedVisits = dateFilteredVisits;

    if (courierDeliveryOnly) {
      processedVisits = processedVisits.filter(visit => visit.medicineDeliveryMethod === 'courier');
    }

    const data: ReportData[] = processedVisits.map(visit => {
      const patient = allPatients.find(p => p.id === visit.patientId);
      let visitSlips = allSlips.filter(s =>
        s.visitId === visit.id &&
        new Date(s.date) >= currentReportStartDate && // Also filter slips by the report date range
        new Date(s.date) <= currentReportEndDate
      );

      if (paymentMethodFilter !== 'all') {
        visitSlips = visitSlips.filter(s => s.paymentMethod === paymentMethodFilter);
      }

      const totalAmountFromSlips = visitSlips.reduce((acc, slip) => acc + slip.amount, 0);

      return { visit, patient, slips: visitSlips, totalAmountFromSlips };
    }).filter(item => { // Ensure items are filtered out if no slips match paymentMethodFilter
        if (paymentMethodFilter !== 'all') {
            return item.slips.length > 0; // Only include if there are slips matching the filter
        }
        return true; // Include all items if filter is 'all'
    });

    setReportData(data.sort((a,b) => new Date(a.visit.visitDate).getTime() - new Date(b.visit.visitDate).getTime() || (a.patient?.name || '').localeCompare(b.patient?.name || '', 'bn')));

    const totalRevenue = data.reduce((acc, item) => acc + item.totalAmountFromSlips, 0);
    setSummary({ totalVisits: data.length, totalRevenue });
    setIsLoading(false);
  }, [startDate, endDate, reportType, paymentMethodFilter, courierDeliveryOnly]);

  useEffect(() => {
    const today = new Date();
    if (reportType === 'daily') {
        setStartDate(selectedDate);
        setEndDate(selectedDate);
    } else if (reportType === 'weekly') {
        const { start, end } = getWeekRange(selectedDate);
        setStartDate(start);
        setEndDate(end);
    } else if (reportType === 'monthly') {
        const { start, end } = getMonthRange(selectedDate);
        setStartDate(start);
        setEndDate(end);
    } else if (reportType === 'custom') {
        if (!startDate) setStartDate(today);
        if (!endDate) setEndDate(today);
    }
  }, [reportType, selectedDate, startDate, endDate]);


  useEffect(() => {
    if ((reportType === 'custom' && startDate && endDate) || (reportType !== 'custom' && startDate)) {
        generateReport();
    }
  }, [startDate, endDate, reportType, paymentMethodFilter, courierDeliveryOnly, generateReport]);


  const handlePrintReport = () => {
    if (typeof window !== 'undefined') {
      const elementsToHide = document.querySelectorAll('.hide-on-print');
      elementsToHide.forEach(el => (el as HTMLElement).style.display = 'none');
      document.body.classList.add('printing-report-active');
      window.print();
      document.body.classList.remove('printing-report-active');
      elementsToHide.forEach(el => (el as HTMLElement).style.display = '');
    }
  };

  const getReportDateRangeString = (): string => {
    if (!startDate) return "N/A";
    if (reportType === 'daily') return format(startDate, "eeee, dd MMMM, yyyy", { locale: bn });
    if (reportType === 'weekly') {
      const { start, end } = getWeekRange(startDate);
      return `${format(start, "dd MMM", { locale: bn })} - ${format(end, "dd MMM, yyyy", { locale: bn })}`;
    }
    if (reportType === 'monthly') return format(startDate, "MMMM, yyyy", { locale: bn });
    if (reportType === 'custom' && endDate && startDate <= endDate) {
      return `${format(startDate, "dd MMM, yyyy", { locale: bn })} থেকে ${format(endDate, "dd MMM, yyyy", { locale: bn })}`;
    }
    return format(startDate, "PPP", { locale: bn });
  };

  const pageTitle = reportTypeOptions.find(opt => opt.value === reportType)?.label || "প্রতিবেদন";
  const pageDescription = `তারিখ/পরিসীমা: ${getReportDateRangeString()}${paymentMethodFilter !== 'all' ? ` | পেমেন্ট: ${getPaymentMethodLabel(paymentMethodFilter as PaymentMethod)}` : ''}${courierDeliveryOnly ? ' | শুধু কুরিয়ার' : ''}`;

  return (
    <div className="space-y-6 print:space-y-2">
      <PageHeaderCard
        title={pageTitle}
        description={pageDescription}
        className="hide-on-print"
        actions={
          <Button onClick={handlePrintReport} variant="outline" disabled={isLoading}><Printer className="mr-2 h-4 w-4" /> প্রিন্ট করুন</Button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          <div className="space-y-1">
            <Label htmlFor="reportType">রিপোর্ট টাইপ</Label>
            <Select value={reportType} onValueChange={(value) => { setReportType(value as ReportType); setSelectedDate(new Date()); }}>
              <SelectTrigger id="reportType"><SelectValue /></SelectTrigger>
              <SelectContent>
                {reportTypeOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {reportType === 'daily' && (
            <div className="space-y-1">
              <Label htmlFor="dailyDate">তারিখ</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button id="dailyDate" variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate && isValid(startDate) ? format(startDate, "PPP", { locale: bn }) : <span>একটি তারিখ নির্বাচন করুন</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={startDate} onSelect={(date) => { setStartDate(date); setSelectedDate(date || new Date());}} initialFocus locale={bn} /></PopoverContent>
              </Popover>
            </div>
          )}
           {reportType === 'weekly' && (
            <div className="space-y-1">
              <Label htmlFor="weeklyDate">সপ্তাহের যেকোনো দিন</Label>
               <Popover>
                <PopoverTrigger asChild>
                  <Button id="weeklyDate" variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate && isValid(selectedDate) ? format(selectedDate, "PPP", { locale: bn }) : <span>একটি তারিখ নির্বাচন করুন</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={selectedDate} onSelect={(date) => setSelectedDate(date || new Date())} initialFocus locale={bn} /></PopoverContent>
              </Popover>
            </div>
          )}
          {reportType === 'monthly' && (
            <div className="space-y-1">
              <Label htmlFor="monthlyDate">মাসের যেকোনো দিন</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button id="monthlyDate" variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate && isValid(selectedDate) ? format(selectedDate, "MMMM yyyy", { locale: bn }) : <span>একটি মাস নির্বাচন করুন</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={selectedDate} onSelect={(date) => setSelectedDate(date || new Date())} initialFocus locale={bn} captionLayout="dropdown-buttons" fromYear={2020} toYear={new Date().getFullYear() + 5}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
          {reportType === 'custom' && (
            <>
              <div className="space-y-1">
                <Label htmlFor="startDateCustom">শুরুর তারিখ</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button id="startDateCustom" variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate && isValid(startDate) ? format(startDate, "PPP", { locale: bn }) : <span>শুরুর তারিখ</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus locale={bn} /></PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1">
                <Label htmlFor="endDateCustom">শেষ তারিখ</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button id="endDateCustom" variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate && isValid(endDate) ? format(endDate, "PPP", { locale: bn }) : <span>শেষ তারিখ</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus locale={bn} disabled={(date) => startDate ? date < startDate : false} /></PopoverContent>
                </Popover>
              </div>
            </>
          )}
           <div className="space-y-1">
            <Label htmlFor="paymentMethodFilter">পেমেন্ট মাধ্যম</Label>
            <Select value={paymentMethodFilter} onValueChange={(value) => setPaymentMethodFilter(value as PaymentMethod | 'all')}>
              <SelectTrigger id="paymentMethodFilter"><Filter className="mr-2 h-4 w-4 text-muted-foreground" /><SelectValue /></SelectTrigger>
              <SelectContent>
                {paymentMethodFilterOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2 pt-5">
            <Switch id="courierDeliveryOnly" checked={courierDeliveryOnly} onCheckedChange={setCourierDeliveryOnly} />
            <Label htmlFor="courierDeliveryOnly">শুধু কুরিয়ার ডেলিভারি</Label>
          </div>
        </div>
      </PageHeaderCard>

      <div className="print-only-block print-container bg-white text-black">
        <div className="print-header">
          <h1 className="font-headline text-xl font-bold">{clinicSettings?.clinicName || APP_NAME}</h1>
          {clinicSettings?.clinicAddress && <p className="text-xs">{clinicSettings.clinicAddress}</p>}
          {clinicSettings?.clinicContact && <p className="text-xs">যোগাযোগ: {clinicSettings.clinicContact}</p>}
          <h2 className="print-title text-lg font-semibold mt-1">{pageTitle}</h2>
          <p className="text-xs">{pageDescription}</p>
        </div>

        <div className="report-table-container">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30px] text-center">Sl.</TableHead>
                  <TableHead className="w-[90px]">Date</TableHead>
                  <TableHead>Patient Name</TableHead>
                  <TableHead className="print:hidden">Diary No.</TableHead>
                  <TableHead>Purpose/Symptoms</TableHead>
                  <TableHead className="w-[100px] print:w-[80px]">Payment Method</TableHead>
                  <TableHead className="text-right w-[70px]">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.length > 0 ? (
                  reportData.map((item, index) => (
                    <TableRow key={item.visit.id}>
                      <TableCell className="text-center">{index + 1}</TableCell>
                      <TableCell>{format(new Date(item.visit.visitDate), "dd/MM/yy", { locale: bn })}</TableCell>
                      <TableCell className="font-medium">{item.patient?.name || 'N/A'}</TableCell>
                      <TableCell className="print:hidden">{item.patient?.diaryNumber?.toLocaleString('bn-BD') || 'N/A'}</TableCell>
                      <TableCell className="print:max-w-[120px] print:whitespace-normal print:truncate">{item.visit.symptoms || item.slips.map(s=>s.purpose).join(', ') || 'N/A'}</TableCell>
                      <TableCell className="print:max-w-[70px] print:whitespace-normal print:truncate">
                        {item.slips.length > 0 ?
                          item.slips.map(s => getPaymentMethodLabel(s.paymentMethod)).filter((v, i, a) => a.indexOf(v) === i).join(', ') || '-' : '-'
                        }
                      </TableCell>
                      <TableCell className="text-right">{item.totalAmountFromSlips > 0 ? formatCurrency(item.totalAmountFromSlips) : '-'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      এই ফিল্টার অনুযায়ী কোনো ডেটা পাওয়া যায়নি।
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              <TableFooter>
                <TableRow className="font-bold bg-muted/50">
                  <TableCell colSpan={6} className="text-right print:col-span-5">মোট ভিজিট: {summary.totalVisits.toLocaleString('bn-BD')}</TableCell>
                  <TableCell className="text-right print:col-span-1" colSpan={1}>মোট আয়: {formatCurrency(summary.totalRevenue)}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
        </div>
         {/* Footer removed as per request */}
      </div>

      {isLoading && !reportData.length ? (
        <div className="flex justify-center items-center py-10 hide-on-print">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">রিপোর্ট ডেটা লোড হচ্ছে...</p>
        </div>
      ) : (
        <div className="hide-on-print">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card className="shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-lg font-headline">মোট ভিজিট</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-bold text-primary">{summary.totalVisits.toLocaleString('bn-BD')}</p></CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-lg font-headline">মোট আয়</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-bold text-primary">{formatCurrency(summary.totalRevenue)}</p></CardContent>
            </Card>
          </div>
          <div className="overflow-x-auto rounded-lg border shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px] text-center">Sl.</TableHead>
                  <TableHead className="w-[100px]">Date</TableHead>
                  <TableHead>Patient Name</TableHead>
                  <TableHead>Diary No.</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Symptoms/Purpose</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.length > 0 ? (
                  reportData.map((item, index) => (
                    <TableRow key={item.visit.id}>
                      <TableCell className="text-center">{index + 1}</TableCell>
                      <TableCell>{formatDate(item.visit.visitDate)}</TableCell>
                      <TableCell className="font-medium">{item.patient?.name || 'N/A'}</TableCell>
                      <TableCell>{item.patient?.diaryNumber?.toLocaleString('bn-BD') || 'N/A'}</TableCell>
                      <TableCell>{item.patient?.phone || 'N/A'}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{item.visit.symptoms || item.slips.map(s=>s.purpose).join(', ') || 'N/A'}</TableCell>
                       <TableCell className="max-w-[100px] truncate">
                         {item.slips.length > 0 ?
                            item.slips.map(s => getPaymentMethodLabel(s.paymentMethod)).filter((v, i, a) => a.indexOf(v) === i).join(', ') || '-' : '-'
                         }
                       </TableCell>
                      <TableCell className="text-right">{item.totalAmountFromSlips > 0 ? formatCurrency(item.totalAmountFromSlips) : '-'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                     এই ফিল্টার অনুযায়ী কোনো ডেটা পাওয়া যায়নি।
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              <TableFooter>
                <TableRow className="font-bold bg-muted/50 dark:bg-muted/30">
                  <TableCell colSpan={7} className="text-right">মোট</TableCell>
                  <TableCell className="text-right">{formatCurrency(summary.totalRevenue)}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </div>
      )}

       <style jsx global>{`
        .print-only-block { display: none; }
        @media print {
          .hide-on-print { display: none !important; }
          .print-only-block { display: block !important; }
          body.printing-report-active {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            margin: 0; padding: 0;
            background-color: #fff !important;
          }
          .print-container {
            width: 100%;
            margin: 0 auto;
            padding: 5mm;
            box-sizing: border-box;
            font-family: 'PT Sans', Arial, sans-serif;
            font-size: 8.5pt;
            line-height: 1.2;
            color: #000 !important;
          }
          .print-header { text-align: center; margin-bottom: 4mm; border-bottom: 1px solid #666; padding-bottom: 2mm; }
          .print-header h1 { font-size: 12pt; }
          .print-header p { font-size: 7.5pt; }
          .print-title { font-size: 10pt; }
          .report-table-container table { width: 100%; border-collapse: collapse; margin-top: 2mm; }
          .report-table-container th, .report-table-container td { border: 1px solid #bbb; padding: 1mm 1.5mm; text-align: left; vertical-align: top; font-size:8pt; word-break: break-word; }
          .report-table-container th { background-color: #f0f0f0 !important; font-weight: bold; }
          .report-table-container td.text-right, .report-table-container th.text-right { text-align: right; }
          .report-table-container td.text-center, .report-table-container th.text-center { text-align: center; }
          /* Footer removed as per request */
          .print\\:hidden { display: none !important; }
          .print\\:max-w-\\[120px\\] { max-width: 120px !important; }
          .print\\:max-w-\\[70px\\] { max-width: 70px !important; }
          .print\\:whitespace-normal { white-space: normal !important; }
          .print\\:truncate { overflow: visible !important; white-space: normal !important; text-overflow: clip !important; }
          .print\\:col-span-5 { grid-column: span 5 / span 5 !important; }
          .print\\:col-span-1 { grid-column: span 1 / span 1 !important; }
          .print\\:w-\\[80px\\] { width: 80px !important; }
        }
        @page {
          size: A4 landscape;
          margin: 10mm;
        }
      `}</style>
    </div>
  );
}

    
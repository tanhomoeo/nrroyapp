
'use client';
import React, { useEffect, useState, useCallback, Suspense, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
    Users, UserPlus, FileText, BarChart3, TrendingUp, Search as SearchIcon, Printer, CalendarDays, X, Loader2,
    MessageSquareText, PlayCircle, CreditCard, ClipboardList, FilePlus2
} from 'lucide-react';
import {
    getPatients,
    getVisitsWithinDateRange,
    getPaymentSlipsWithinDateRange,
    getPatientsRegisteredWithinDateRange,
    formatCurrency,
    getPatientById,
    getPaymentMethodLabel
} from '@/lib/firestoreService';
import type { ClinicStats, Patient, Visit, PaymentSlip, PaymentMethod } from '@/lib/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ROUTES, APP_NAME } from '@/lib/constants';
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, isToday as isTodayFns, isValid } from 'date-fns';
import { bn } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MicrophoneButton } from '@/components/shared/MicrophoneButton';
import { appendFinalTranscript } from '@/lib/utils';

const CreatePaymentSlipModal = dynamic(() =>
  import('@/components/slip/CreatePaymentSlipModal').then((mod) => mod.CreatePaymentSlipModal),
  {
    ssr: false,
    loading: () => <div className="flex justify-center items-center p-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /> <span className="ml-2">পেমেন্ট মডাল লোড হচ্ছে...</span></div>
  }
);

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  className?: string;
  textColorClass?: string;
  href: string;
}

const QuickActionCardMemoized: React.FC<QuickActionCardProps> = React.memo(({ title, description, icon: Icon, className, textColorClass = 'text-white', href }) => (
  <Link href={href} className={`block rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 p-6 transform hover:-translate-y-1 ${className} ${textColorClass}`}>
    <div className="flex items-center mb-3">
      <Icon className="h-8 w-8 mr-3" />
      <h3 className="text-xl font-headline font-semibold">{title}</h3>
    </div>
    <p className="text-sm opacity-90">{description}</p>
  </Link>
));
QuickActionCardMemoized.displayName = 'QuickActionCard';


interface ActivityStat {
  label: string;
  value: string | number;
  icon?: React.ElementType;
}

interface ActivityCardProps {
  title: string;
  stats: ActivityStat[];
  className?: string;
  textColorClass?: string;
  detailsLink?: string;
  icon?: React.ElementType;
}

const ActivityCardMemoized: React.FC<ActivityCardProps> = React.memo(({ title, stats, className, textColorClass = 'text-white', detailsLink, icon: TitleIcon }) => (
  <Card className={`shadow-lg hover:shadow-xl transition-all duration-300 ${className} ${textColorClass} overflow-hidden transform hover:-translate-y-1`}>
    <CardHeader className="pb-2">
      <div className="flex items-center">
        {TitleIcon && <TitleIcon className="h-6 w-6 mr-2" />}
        <CardTitle className={`text-lg font-headline ${textColorClass}`}>{title}</CardTitle>
      </div>
    </CardHeader>
    <CardContent className="space-y-2 py-4">
      {stats.map((stat, index) => (
        <div key={index} className="flex items-center text-sm">
          {stat.icon && <stat.icon className="h-4 w-4 mr-2 opacity-80" />}
          <span>{stat.label}: </span>
          <span className="font-semibold ml-1">{stat.value}</span>
        </div>
      ))}
      {detailsLink && (
        <Link href={detailsLink} className={`mt-3 inline-block text-sm ${textColorClass} opacity-90 hover:opacity-100 hover:underline`}>
          বিস্তারিত দেখুন &rarr;
        </Link>
      )}
    </CardContent>
  </Card>
));
ActivityCardMemoized.displayName = 'ActivityCard';

interface AppointmentDisplayItem {
  visitId: string;
  patient: Patient;
  patientName: string;
  diaryNumberDisplay: string;
  address: string;
  time: string;
  reason: string;
  status: 'Completed' | 'Pending';
  paymentMethod?: string;
  paymentAmount?: string;
  createdAt: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<ClinicStats>({
    totalPatients: 0,
    todayPatientCount: 0,
    monthlyPatientCount: 0,
    todayRevenue: 0,
    monthlyIncome: 0,
    dailyActivePatients: 0,
    dailyOtherRegistered: 0,
    monthlyNewPatients:0,
    monthlyTotalRegistered:0,
  });
  const [loading, setLoading] = useState(true);
  const [todaysAppointments, setTodaysAppointments] = useState<AppointmentDisplayItem[]>([]);
  const [dashboardSearchTerm, setDashboardSearchTerm] = useState('');
  const router = useRouter();

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPatientForPaymentModal, setSelectedPatientForPaymentModal] = useState<Patient | null>(null);
  const [currentVisitIdForPaymentModal, setCurrentVisitIdForPaymentModal] = useState<string | null>(null);

  const [isListeningGlobal, setIsListeningGlobal] = useState(false);
  const [currentListeningField, setCurrentListeningField] = useState<string | null>(null);
  const [clientRenderedTimestamp, setClientRenderedTimestamp] = useState<Date | null>(null);

  useEffect(() => {
    setClientRenderedTimestamp(new Date());
  }, []);


  const loadAppointments = useCallback(async () => {
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    const todayVisits = await getVisitsWithinDateRange(todayStart, todayEnd);
    const todaySlips = await getPaymentSlipsWithinDateRange(todayStart, todayEnd);

    const patientIdsForTodayVisits = Array.from(new Set(todayVisits.map(v => v.patientId)));
    const patientsData: Record<string, Patient> = {};

    for (const patientId of patientIdsForTodayVisits) {
        if (!patientsData[patientId]) {
            const patient = await getPatientById(patientId);
            if (patient) patientsData[patientId] = patient;
        }
    }

    const appointmentsDataPromises: Promise<AppointmentDisplayItem | null>[] = todayVisits
      .map(async visit => {
        const patient = patientsData[visit.patientId];
        if (!patient) return null;

        const paymentSlipForVisit = todaySlips.find(s => s.visitId === visit.id && (s.amount ?? 0) > 0);
        const currentStatus: 'Completed' | 'Pending' = paymentSlipForVisit ? 'Completed' : 'Pending';

        const visitCreatedAtDate = visit.createdAt ? new Date(visit.createdAt) : null;
        const timeString = visitCreatedAtDate && isValid(visitCreatedAtDate)
          ? format(visitCreatedAtDate, "p", { locale: bn })
          : 'N/A';

        return {
          visitId: visit.id,
          patient: patient,
          patientName: patient.name,
          diaryNumberDisplay: patient.diaryNumber || 'N/A',
          address: patient.villageUnion || 'N/A',
          time: timeString,
          reason: visit.symptoms || 'N/A',
          status: currentStatus,
          paymentMethod: paymentSlipForVisit ? getPaymentMethodLabel(paymentSlipForVisit.paymentMethod) : 'N/A',
          paymentAmount: paymentSlipForVisit ? formatCurrency(paymentSlipForVisit.amount) : 'N/A',
          createdAt: visit.createdAt,
        };
      });

    const resolvedAppointmentsData = (await Promise.all(appointmentsDataPromises)).filter(Boolean) as AppointmentDisplayItem[];
    setTodaysAppointments(resolvedAppointmentsData.sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
  }, []);


  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);

    const [
        allPatients,
        todayVisits,
        monthVisits,
        todaySlips,
        monthSlips,
        patientsCreatedThisMonth
    ] = await Promise.all([
        getPatients(),
        getVisitsWithinDateRange(todayStart, todayEnd),
        getVisitsWithinDateRange(monthStart, monthEnd),
        getPaymentSlipsWithinDateRange(todayStart, todayEnd),
        getPaymentSlipsWithinDateRange(monthStart, monthEnd),
        getPatientsRegisteredWithinDateRange(monthStart, monthEnd)
    ]);

    const uniqueTodayPatientIds = new Set(todayVisits.map(v => v.patientId));

    const todayRevenue = todaySlips.reduce((sum, s) => sum + s.amount, 0);
    const monthlyIncome = monthSlips.reduce((sum, s) => sum + s.amount, 0);

    const dailyOtherRegisteredPatientIds = new Set(
        (await getPatientsRegisteredWithinDateRange(todayStart, todayEnd))
        .map(p => p.id)
        .filter(id => !uniqueTodayPatientIds.has(id))
    );


    setStats({
      totalPatients: allPatients.length,
      todayPatientCount: uniqueTodayPatientIds.size,
      monthlyPatientCount: new Set(monthVisits.map(v => v.patientId)).size,
      todayRevenue: todayRevenue,
      monthlyIncome: monthlyIncome,
      dailyActivePatients: uniqueTodayPatientIds.size,
      dailyOtherRegistered: dailyOtherRegisteredPatientIds.size,
      monthlyNewPatients: patientsCreatedThisMonth.length,
      monthlyTotalRegistered: allPatients.length,
    });

    await loadAppointments();
    setLoading(false);
  }, [loadAppointments]);

  useEffect(() => {
    loadDashboardData();
    const handleExternalDataChange = () => {
        loadDashboardData();
    };
    window.addEventListener('firestoreDataChange', handleExternalDataChange);
    return () => {
        window.removeEventListener('firestoreDataChange', handleExternalDataChange);
    };
  }, [loadDashboardData]);


  const handleDashboardSearch = () => {
    if (dashboardSearchTerm.trim()) {
      router.push(`${ROUTES.PATIENT_SEARCH}?q=${encodeURIComponent(dashboardSearchTerm)}`);
    }
  };

  const handlePrintAppointments = () => {
    if (typeof window !== 'undefined') {
      const elementsToHide = document.querySelectorAll('.hide-on-print-dashboard');
      elementsToHide.forEach(el => (el as HTMLElement).style.display = 'none');
      document.body.classList.add('printing-dashboard-appointments-active');
      window.print();
      document.body.classList.remove('printing-dashboard-appointments-active');
      elementsToHide.forEach(el => (el as HTMLElement).style.display = '');
    }
  };

  const handleStartWorkflow = (patientId: string, visitId: string) => {
    router.push(`${ROUTES.PRESCRIPTION}/${patientId}?visitId=${visitId}`);
  };

  const handleOpenPaymentModal = (patient: Patient, visitId: string) => {
    setSelectedPatientForPaymentModal(patient);
    setCurrentVisitIdForPaymentModal(visitId);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentModalClose = async (slipCreated: boolean = false) => {
    setIsPaymentModalOpen(false);
    setSelectedPatientForPaymentModal(null);
    setCurrentVisitIdForPaymentModal(null);
    if (slipCreated) {
        await loadAppointments();
        window.dispatchEvent(new CustomEvent('firestoreDataChange'));
    }
  };


  if (loading) {
    return (
      <div className="space-y-8 p-4 md:p-6 animate-pulse">
        <div className="mb-6 px-4 md:px-0">
          <div className="h-10 bg-muted rounded w-3/4 mb-2"></div>
          <div className="h-6 bg-muted rounded w-1/2 mb-6"></div>
          <div className="mt-6 max-w-xl">
            <div className="flex h-11 items-center w-full rounded-md border border-input bg-muted shadow-inner">
                <div className="h-5 w-5 bg-muted-foreground/30 rounded-full ml-3 mr-2"></div>
                <div className="h-6 bg-muted-foreground/30 rounded flex-1 mr-2"></div>
                <div className="h-full w-20 bg-muted-foreground/50 rounded-r-md"></div>
            </div>
          </div>
        </div>
        <div>
          <div className="h-8 bg-muted rounded w-1/3 mb-3 px-4 md:px-0"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-muted rounded-lg"></div>)}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-muted rounded-lg p-4">
              <div className="h-6 w-1/2 bg-muted-foreground/30 rounded mb-3"></div>
              <div className="h-4 w-3/4 bg-muted-foreground/20 rounded mb-2"></div>
              <div className="h-4 w-2/3 bg-muted-foreground/20 rounded mb-2"></div>
              <div className="h-4 w-3/5 bg-muted-foreground/20 rounded"></div>
            </div>
          ))}
        </div>
        <div className="bg-muted rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="h-8 bg-muted-foreground/30 rounded w-1/3"></div>
            <div className="h-8 bg-muted-foreground/20 rounded w-1/4"></div>
          </div>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="grid grid-cols-5 gap-3 items-center">
                    <div className="h-5 bg-muted-foreground/20 rounded col-span-1"></div>
                    <div className="h-5 bg-muted-foreground/20 rounded col-span-1"></div>
                    <div className="h-5 bg-muted-foreground/20 rounded col-span-1"></div>
                    <div className="h-5 bg-muted-foreground/20 rounded col-span-1"></div>
                    <div className="h-5 bg-muted-foreground/20 rounded col-span-1"></div>
                </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
    <div className="space-y-8 p-1 md:p-2">
      <div className="mb-6 px-4 md:px-0 hide-on-print-dashboard">
        <h1 className="text-3xl font-bold font-headline dashboard-main-title">{APP_NAME}</h1>
        <p className="dashboard-subtitle">একটি আদর্শ হোমিওপ্যাথিক চিকিৎসালয়</p>

        <div className="mt-6 max-w-xl">
          <div className="flex h-11 items-center w-full rounded-md border border-input bg-card shadow-inner overflow-hidden focus-within:ring-1 focus-within:ring-ring focus-within:border-primary">
            <div className="pl-3 pr-1 flex items-center h-full">
              <SearchIcon className="h-5 w-5 text-muted-foreground" />
            </div>
            <Input
              id="dashboardSearchInput"
              type="search"
              placeholder="রোগী অনুসন্ধান করুন (নাম, ডায়েরি নং, ফোন...)"
              className="flex-1 h-full border-0 bg-transparent shadow-none focus:ring-0 focus-visible:ring-0 px-2 text-base placeholder-muted-foreground"
              value={dashboardSearchTerm}
              onChange={(e) => setDashboardSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleDashboardSearch()}
            />
             <MicrophoneButton
              onTranscript={(t) => setDashboardSearchTerm(prev => prev + t)}
              onFinalTranscript={(t) => setDashboardSearchTerm(prev => appendFinalTranscript(prev, t))}
              targetFieldDescription="ড্যাশবোর্ড অনুসন্ধান"
              fieldKey="dashboardSearch"
              isListeningGlobal={isListeningGlobal}
              setIsListeningGlobal={setIsListeningGlobal}
              currentListeningField={currentListeningField}
              setCurrentListeningField={setCurrentListeningField}
              className="text-slate-500 dark:text-slate-400"
            />
            {dashboardSearchTerm && (
              <Button variant="ghost" size="icon" className="h-full w-10 text-muted-foreground hover:text-foreground" onClick={() => setDashboardSearchTerm('')}>
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="default"
              className="rounded-none h-full px-5 text-base"
              onClick={handleDashboardSearch}
            >
              অনুসন্ধান
            </Button>
          </div>
        </div>
      </div>

      <div className="hide-on-print-dashboard">
        <h2 className="text-xl font-semibold font-headline text-foreground mb-3 px-4 md:px-0">দ্রুত কার্যক্রম</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <QuickActionCardMemoized
            title="নতুন রোগী ভর্তি"
            description="সিস্টেমে নতুন রোগীদের দ্রুত নিবন্ধন করুন।"
            icon={UserPlus}
            className="bg-gradient-to-br from-sky-400 to-indigo-500"
            textColorClass="text-white"
            href={ROUTES.PATIENT_ENTRY}
          />
          <QuickActionCardMemoized
            title="রোগীর তালিকা"
            description="সকল নিবন্ধিত রোগীদের প্রোফাইল খুঁজুন ও দেখুন।"
            icon={Users}
            className="bg-gradient-to-br from-teal-400 to-emerald-500"
            textColorClass="text-white"
            href={ROUTES.DICTIONARY}
          />
          <QuickActionCardMemoized
            title="দৈনিক প্রতিবেদন"
            description="দৈনিক কার্যক্রমের বিস্তারিত সারসংক্ষেপ দেখুন।"
            icon={FileText}
            className="bg-gradient-to-br from-green-400 to-cyan-500"
            textColorClass="text-white"
            href={ROUTES.DAILY_REPORT}
          />
          <QuickActionCardMemoized
            title="AI অভিযোগ সারাংশ"
            description="AI দ্বারা রোগীর অভিযোগ সারাংশ করুন।"
            icon={MessageSquareText}
            className="bg-gradient-to-br from-purple-500 to-indigo-600"
            textColorClass="text-white"
            href={ROUTES.AI_SUMMARY}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 hide-on-print-dashboard">
        <ActivityCardMemoized
          title="মাসিক কার্যকলাপ"
          icon={BarChart3}
          stats={[
            { label: 'এই মাসে নতুন রোগী', value: stats.monthlyNewPatients || 0, icon: UserPlus },
            { label: 'মোট নিবন্ধিত রোগী', value: stats.monthlyTotalRegistered || 0, icon: Users },
            { label: 'আনুমানিক মাসিক আয়', value: formatCurrency(stats.monthlyIncome || 0), icon: TrendingUp },
          ]}
          className="bg-gradient-to-br from-blue-500 to-purple-600"
          textColorClass="text-white"
          detailsLink={ROUTES.DAILY_REPORT}
        />
        <ActivityCardMemoized
          title="দৈনিক কার্যকলাপ"
          icon={CalendarDays}
          stats={[
            { label: 'আজ নতুন/সক্রিয় রোগী', value: stats.dailyActivePatients || 0, icon: UserPlus },
            { label: 'অন্যান্য নিবন্ধিত রোগী', value: stats.dailyOtherRegistered || 0, icon: Users },
            { label: 'আজকের আয়', value: formatCurrency(stats.todayRevenue || 0), icon: TrendingUp },
          ]}
          className="bg-gradient-to-br from-lime-500 to-teal-600"
          textColorClass="text-white"
          detailsLink={ROUTES.DAILY_REPORT}
        />
      </div>

      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 dashboard-appointments-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-headline text-xl">আজকের সাক্ষাৎকার</CardTitle>
            <CardDescription>
              {clientRenderedTimestamp ? format(clientRenderedTimestamp, "eeee, MMMM dd, yyyy", { locale: bn }) : 'লোড হচ্ছে...'}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handlePrintAppointments} className="hide-on-print-dashboard"><Printer className="mr-2 h-4 w-4" /> প্রিন্ট তালিকা</Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[15%]">রোগীর নাম</TableHead>
                  <TableHead className="w-[10%]">সময়</TableHead>
                  <TableHead className="w-[10%]">ডায়েরি নং</TableHead>
                  <TableHead className="w-[15%]">ঠিকানা</TableHead>
                  <TableHead className="w-[10%]">পেমেন্ট মাধ্যম</TableHead>
                  <TableHead className="w-[10%] text-right">পরিমাণ</TableHead>
                  <TableHead className="w-[20%] text-center">অবস্থা ও কার্যক্রম</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todaysAppointments.length > 0 ? todaysAppointments.map((appt) => (
                  <TableRow key={appt.visitId}>
                    <TableCell className="font-medium">{appt.patientName}</TableCell>
                    <TableCell>{appt.time}</TableCell>
                    <TableCell>{appt.diaryNumberDisplay}</TableCell>
                    <TableCell>{appt.address}</TableCell>
                    <TableCell>{appt.paymentMethod}</TableCell>
                    <TableCell className="text-right">{appt.paymentAmount}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center justify-center gap-1">
                         <Badge variant={appt.status === 'Completed' ? 'default' : 'secondary'}
                              className={
                                appt.status === 'Completed' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 border-green-300 dark:border-green-600' :
                                'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100 border-yellow-300 dark:border-yellow-600'
                              }
                        >
                          {appt.status === 'Completed' ? 'কার্যক্রম শেষ' : 'অপেক্ষমান'}
                        </Badge>
                        <div className="flex items-center gap-1 mt-1">
                           <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => handleStartWorkflow(appt.patient.id, appt.visitId)}
                                        className="h-7 w-7 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-700/30"
                                    >
                                        <PlayCircle className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>কার্যক্রম শুরু করুন</p>
                                </TooltipContent>
                           </Tooltip>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      আজকের জন্য কোন সাক্ষাৎ নেই।
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {selectedPatientForPaymentModal && currentVisitIdForPaymentModal && (
        <CreatePaymentSlipModal
          patient={selectedPatientForPaymentModal}
          visitId={currentVisitIdForPaymentModal}
          isOpen={isPaymentModalOpen}
          onClose={(slipCreated) => handlePaymentModalClose(slipCreated)}
        />
      )}
       {/* Footer removed as per request */}
    </div>
    </TooltipProvider>
  );
}
    

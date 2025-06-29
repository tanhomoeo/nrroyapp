
# Firebase Studio - NextJS Starter (ত্রিফুল আরোগ্য নিকেতন)

এটি Firebase Studio-তে তৈরি একটি Next.js অ্যাপ্লিকেশন।

## শুরু করার জন্য

অ্যাপ্লিকেশনটি লোকাল মেশিনে চালানোর জন্য:

1.  প্রয়োজনীয় প্যাকেজ ইনস্টল করুন: `npm install`
2.  ডেভেলপমেন্ট সার্ভার চালু করুন: `npm run dev`

তারপর ব্রাউজারে `http://localhost:3000` ভিজিট করুন।

অ্যাপ্লিকেশনটির প্রধান কোড `src/app/` ডিরেক্টরিতে পাওয়া যাবে।

## অ্যাপ্লিকেশন ডিপ্লয়মেন্ট

Firebase-এ এই অ্যাপ্লিকেশনটি ডিপ্লয় করার জন্য বিস্তারিত নির্দেশিকা [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) ফাইলে দেখুন।

## প্রধান প্রযুক্তি

*   Next.js (React Framework)
*   TypeScript
*   Tailwind CSS
*   ShadCN UI Components
*   Firebase (Firestore, Hosting/App Hosting)
*   Genkit (AI functionality)

## ফোল্ডার গঠন (সংক্ষেপে)

*   `src/app/`: Next.js এর App Router পেজ এবং লেআউট।
    *   `(app)/`: প্রমাণীকরণ-সুরক্ষিত প্রধান অ্যাপ্লিকেশন রুট।
    *   `login/`: লগইন পেজ (বর্তমানে সরাসরি ড্যাশবোর্ডে রিডাইরেক্ট করে)।
*   `src/components/`: UI কম্পোনেন্ট।
    *   `shared/`: বিভিন্ন পেজে ব্যবহৃত কমন কম্পোনেন্ট (যেমন সাইডবার, হেডার)।
    *   `ui/`: ShadCN UI থেকে জেনারেট করা বেস UI কম্পোনেন্ট।
*   `src/lib/`: লাইব্রেরি, ইউটিলিটি, এবং Firebase সার্ভিস।
*   `src/ai/`: Genkit ফ্লো এবং AI সম্পর্কিত কোড।
*   `public/`: স্ট্যাটিক অ্যাসেট (যেমন আইকন, ইমেজ)।

---
এটি একটি বেসিক README। আপনার প্রজেক্টের বিস্তারিত বিবরণ, ফিচার এবং অন্যান্য তথ্য এখানে যোগ করতে পারেন।
# nrroyapp

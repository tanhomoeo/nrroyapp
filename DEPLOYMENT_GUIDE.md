
# Next.js অ্যাপ্লিকেশন Firebase-এ ডিপ্লয়মেন্ট গাইড

এই নির্দেশিকাটি আপনার Next.js অ্যাপ্লিকেশনটি Firebase প্ল্যাটফর্মে (Firestore ডাটাবেস এবং Firebase App Hosting/Hosting ব্যবহার করে) ডিপ্লয় করার জন্য একটি ধাপে ধাপে গাইড প্রদান করবে।

## পূর্বশর্ত

1.  **Node.js এবং npm/yarn:** আপনার সিস্টেমে ইনস্টল করা থাকতে হবে।
2.  **Firebase অ্যাকাউন্ট:** আপনার একটি Firebase অ্যাকাউন্ট থাকতে হবে ([firebase.google.com](https://firebase.google.com)).
3.  **Firebase CLI:** ইনস্টল করা না থাকলে, টার্মিনালে এই কমান্ডটি চালান:
    ```bash
    npm install -g firebase-tools
    ```
4.  **Firebase-এ লগইন:** টার্মিনালে এই কমান্ডটি ব্যবহার করে আপনার Firebase অ্যাকাউন্টে লগইন করুন:
    ```bash
    firebase login
    ```

## ধাপসমূহ

### ১. Firebase প্রজেক্ট সেটআপ

*   Firebase Console-এ যান ([console.firebase.google.com](https://console.firebase.google.com)) এবং একটি নতুন প্রজেক্ট তৈরি করুন অথবা বিদ্যমান একটি প্রজেক্ট নির্বাচন করুন।
*   **Firestore Database:**
    *   আপনার Firebase প্রজেক্টের "Firestore Database" সেকশনে যান।
    *   "Create database" এ ক্লিক করুন।
    *   "Native mode" এ শুরু করুন এবং আপনার পছন্দের লোকেশন নির্বাচন করুন (যেমন, `asia-east1`, যা আপনার `firebase.json` এ আছে)।
    *   **নিরাপত্তা বিধি (Security Rules):** প্রাথমিকভাবে, টেস্ট করার জন্য আপনি "Start in test mode" নির্বাচন করতে পারেন, তবে **প্রোডাকশনের জন্য এটি পরিবর্তন করা অত্যন্ত জরুরি**। আপনার `firestore.rules` ফাইলটি (`allow read, write: if true;`) বর্তমানে সম্পূর্ণ খোলা, যা অনিরাপদ। প্রোডাকশনের জন্য এটিকে আপনার অ্যাপ্লিকেশনের নিরাপত্তা চাহিদা অনুযায়ী পরিবর্তন করুন।
*   **Hosting:**
    *   আপনার Firebase প্রজেক্টের "Hosting" সেকশনে যান এবং "Get started" এ ক্লিক করে Hosting সেটআপ করুন।
    *   **App Hosting (প্রস্তাবিত):** আপনার প্রজেক্টে `apphosting.yaml` এবং `firebase.json`-এ `frameworksBackend` থাকার কারণে, Firebase App Hosting আপনার জন্য উপযুক্ত। Firebase Console-এ "App Hosting" সেকশনে গিয়ে একটি নতুন ব্যাকএন্ড তৈরি করুন এবং আপনার Git রিপোজিটরির সাথে কানেক্ট করুন (যদি GitHub Actions বা অনুরূপ CI/CD ব্যবহার করতে চান) অথবা CLI থেকে ডিপ্লয় করার জন্য প্রস্তুত হোন।

### ২. Firebase প্রজেক্টের সাথে লোকাল প্রজেক্ট কানেক্ট করা (যদি না করা হয়ে থাকে)

*   আপনার প্রজেক্টের রুট ডিরেক্টরিতে টার্মিনাল খুলুন।
*   যদি আগে `firebase init` না করে থাকেন, তাহলে চালান:
    ```bash
    firebase init
    ```
*   ফিচার সিলেক্ট করার সময়:
    *   `Firestore: Configure security rules and deploy Firestore indexes now?` - Yes (যদি CLI থেকে Rules/Indexes ডিপ্লয় করতে চান)।
    *   `Hosting: Configure files for Firebase Hosting and (optionally) set up GitHub Action deploys?` - Yes.
        *   `Please select an option:` - "Use an existing project"।
        *   তালিকা থেকে আপনার তৈরি করা Firebase প্রজেক্টটি সিলেক্ট করুন।
        *   `What do you want to use as your public directory?` - `.next` (সাধারণত Firebase CLI Next.js প্রজেক্টের জন্য এটি নিজে থেকেই সনাক্ত করে, বিশেষ করে `frameworksBackend` কনফিগার করা থাকলে)।
        *   `Configure as a single-page app (rewrite all urls to /index.html)?` - **No** (Next.js এর জন্য)।
        *   `Set up automatic builds and deploys with GitHub?` - আপনার পছন্দ অনুযায়ী (Yes/No)। App Hosting এর জন্য এটি পরে কনসোল থেকেও করা যায়।
*   আপনার প্রজেক্টে `firebase.json` এবং `.firebaserc` ফাইল তৈরি হবে (অথবা আপডেট হবে)। `firebase.json` ফাইলটি আপনার প্রজেক্টে ইতিমধ্যে যে কনফিগারেশন আছে (যেমন `frameworksBackend`), সেটির সাথে সামঞ্জস্যপূর্ণ হওয়া উচিত।

### ৩. এনভায়রনমেন্ট ভেরিয়েবল সেটআপ (API Key)

আপনার অ্যাপ্লিকেশনটি Google Gemini API ব্যবহার করে, যার জন্য `GOOGLE_GENAI_API_KEY` প্রয়োজন।

*   **গুরুত্বপূর্ণ:** `.env` ফাইলে API key সরাসরি হার্ডকোড করে রিপোজিটরিতে পুশ করবেন না।
*   **Firebase App Hosting এর জন্য:**
    *   Firebase Console-এ আপনার App Hosting ব্যাকএন্ডের সেটিংসে যান।
    *   সেখানে Environment Variables সেকশনে `GOOGLE_GENAI_API_KEY` এবং এর ভ্যালু যোগ করুন।
*   **Firebase Hosting (Cloud Functions for Next.js) এর জন্য:**
    *   যদি `frameworksBackend` কোনো Cloud Function ব্যবহার করে (Next.js 13+ App Router এ এটি স্বয়ংক্রিয়ভাবে হতে পারে), তাহলে ফাংশনের এনভায়রনমেন্ট ভেরিয়েবল সেট করতে হবে।
        ```bash
        firebase functions:config:set genkit.apikey="AIzaSyBUGNDSi6_DJIusZEbETlX_VpcRjxzwI0k"
        # অথবা একটি জেনেরিক নাম ব্যবহার করতে পারেন:
        # firebase functions:config:set myapp.google_genai_api_key="YOUR_ACTUAL_API_KEY"
        ```
        কোডের ভেতর এটি `process.env.GOOGLE_GENAI_API_KEY` হিসেবে পাওয়ার জন্য Next.js এ সঠিকভাবে কনফিগার করতে হবে অথবা Genkit SDK এনভায়রনমেন্ট ভেরিয়েবল থেকে এটি নিতে পারবে।
    *   **Next.js Runtime Configuration:** App Router এ Server Components এবং Server Actions সরাসরি App Hosting বা Cloud Functions (যদি ব্যবহৃত হয়) এর এনভায়রনমেন্ট ভেরিয়েবল অ্যাক্সেস করতে পারে।

### ৪. Next.js অ্যাপ্লিকেশন বিল্ড করা

ডিপ্লয় করার আগে, আপনার Next.js অ্যাপ্লিকেশনটি প্রোডাকশন বিল্ড তৈরি করুন:

```bash
npm run build
```
এটি `.next` ডিরেক্টরিতে প্রোডাকশন ফাইল তৈরি করবে।

### ৫. Firebase-এ ডিপ্লয় করা

*   আপনার প্রজেক্টে `firebase.json`-এ `hosting.frameworksBackend` কনফিগার করা আছে, যা Firebase Hosting কে আপনার Next.js অ্যাপটি সঠিকভাবে বিল্ড ও সার্ভ করতে সাহায্য করবে। `apphosting.yaml` ফাইলটি App Hosting এর জন্য আরও বিস্তারিত কনফিগারেশন প্রদান করে।
*   ডিপ্লয় করার জন্য টার্মিনালে চালান:
    ```bash
    firebase deploy
    ```
    এই কমান্ডটি আপনার `firebase.json` এবং `apphosting.yaml` অনুযায়ী হোস্টিং, ফাংশন (যদি থাকে), ফায়ারস্টোর রুলস এবং ইনডেক্সগুলো ডিপ্লয় করবে।
*   যদি শুধু নির্দিষ্ট অংশ ডিপ্লয় করতে চান:
    *   হোস্টিং: `firebase deploy --only hosting`
    *   ফায়ারস্টোর (রুলস ও ইনডেক্স): `firebase deploy --only firestore`
    *   ফাংশন (যদি Genkit flows আলাদাভাবে `functions` ডিরেক্টরিতে থাকে): `firebase deploy --only functions`

### ৬. Firestore নিরাপত্তা বিধি (Security Rules) আপডেট (অত্যন্ত জরুরি)

আপনার `firestore.rules` ফাইলে বর্তমানে যে বিধি (`allow read, write: if true;`) আছে, তা **প্রোডাকশনের জন্য সম্পূর্ণ অনিরাপদ**। এর মানে হলো, যে কেউ আপনার ডাটাবেসে ডেটা পড়তে, লিখতে বা মুছতে পারবে।

**আপনাকে অবশ্যই এই বিধিগুলো পরিবর্তন করে আপনার অ্যাপ্লিকেশনের নিরাপত্তা চাহিদা অনুযায়ী সেট করতে হবে।** উদাহরণস্বরূপ:
*   ব্যবহারকারীরা শুধুমাত্র নিজেদের ডেটা দেখতে বা পরিবর্তন করতে পারবে।
*   নির্দিষ্ট কালেকশনে শুধুমাত্র অথেনটিকেটেড ব্যবহারকারীরা অ্যাক্সেস করতে পারবে।

Firebase Console থেকে "Firestore Database" > "Rules" ট্যাবে গিয়ে এই বিধিগুলো আপডেট করুন এবং পাবলিশ করুন। অথবা, `firestore.rules` ফাইল এডিট করে `firebase deploy --only firestore:rules` কমান্ড দিয়ে ডিপ্লয় করুন।

### ৭. ডিপ্লয়মেন্ট যাচাইকরণ

*   ডিপ্লয়মেন্ট সফল হলে, Firebase CLI আপনাকে আপনার অ্যাপ্লিকেশনের URL দেখাবে (যেমন, `your-project-id.web.app` বা `your-project-id.firebaseapp.com`)।
*   App Hosting ব্যবহার করলে, Firebase Console-এ App Hosting সেকশনে আপনার ব্যাকএন্ডের জন্য প্রদত্ত URL টি ব্যবহার করুন।
*   ব্রাউজারে গিয়ে URL টি ভিজিট করে আপনার অ্যাপ্লিকেশনটি সঠিকভাবে কাজ করছে কিনা তা পরীক্ষা করুন। বিভিন্ন ফিচার, ডাটাবেস সংযোগ এবং API কলগুলো (যেমন AI সারাংশ) পরীক্ষা করুন।

## Genkit Flows (যদি `functions` ডিরেক্টরিতে থাকে)

আপনার `functions` ডিরেক্টরিতে একটি `genkit-sample.ts` ফাইল আছে। যদি আপনি এই Genkit flow গুলোকে আলাদা Firebase Functions হিসেবে ডিপ্লয় করতে চান, তাহলে `firebase deploy --only functions` কমান্ড ব্যবহার করতে পারেন। তবে, আপনার বর্তমান AI ফ্লো (`complaint-analyzer-flow.ts`) Next.js এর Server Action হিসেবে (`'use server';` ব্যবহার করে) ডিজাইন করা হয়েছে, যা `frameworksBackend` বা App Hosting এর মাধ্যমে Next.js অ্যাপ্লিকেশনের অংশ হিসেবেই ডিপ্লয় হবে।

## অতিরিক্ত টিপস

*   **CI/CD:** GitHub Actions বা অন্যান্য CI/CD টুল ব্যবহার করে স্বয়ংক্রিয় বিল্ড ও ডিপ্লয়মেন্ট সেটআপ করতে পারেন। Firebase App Hosting এ এর জন্য বিল্ট-ইন সুবিধা আছে।
*   **Monitoring:** Firebase Console-এ Hosting, Firestore, এবং Functions (যদি থাকে) এর পারফরম্যান্স এবং এরর লগ পর্যবেক্ষণ করুন।
*   **Domain:** Firebase Hosting এ কাস্টম ডোমেইন যুক্ত করতে পারেন।

এই নির্দেশিকা অনুসরণ করে আপনি সফলভাবে আপনার অ্যাপ্লিকেশনটি Firebase-এ ডিপ্লয় করতে পারবেন। কোনো নির্দিষ্ট ধাপে সমস্যা হলে, Firebase এর অফিশিয়াল ডকুমেন্টেশন এবং এরর মেসেজগুলো দেখুন।

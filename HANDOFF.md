# 🚀 BRIGZY PROJECT HANDOFF DOCUMENT
**Date:** January 15, 2026
**Developer:** Kubo
**Project:** Brigzy Mobile App (React Native + Expo)

---

## 📱 PROJECT OVERVIEW

**Brigzy** is a job marketplace mobile application connecting workers (job seekers) with employers in Slovakia. The app features user authentication, role-based access (worker/employer), job browsing, and job management.

---

## 🏗️ TECHNICAL STACK

- **Framework:** React Native with Expo SDK 54
- **Language:** TypeScript
- **Backend:** Supabase (PostgreSQL)
- **State Management:** Zustand
- **Navigation:** Expo Router (file-based routing)
- **Styling:** React Native StyleSheet

---

## 📂 PROJECT STRUCTURE

```
brigzy-clean/
├── src/
│   ├── app/
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx          # Tab navigation (emoji icons)
│   │   │   ├── index.tsx             # Worker home screen (job feed)
│   │   │   ├── favorites.tsx         # Favorites screen
│   │   │   ├── add.tsx              # Add job screen
│   │   │   ├── messages.tsx         # Messages screen
│   │   │   └── account.tsx          # Account/profile screen
│   │   ├── _layout.tsx              # Root layout
│   │   ├── index.tsx                # Login screen
│   │   └── register.tsx             # Registration screen
│   ├── components/
│   │   └── JobCard.tsx              # Premium job card component
│   └── lib/
│       ├── supabase.ts              # Supabase client config
│       └── state/
│           └── auth-store.ts        # Zustand auth store
├── .env                              # Environment variables
├── babel.config.js                   # Babel configuration
├── package.json                      # Dependencies
└── tsconfig.json                     # TypeScript config
```

---

## 🔑 ENVIRONMENT VARIABLES (.env)

```env
EXPO_PUBLIC_SUPABASE_URL=https://dygjwtljgzfyoqdklcrk.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5Z2p3dGxqZ3pmeW9xZGtsY3JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NzAzOTQsImV4cCI6MjA4MzA0NjM5NH0.JY4jfcm5zRxe0dgg6_Mgou2ovbB8T4dVJATlifp0bz4
```

---

## 📦 KEY DEPENDENCIES

```json
{
  "@react-native-async-storage/async-storage": "^2.2.0",
  "@react-native-picker/picker": "^2.11.1",
  "@supabase/supabase-js": "^2.90.1",
  "expo": "~54.0.0",
  "expo-router": "~6.0.21",
  "react": "^19.1.0",
  "react-native": "^0.81.5",
  "react-native-web": "^0.21.2",
  "zustand": "^5.0.10"
}
```

**NOTE:** Lucide-react-native and react-native-reanimated were REMOVED due to compatibility issues.

---

## 🎨 DESIGN SYSTEM

### **Color Palette:**
- **Primary Purple:** `#8B5CF6`
- **Hospitality Orange:** `#F59E0B`
- **Retail Purple:** `#8B5CF6`
- **Construction Red:** `#EF4444`
- **Cleaning Green:** `#10B981`
- **Background Gray:** `#F9FAFB`
- **Text Dark:** `#111827`
- **Text Gray:** `#6B7280`

### **Typography:**
- **Title:** 17px, Bold (700)
- **Body:** 14-15px, Medium (500)
- **Small:** 13px, Medium (500)

### **Spacing:**
- Card padding: 16px
- Card margin: 12px bottom, 16px horizontal
- Border radius: 20px (cards), 12-16px (badges)

---

## 🔐 AUTHENTICATION FLOW

1. **Login Screen** (`src/app/index.tsx`)
   - Email + password authentication
   - Supabase Auth integration
   - Redirects to role selection after successful login

2. **Registration Screen** (`src/app/register.tsx`)
   - Full user profile creation
   - Fields: display_name, email, password, phone, date_of_birth, gender, country, city, role
   - Creates user in Supabase Auth + profiles table

3. **Auth Store** (`src/lib/state/auth-store.ts`)
   - Zustand store for auth state
   - Stores: user, profile, isAuthenticated

---

## 📱 CURRENT FEATURES

### ✅ **Completed:**
1. **Authentication System**
   - Login screen with Supabase integration
   - Registration with full profile fields
   - Role-based access (worker/employer)

2. **Worker Home Screen**
   - Job feed with real-time data from Supabase
   - Category filtering (All, Hospitality, Retail, Construction, Cleaning)
   - Search bar
   - Premium JobCard components with:
     - Company logo with first letter
     - Category-based dynamic colors
     - Urgent badge for urgent jobs
     - Salary display in EUR
     - Save/favorite button
     - Location and applicant count
     - Smooth press animations

3. **Navigation**
   - Tab-based navigation with emoji icons
   - 5 tabs: Home, Favorites, Add, Messages, Account

4. **Database Integration**
   - Supabase connected and working
   - Jobs table with data fetching
   - Profiles table for user data

### ❌ **Not Implemented Yet:**
1. Job Detail Screen
2. Favorites Screen
3. Add Job Screen (Employer)
4. Messages Screen
5. Account/Profile Screen
6. Job Application Flow
7. Employer Dashboard

---

## 🐛 KNOWN ISSUES & SOLUTIONS

### **Issue 1: Lucide Icons Compatibility**
**Problem:** `lucide-react-native` caused build errors with worklets plugin  
**Solution:** Replaced with emoji icons in tab navigation  
**Status:** ✅ Resolved

### **Issue 2: React Native Reanimated**
**Problem:** Reanimated plugin caused Metro bundler errors  
**Solution:** Removed Reanimated, using standard Animated API  
**Status:** ✅ Resolved

### **Issue 3: React Version Conflicts**
**Problem:** React 19.0.0 vs 19.1.0 peer dependency conflicts  
**Solution:** Updated to React 19.1.0 with `--legacy-peer-deps`  
**Status:** ✅ Resolved

### **Issue 4: Supabase Invalid API Key**
**Problem:** Used publishable key instead of anon key  
**Solution:** Updated .env with correct JWT anon key  
**Status:** ✅ Resolved

---

## 🎯 NEXT STEPS

### **Immediate Priority:**
1. **Implement Job Detail Screen**
   - Full job description
   - Apply button
   - Company information
   - Map/location display

2. **Create Profile/Account Screen**
   - User info display
   - Edit profile functionality
   - Logout button
   - Settings

3. **Build Favorites System**
   - Save/unsave jobs
   - Display saved jobs
   - Persist favorites in Supabase

### **Medium Priority:**
4. Messages/Chat System
5. Job Application Flow
6. Employer Features (Add/Edit Jobs)

### **Future Enhancements:**
7. Push Notifications
8. Advanced Search & Filters
9. Rating/Review System
10. Payment Integration

---

## 🚨 IMPORTANT NOTES

1. **NEVER reinstall lucide-react-native or react-native-reanimated** - they cause compatibility issues
2. **Always use emoji icons** for UI elements instead of icon libraries
3. **Use `--legacy-peer-deps`** flag when installing new packages due to React 19 peer dependency issues
4. **Environment variables must use `EXPO_PUBLIC_` prefix** to be accessible in the app
5. **Clear Metro bundler cache** (`npx expo start --clear`) when making config changes

---

## 🔧 COMMON COMMANDS

```bash
# Start development server
npx expo start --clear

# Open Android emulator
# Press 'a' in terminal

# Clear all caches
Remove-Item -Recurse -Force node_modules\.cache
Remove-Item -Recurse -Force .expo
npx expo start --clear --reset-cache

# Install new package (Windows PowerShell)
npm install <package-name> --legacy-peer-deps
```

---

## 📊 DATABASE SCHEMA (Supabase)

### **profiles table:**
```sql
- id (uuid, primary key)
- display_name (text)
- email (text)
- phone (text)
- date_of_birth (date)
- gender (text)
- country (text)
- city (text)
- role (text: 'worker' | 'employer')
- created_at (timestamp)
```

### **jobs table:**
```sql
- id (uuid, primary key)
- title (text)
- company_name (text)
- location (text)
- pay_amount (numeric)
- pay_type (text: 'hourly' | 'daily')
- category (text)
- is_urgent (boolean)
- employer_id (uuid, foreign key)
- created_at (timestamp)
```

---

## 🎨 JOBCARD COMPONENT FEATURES

Current `JobCard.tsx` includes:
- ✅ Dynamic category-based colors
- ✅ Smooth press animations (scale 0.97)
- ✅ Company logo with first letter
- ✅ Urgent badge with lightning emoji
- ✅ Salary badge in category color
- ✅ Save/favorite button with heart emoji
- ✅ Location and applicant count
- ✅ Professional shadows and borders
- ✅ EUR currency formatting

---

## 💭 DESIGN PHILOSOPHY

The app aims for a **modern, clean, professional** aesthetic:
- Large touch targets for mobile usability
- Clear visual hierarchy
- Category-based color coding
- Consistent spacing and rounded corners
- Smooth animations for better UX
- Emoji icons for universal understanding

---

## 📞 CONTACT & CONTEXT

- **Developer:** Kubo
- **Project Path:** `C:\Users\nemci\OneDrive\Počítač\brigzy-clean`
- **Previous Issues:** Vibe Code export didn't work, had to rebuild from scratch
- **Current Status:** Working app with login, registration, and job feed
- **Development Environment:** Windows 11, Android Pixel 9 emulator

---

## 🎯 HANDOFF PROMPT FOR NEW CHAT

**Use this prompt when starting a new chat:**

```
I'm continuing work on the Brigzy mobile app (React Native + Expo). I have a detailed handoff document at:
C:\Users\nemci\OneDrive\Počítač\brigzy-clean\HANDOFF.md

Please read this document first to understand:
- Current project structure
- Completed features
- Known issues and solutions
- Technical stack and dependencies
- Next steps

I need help implementing [SPECIFIC FEATURE]. The project is at:
C:\Users\nemci\OneDrive\Počítač\brigzy-clean
```

---

## ✅ CHECKLIST FOR CONTINUATION

Before starting new features, verify:
- [ ] Supabase connection is working
- [ ] User can login successfully
- [ ] Job feed displays correctly
- [ ] Tab navigation works
- [ ] No Metro bundler errors
- [ ] Environment variables are set

---

**END OF HANDOFF DOCUMENT**
Generated: January 15, 2026, 23:50 UTC

// Simple language text map - NO localization keys, just plain text values
export type Language = 'en' | 'sk';

export const SUPPORTED_LANGUAGES: { code: Language; name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'sk', name: 'Slovenčina' },
];

// Define the shape of text values
interface TextMap {
  // Common
  ok: string;
  cancel: string;
  error: string;
  search: string;
  save: string;
  delete: string;
  edit: string;
  close: string;
  confirm: string;
  loading: string;
  loadingJobs: string;
  loadingData: string;
  retry: string;
  on: string;
  off: string;

  // Tab Navigation
  home: string;
  favorites: string;
  add: string;

  // Auth
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  displayName: string;
  displayNameHelper: string;
  country: string;
  phoneNumber: string;
  signIn: string;
  signUp: string;
  dontHaveAccount: string;
  alreadyHaveAccount: string;
  or: string;
  signInWithApple: string;
  signInWithGoogle: string;
  invalidEmail: string;
  passwordTooShort: string;
  loginFailed: string;
  registrationFailed: string;
  termsNotice: string;
  findWorkGetHired: string;
  accountNotFound: string;
  allFieldsRequired: string;
  invalidPhoneNumber: string;
  dataSaved: string;
  notLoggedIn: string;
  registrationSuccessful: string;
  mustBeLoggedIn: string;

  // Welcome
  welcomeSubtitle: string;
  lookingForWork: string;
  browseJobs: string;
  postJob: string;
  hireWorkers: string;
  changeRoleAnytime: string;

  // Home Screen
  welcomeBack: string;
  searchJobsPlaceholder: string;
  categories: string;
  availableJobs: string;
  noJobsFound: string;
  tryAdjustingSearch: string;
  all: string;
  noJobsYet: string;
  noJobsYetWorker: string;
  noJobsYetEmployer: string;

  // Messages Screen
  messages: string;
  chatWithEmployers: string;
  searchConversations: string;
  noMessagesYet: string;
  startApplyingToConnect: string;
  contactEmployer: string;
  startConversationWith: string;
  chatWithEmployersWorkers: string;

  // Saved Screen
  savedJobs: string;
  noSavedJobsYet: string;
  tapHeartToSave: string;

  // Post Job Screen
  postAJob: string;
  findPerfectWorker: string;
  jobTitle: string;
  jobTitlePlaceholder: string;
  description: string;
  descriptionPlaceholder: string;
  location: string;
  locationPlaceholder: string;
  salaryType: string;
  hourly: string;
  fixed: string;
  hourlyRate: string;
  fixedAmount: string;
  ratePlaceholder: string;
  amountPlaceholder: string;
  duration: string;
  durationPlaceholder: string;
  category: string;
  postJobButton: string;
  jobPosted: string;
  jobPostedMessage: string;
  jobPostedSuccess: string;
  findIdealWorker: string;
  requireIntroFromApplicants: string;
  requireIntroHelperText: string;

  // Application Flow
  applyForJobQuestion: string;
  doYouWantToApply: string;
  writeWhySuitable: string;
  minCharacters: string;
  confirmApplication: string;
  sendApplication: string;
  applicationSent: string;
  employerReceivedRequest: string;
  gotIt: string;
  applied: string;
  applicationSuccessfullySent: string;

  // Profile/Account Screen
  profile: string;
  account: string;
  myApplications: string;
  myJobs: string;
  completed: string;
  rating: string;
  reviews: string;
  currentMode: string;
  workerMode: string;
  employerMode: string;
  offeringWork: string;
  switch: string;
  workHistory: string;
  signOut: string;
  lookingForJobs: string;
  postingJobs: string;
  switchMode: string;
  helpCenter: string;
  support: string;
  surname: string;
  selectCountry: string;
  saveChanges: string;
  profileSettings: string;
  privacySettings: string;
  selectPhoto: string;
  takePhoto: string;
  removePhoto: string;

  // My Applications Screen
  pending: string;
  accepted: string;
  history: string;
  waitingForResponse: string;
  rejected: string;
  noApplicationsYet: string;
  startApplyingToJobs: string;
  findJobs: string;
  appliedAgo: string;
  daysAgo: string;
  hoursAgo: string;

  // Employer - My Jobs Screen
  newApplications: string;
  open: string;
  inProgress: string;
  completedStatus: string;
  cancelled: string;
  noJobsPostedYet: string;
  postYourFirstJob: string;

  // Employer - Job Detail with Applications
  newTab: string;
  acceptedTab: string;
  rejectedTab: string;
  accept: string;
  reject: string;
  contact: string;
  markAsCompleted: string;
  cancelJob: string;
  workerAccepted: string;
  applicationRejected: string;
  jobMarkedCompleted: string;
  noApplicationsForJob: string;
  waitingForWorkers: string;
  workerInfo: string;
  applicationMessage: string;
  failedToLoadJob: string;
  failedToUpdateStatus: string;
  noApplicantsInCategory: string;
  new: string;

  // P4 select → S5 escrow
  selectWorker: string;
  fundEscrow: string;
  awaitingSignatures: string;
  escrowConfirmTitle: string;
  reward: string;
  serviceFee: string;
  totalToPay: string;
  escrowHeldNote: string;
  payNow: string;
  escrowFunded: string;
  escrowFundedNote: string;
  verifiedBadge: string;
  selectionFailed: string;
  done: string;
  accountSettings: string;

  // P5/W6 booking hub + S3 sign
  bookingTitle: string;
  stepEscrow: string;
  stepContract: string;
  stepWork: string;
  stepRelease: string;
  signContract: string;
  waitingForPosterSign: string;
  waitingForWorkerSign: string;
  approveAndRelease: string;
  paymentReleased: string;
  paymentReleasedNote: string;
  qrComingSoon: string;
  contractTitle: string;
  contractSampleNote: string;
  enterOtp: string;
  otpDemoHint: string;
  confirmSign: string;
  signFailed: string;
  bookingNotFound: string;
  workerLabel: string;
  posterLabel: string;
  bookingCancelled: string;
  bookingDisputed: string;
  waitingForRelease: string;
  checkInWorker: string;
  checkOutWorker: string;
  workedTime: string;
  workingSince: string;
  estimatedHoursLabel: string;
  estimatedHoursHint: string;
  perHourShort: string;

  // W13 public profile
  memberSince: string;
  completedJobsLabel: string;
  postedJobsLabel: string;
  reviewsTitle: string;
  noReviewsYet: string;
  sendMessage: string;
  profileNotFound: string;
  ratingLabel: string;
  peopleSection: string;
  viewProfile: string;

  // S7 blind review
  leaveReviewTitle: string;
  reviewCommentPlaceholder: string;
  submitReview: string;
  reviewThanks: string;
  reviewBlindNote: string;
  reviewRevealedNote: string;
  reviewFailed: string;

  // W7/S6 QR attendance
  showQr: string;
  scanQr: string;
  waitingForCheckIn: string;
  workingSinceQr: string;
  checkedOutSummary: string;
  qrRefreshesIn: string;
  offlineQrWarning: string;
  closeAction: string;
  scanQrTitle: string;
  scanQrHint: string;
  cameraDenied: string;
  cameraDeniedHint: string;
  qrExpiredError: string;
  qrWrongBookingError: string;
  qrUsedError: string;
  qrGenericError: string;
  scanSuccessCheckIn: string;
  scanSuccessCheckOut: string;
  sosContact: string;

  // P2 wizard
  wizardStepOf: string;
  wizardBack: string;
  wizardNext: string;
  wizardPublish: string;
  wizardPublishing: string;
  stepCategoryTitle: string;
  stepDescriptionTitle: string;
  stepPayTitle: string;
  stepLocationTitle: string;
  stepScheduleTitle: string;
  stepSettingsTitle: string;
  stepSummaryTitle: string;
  taskNatureLabel: string;
  taskNatureResult: string;
  taskNatureResultHint: string;
  taskNatureActivity: string;
  taskNatureActivityHint: string;
  postingAsLabel: string;
  postingAsIndividual: string;
  postingAsCompany: string;
  companyNameLabel: string;
  companyIcoLabel: string;
  companyDicLabel: string;
  slotsCountLabel: string;
  startDateLabel: string;
  recurringLabel: string;
  recurringHint: string;
  sosSettingLabel: string;
  sosSettingHint: string;
  visibilityLabel: string;
  visibilityPublic: string;
  visibilityInviteOnly: string;
  feeGross: string;
  feeService: string;
  feeNet: string;
  contractTypePreview: string;
  wizardValidationError: string;
  jobPublishedTitle: string;

  // Job Detail Screen
  jobNotFound: string;
  aboutThisJob: string;
  requirements: string;
  applicants: string;
  perHour: string;
  fixedRate: string;
  urgentHiring: string;
  applicationSubmitted: string;
  alreadyApplied: string;
  applyNow: string;
  urgent: string;
  applicantsCount: string;
  applyForJob: string;
  fixedPrice: string;
  jobDescription: string;
  readMore: string;
  employer: string;
  reviewsText: string;
  message: string;
  availability: string;

  // Settings
  settings: string;
  appearance: string;
  light: string;
  dark: string;
  system: string;
  general: string;
  notifications: string;
  language: string;
  changeMode: string;
  changeModeDescription: string;
  logOut: string;
  logOutConfirmTitle: string;
  logOutConfirmMessage: string;
  version: string;
  editProfile: string;
  profileUpdated: string;
  profileUpdateSuccess: string;
  tapToChangePhoto: string;
  changesSaved: string;
  failedToSaveChanges: string;
  uploadingPhoto: string;
  photoSuccessfullyChanged: string;
  failedToUploadPhoto: string;
  fileTooLarge: string;

  // Not Found Screen
  oops: string;
  screenDoesntExist: string;
  goToHomeScreen: string;

  // Modal
  modal: string;

  // Categories
  catRestaurant: string;
  catRetail: string;
  catDelivery: string;
  catCleaning: string;
  catEvents: string;
  catWarehouse: string;
  catOffice: string;
  catOther: string;
}

// Text map with all UI strings
const texts: Record<Language, TextMap> = {
  en: {
    // Common
    ok: 'OK',
    cancel: 'Cancel',
    error: 'Error',
    search: 'Search',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    confirm: 'Confirm',
    loading: 'Loading...',
    loadingJobs: 'Loading jobs...',
    loadingData: 'Loading data...',
    retry: 'Retry',
    on: 'On',
    off: 'Off',

    // Tab Navigation
    home: 'Home',
    favorites: 'Favorites',
    add: 'Add',

    // Auth
    email: 'Email',
    password: 'Password',
    firstName: 'First Name',
    lastName: 'Last Name',
    displayName: 'Display Name',
    displayNameHelper: 'How do you want to be called in the app',
    country: 'Country',
    phoneNumber: 'Phone Number',
    signIn: 'Sign in',
    signUp: 'Sign up',
    dontHaveAccount: "Don't have an account?",
    alreadyHaveAccount: 'Already have an account?',
    or: 'Or',
    signInWithApple: 'Sign in with Apple',
    signInWithGoogle: 'Sign in with Google',
    invalidEmail: 'Invalid email address',
    passwordTooShort: 'Password must be at least 6 characters',
    loginFailed: 'Login failed. Please check your credentials.',
    registrationFailed: 'Registration failed. Please try again.',
    termsNotice: 'By continuing, you agree to our Terms and Privacy Policy',
    findWorkGetHired: 'Find work. Get hired.',
    accountNotFound: 'Account not found. Please register.',
    allFieldsRequired: 'All fields are required',
    invalidPhoneNumber: 'Invalid phone number',
    dataSaved: 'Data saved!',
    notLoggedIn: 'Not logged in',
    registrationSuccessful: 'Registration successful!',
    mustBeLoggedIn: 'You must be logged in',

    // Welcome
    welcomeSubtitle: 'What are you looking for?',
    lookingForWork: 'Looking for Work',
    browseJobs: 'Browse and apply for jobs',
    postJob: 'Post a Job',
    hireWorkers: 'Hire workers and manage jobs',
    changeRoleAnytime: 'You can change your role anytime in Settings',

    // Home Screen
    welcomeBack: 'Welcome back',
    searchJobsPlaceholder: 'Search jobs, companies...',
    categories: 'Categories',
    availableJobs: 'Available Jobs',
    noJobsFound: 'No jobs found',
    tryAdjustingSearch: 'Try adjusting your search or filters',
    all: 'All',
    noJobsYet: 'No jobs yet',
    noJobsYetWorker: 'No jobs available right now. Check back soon!',
    noJobsYetEmployer: 'Be the first to post a job!',

    // Messages Screen
    messages: 'Messages',
    chatWithEmployers: 'Chat with employers and workers',
    searchConversations: 'Search conversations...',
    noMessagesYet: 'No messages yet',
    startApplyingToConnect: 'Start applying to jobs to connect with employers',
    contactEmployer: 'Contact Employer',
    startConversationWith: 'Start a conversation with',
    chatWithEmployersWorkers: 'Chat with employers and workers',

    // Saved Screen
    savedJobs: 'Saved Jobs',
    noSavedJobsYet: 'No saved jobs yet',
    tapHeartToSave: 'Tap the heart icon on any job to save it for later',

    // Post Job Screen
    postAJob: 'Post a Job',
    findPerfectWorker: 'Find the perfect worker for your needs',
    jobTitle: 'Job Title',
    jobTitlePlaceholder: 'e.g., Barista for Weekend Shifts',
    description: 'Description',
    descriptionPlaceholder: 'Describe the job responsibilities...',
    location: 'Location',
    locationPlaceholder: 'e.g., Downtown, NYC',
    salaryType: 'Salary Type',
    hourly: 'Hourly',
    fixed: 'Fixed',
    hourlyRate: 'Hourly Rate ($)',
    fixedAmount: 'Fixed Amount ($)',
    ratePlaceholder: 'e.g., 18',
    amountPlaceholder: 'e.g., 200',
    duration: 'Duration',
    durationPlaceholder: 'e.g., Weekends only, 1-2 days',
    category: 'Category',
    postJobButton: 'Post Job',
    jobPosted: 'Job Posted!',
    jobPostedMessage: 'Your job listing is now live and visible to workers.',
    jobPostedSuccess: 'Your job has been successfully published',
    findIdealWorker: 'Find the ideal worker for your needs',
    requireIntroFromApplicants: 'Require introduction from applicants',
    requireIntroHelperText: 'Worker will need to write a short message about why they\'re suitable for this job',

    // Application Flow
    applyForJobQuestion: 'Apply for job?',
    doYouWantToApply: 'Do you want to apply for this job?',
    writeWhySuitable: 'Write why you\'re suitable',
    minCharacters: '(Min. 20 characters)',
    confirmApplication: 'Confirm application',
    sendApplication: 'Send application',
    applicationSent: 'Application sent!',
    employerReceivedRequest: 'The employer received your request. You\'ll get a notification about their response.',
    gotIt: 'Got it',
    applied: 'Applied ✓',
    applicationSuccessfullySent: 'Application successfully sent',

    // Profile Screen
    profile: 'Profile',
    currentMode: 'Current Mode',
    workerMode: 'Worker Mode',
    employerMode: 'Employer Mode',
    lookingForJobs: 'Looking for jobs',
    offeringWork: 'Offering work',
    postingJobs: 'Posting jobs',
    switch: 'Switch',
    switchMode: 'Switch',
    myApplications: 'My Applications',
    workHistory: 'Work History',
    helpCenter: 'Help Center',
    support: 'Support',
    surname: 'Surname',
    selectCountry: 'Select Country',
    saveChanges: 'Save Changes',
    profileSettings: 'Profile Settings',
    privacySettings: 'Privacy Settings',
    completed: 'Completed',
    rating: 'Rating',
    reviews: 'Reviews',
    signOut: 'Sign Out',
    selectPhoto: 'Select Photo',
    takePhoto: 'Take Photo',
    removePhoto: 'Remove Photo',

    // My Applications Screen
    pending: 'Pending',
    accepted: 'Accepted',
    history: 'History',
    waitingForResponse: 'Waiting for response',
    rejected: 'Rejected',
    noApplicationsYet: 'No applications yet',
    startApplyingToJobs: 'Start looking for work and apply to jobs',
    findJobs: 'Find Jobs',
    appliedAgo: 'Applied',
    daysAgo: 'days ago',
    hoursAgo: 'hours ago',

    // Employer - My Jobs Screen
    myJobs: 'My Jobs',
    newApplications: 'new applications',
    open: 'Open',
    inProgress: 'In Progress',
    completedStatus: 'Completed',
    cancelled: 'Cancelled',
    noJobsPostedYet: 'No jobs posted yet',
    postYourFirstJob: 'Post your first job to start hiring!',

    // Employer - Job Detail with Applications
    newTab: 'New',
    acceptedTab: 'Accepted',
    rejectedTab: 'Rejected',
    accept: 'Accept',
    reject: 'Reject',
    contact: 'Contact',
    markAsCompleted: 'Mark as Completed',
    cancelJob: 'Cancel Job',
    workerAccepted: 'Worker accepted!',
    applicationRejected: 'Application rejected',
    jobMarkedCompleted: 'Job marked as completed!',
    noApplicationsForJob: 'No applications yet',
    waitingForWorkers: 'Waiting for workers to apply',
    workerInfo: 'Worker Info',
    applicationMessage: 'Application Message',
    failedToLoadJob: 'Failed to load job',
    failedToUpdateStatus: 'Failed to update status',
    noApplicantsInCategory: 'No applicants in this category',
    new: 'New',

    // P4 select → S5 escrow
    selectWorker: 'Select worker',
    fundEscrow: 'Pay into escrow',
    awaitingSignatures: 'Awaiting signatures',
    escrowConfirmTitle: 'Payment into escrow',
    reward: 'Reward',
    serviceFee: 'Service fee',
    totalToPay: 'Total to pay',
    escrowHeldNote: 'The money is held safely in escrow and released to the worker only after you approve the finished work.',
    payNow: 'Pay now',
    escrowFunded: 'Funds are in escrow',
    escrowFundedNote: 'Next step: both parties sign the contract.',
    verifiedBadge: 'Verified',
    selectionFailed: 'Could not select this worker. Please try again.',
    done: 'Done',
    accountSettings: 'Account settings',

    // P5/W6 booking hub + S3 sign
    bookingTitle: 'Booking',
    stepEscrow: 'Payment in escrow',
    stepContract: 'Contract signatures',
    stepWork: 'Work day (QR attendance)',
    stepRelease: 'Approval & payout',
    signContract: 'Sign contract',
    waitingForPosterSign: 'Waiting for the poster to sign',
    waitingForWorkerSign: 'Waiting for the worker to sign',
    approveAndRelease: 'Approve work & release payment',
    paymentReleased: 'Payment released',
    paymentReleasedNote: 'The money has been credited to the worker\'s wallet.',
    qrComingSoon: 'QR attendance — coming soon',
    contractTitle: 'Contract',
    contractSampleNote: 'SAMPLE — template not yet lawyer-verified. Demo only.',
    enterOtp: 'Enter the SMS code',
    otpDemoHint: 'Demo OTP: 123456',
    confirmSign: 'Sign',
    signFailed: 'Signing failed. Check the code and try again.',
    bookingNotFound: 'Booking not found',
    workerLabel: 'Worker',
    posterLabel: 'Poster',
    bookingCancelled: 'Booking cancelled',
    bookingDisputed: 'Booking in dispute',
    waitingForRelease: 'Waiting for the poster to approve the work',
    checkInWorker: 'Check in worker',
    checkOutWorker: 'Check out worker',
    workedTime: 'Worked',
    workingSince: 'Working since',
    estimatedHoursLabel: 'Estimated hours',
    estimatedHoursHint: 'Used to reserve the payment in escrow (rate × hours)',
    perHourShort: 'h',

    // W13 public profile
    memberSince: 'Member since',
    completedJobsLabel: 'Completed jobs',
    postedJobsLabel: 'Posted jobs',
    reviewsTitle: 'Reviews',
    noReviewsYet: 'No reviews yet',
    sendMessage: 'Send message',
    profileNotFound: 'Profile not found',
    ratingLabel: 'Rating',
    peopleSection: 'People',
    viewProfile: 'View profile',

    // S7 blind review
    leaveReviewTitle: 'Rate your experience',
    reviewCommentPlaceholder: 'Write a short review…',
    submitReview: 'Submit review',
    reviewThanks: 'Thanks for your review!',
    reviewBlindNote: 'Reviews are revealed once both sides have rated.',
    reviewRevealedNote: 'Both reviews are now public.',
    reviewFailed: 'Could not submit the review. Please try again.',

    // W7/S6 QR attendance
    showQr: 'Show QR',
    scanQr: 'Scan QR',
    waitingForCheckIn: 'Waiting for check-in',
    workingSinceQr: 'Working since',
    checkedOutSummary: 'Check-out confirmed',
    qrRefreshesIn: 'Refreshes in',
    offlineQrWarning: 'No connection — the QR may be invalid; the poster may reject it.',
    closeAction: 'Close',
    scanQrTitle: 'Scan worker\'s QR',
    scanQrHint: 'Point the camera at the QR code',
    cameraDenied: 'Camera access denied',
    cameraDeniedHint: 'Allow camera access in your browser settings to scan the QR code.',
    qrExpiredError: 'QR expired — ask the worker to refresh it',
    qrWrongBookingError: 'This QR does not belong to this booking',
    qrUsedError: 'This QR was already used',
    qrGenericError: 'Could not read the QR code. Please try again.',
    scanSuccessCheckIn: 'Check-in',
    scanSuccessCheckOut: 'Check-out',
    sosContact: 'SOS / Contact',

    // P2 wizard
    wizardStepOf: 'Step',
    wizardBack: 'Back',
    wizardNext: 'Continue',
    wizardPublish: 'Publish job',
    wizardPublishing: 'Publishing…',
    stepCategoryTitle: 'Category',
    stepDescriptionTitle: 'Describe the task',
    stepPayTitle: 'Pay',
    stepLocationTitle: 'Location',
    stepScheduleTitle: 'Slots & schedule',
    stepSettingsTitle: 'Settings',
    stepSummaryTitle: 'Summary & publish',
    taskNatureLabel: 'What kind of task is it?',
    taskNatureResult: 'A defined result',
    taskNatureResultHint: 'e.g. clean this apartment, deliver these packages',
    taskNatureActivity: 'Ongoing / repeated activity',
    taskNatureActivityHint: 'e.g. regular shifts, recurring work',
    postingAsLabel: 'Posting as',
    postingAsIndividual: 'Individual',
    postingAsCompany: 'Company (IČO)',
    companyNameLabel: 'Company name',
    companyIcoLabel: 'IČO',
    companyDicLabel: 'DIČ (optional)',
    slotsCountLabel: 'Number of spots',
    startDateLabel: 'Start date & time',
    recurringLabel: 'Recurring work',
    recurringHint: 'Turn on for regular/weekly shifts (affects contract type)',
    sosSettingLabel: 'Urgent (SOS)',
    sosSettingHint: 'Highlighted with a red badge, higher visibility',
    visibilityLabel: 'Visibility',
    visibilityPublic: 'Public',
    visibilityInviteOnly: 'Invite-only',
    feeGross: 'Reward',
    feeService: 'Service fee',
    feeNet: 'Worker receives',
    contractTypePreview: 'Contract',
    wizardValidationError: 'Please fill in this step before continuing.',
    jobPublishedTitle: 'Job published!',

    // Job Detail Screen
    jobNotFound: 'Job not found',
    aboutThisJob: 'About This Job',
    requirements: 'Requirements',
    applicants: 'Applicants',
    perHour: 'Per hour',
    fixedRate: 'Fixed rate',
    urgentHiring: 'Urgent - Hiring immediately',
    applicationSubmitted: 'Application Submitted!',
    alreadyApplied: 'Already Applied',
    applyNow: 'Apply Now',
    urgent: 'Urgent',
    applicantsCount: 'applicants',
    applyForJob: 'Apply for job',
    fixedPrice: 'Fixed price',
    jobDescription: 'Job description',
    readMore: 'Read more',
    employer: 'Employer',
    reviewsText: 'reviews',
    message: 'Message',
    availability: 'Availability',

    // Settings
    settings: 'Settings',
    appearance: 'Appearance',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    general: 'General',
    notifications: 'Notifications',
    language: 'Language',
    changeMode: 'Change Mode',
    changeModeDescription: 'Switch between Worker and Employer',
    account: 'Account',
    logOut: 'Log Out',
    logOutConfirmTitle: 'Log Out?',
    logOutConfirmMessage: 'Are you sure you want to log out?',
    version: 'Brigzy v1.0.0',
    editProfile: 'Edit Profile',
    profileUpdated: 'Profile Updated',
    profileUpdateSuccess: 'Your profile has been updated successfully',
    tapToChangePhoto: 'Tap to change photo',
    changesSaved: 'Changes saved!',
    failedToSaveChanges: 'Failed to save changes',
    uploadingPhoto: 'Uploading photo...',
    photoSuccessfullyChanged: 'Photo successfully changed!',
    failedToUploadPhoto: 'Failed to upload photo',
    fileTooLarge: 'File too large (max 5MB)',

    // Not Found Screen
    oops: 'Oops!',
    screenDoesntExist: "This screen doesn't exist.",
    goToHomeScreen: 'Go to home screen!',

    // Modal
    modal: 'Modal',

    // Categories
    catRestaurant: 'Restaurant',
    catRetail: 'Retail',
    catDelivery: 'Delivery',
    catCleaning: 'Cleaning',
    catEvents: 'Events',
    catWarehouse: 'Warehouse',
    catOffice: 'Office',
    catOther: 'Other',
  },
  sk: {
    // Common
    ok: 'OK',
    cancel: 'Zrušiť',
    error: 'Chyba',
    search: 'Hľadať',
    save: 'Uložiť',
    delete: 'Vymazať',
    edit: 'Upraviť',
    close: 'Zavrieť',
    confirm: 'Potvrdiť',
    loading: 'Načítava sa...',
    loadingJobs: 'Načítavam brigády...',
    loadingData: 'Načítavam údaje...',
    retry: 'Skúsiť znova',
    on: 'Zap.',
    off: 'Vyp.',

    // Tab Navigation
    home: 'Domov',
    favorites: 'Obľúbené',
    add: 'Pridať',

    // Auth
    email: 'Email',
    password: 'Heslo',
    firstName: 'Meno',
    lastName: 'Priezvisko',
    displayName: 'Prezývka',
    displayNameHelper: 'Ako sa chceš volať v appke',
    country: 'Krajina',
    phoneNumber: 'Telefónne číslo',
    signIn: 'Prihlásiť sa',
    signUp: 'Registrovať sa',
    dontHaveAccount: 'Nemáš účet?',
    alreadyHaveAccount: 'Máš už účet?',
    or: 'Alebo',
    signInWithApple: 'Prihlásiť sa s Apple',
    signInWithGoogle: 'Prihlásiť sa cez Google',
    invalidEmail: 'Neplatná emailová adresa',
    passwordTooShort: 'Heslo musí mať aspoň 6 znakov',
    loginFailed: 'Prihlásenie zlyhalo. Skontrolujte svoje údaje.',
    registrationFailed: 'Registrácia zlyhala. Skúste to znova.',
    termsNotice: 'Pokračovaním súhlasíte s našimi Podmienkami a Pravidlami ochrany súkromia',
    findWorkGetHired: 'Nájdi prácu. Nechaj sa najať.',
    accountNotFound: 'Účet neexistuje. Zaregistruj sa.',
    allFieldsRequired: 'Všetky polia sú povinné',
    invalidPhoneNumber: 'Neplatné telefónne číslo',
    dataSaved: 'Údaje uložené!',
    notLoggedIn: 'Nie si prihlásený',
    registrationSuccessful: 'Registrácia úspešná!',
    mustBeLoggedIn: 'Musíte byť prihlásený',

    // Welcome
    welcomeSubtitle: 'Čo hľadáte?',
    lookingForWork: 'Hľadám prácu',
    browseJobs: 'Prezerajte a uchádzajte sa o práce',
    postJob: 'Ponúkam prácu',
    hireWorkers: 'Najímajte pracovníkov a spravujte práce',
    changeRoleAnytime: 'Svoju rolu môžete kedykoľvek zmeniť v Nastaveniach',

    // Home Screen
    welcomeBack: 'Vitajte späť',
    searchJobsPlaceholder: 'Hľadať práce, firmy...',
    categories: 'Kategórie',
    availableJobs: 'Dostupné práce',
    noJobsFound: 'Žiadne práce nenájdené',
    tryAdjustingSearch: 'Skúste upraviť vyhľadávanie alebo filtre',
    all: 'Všetko',
    noJobsYet: 'Zatiaľ žiadne brigády',
    noJobsYetWorker: 'Momentálne nie sú dostupné žiadne brigády. Skúste to neskôr!',
    noJobsYetEmployer: 'Buďte prvý kto pridá brigádu!',

    // Messages Screen
    messages: 'Správy',
    chatWithEmployers: 'Chatujte so zamestnávateľmi a pracovníkmi',
    searchConversations: 'Hľadať konverzácie...',
    noMessagesYet: 'Zatiaľ žiadne správy',
    startApplyingToConnect: 'Začnite sa uchádzať o práce a spojte sa so zamestnávateľmi',
    contactEmployer: 'Kontaktovať zamestnávateľa',
    startConversationWith: 'Začať konverzáciu s',
    chatWithEmployersWorkers: 'Chatujte so zamestnávateľmi a pracovníkmi',

    // Saved Screen
    savedJobs: 'Uložené práce',
    noSavedJobsYet: 'Zatiaľ žiadne uložené práce',
    tapHeartToSave: 'Klepnite na ikonu srdca pri akejkoľvek práci a uložte si ju',

    // Post Job Screen
    postAJob: 'Pridať prácu',
    findPerfectWorker: 'Nájdite ideálneho pracovníka pre vaše potreby',
    jobTitle: 'Názov práce',
    jobTitlePlaceholder: 'napr. Barista na víkendové zmeny',
    description: 'Popis',
    descriptionPlaceholder: 'Popíšte pracovné povinnosti...',
    location: 'Miesto',
    locationPlaceholder: 'napr. Centrum, Bratislava',
    salaryType: 'Typ platu',
    hourly: 'Hodinová',
    fixed: 'Fixná',
    hourlyRate: 'Hodinová sadzba (€)',
    fixedAmount: 'Fixná suma (€)',
    ratePlaceholder: 'napr. 10',
    amountPlaceholder: 'napr. 200',
    duration: 'Trvanie',
    durationPlaceholder: 'napr. Len víkendy, 1-2 dni',
    category: 'Kategória',
    postJobButton: 'Pridať prácu',
    jobPosted: 'Práca pridaná!',
    jobPostedMessage: 'Vaša ponuka práce je teraz aktívna a viditeľná pre pracovníkov.',
    jobPostedSuccess: 'Vaša brigáda bola úspešne zverejnená',
    findIdealWorker: 'Nájdite ideálneho pracovníka pre vaše potreby',
    requireIntroFromApplicants: 'Vyžadovať predstavenie od uchádzačov',
    requireIntroHelperText: 'Worker bude musieť napísať krátku správu prečo je vhodný pre túto prácu',

    // Application Flow
    applyForJobQuestion: 'Aplikovať na brigádu?',
    doYouWantToApply: 'Chcete aplikovať na túto brigádu?',
    writeWhySuitable: 'Napíšte prečo ste vhodný',
    minCharacters: '(Min. 20 znakov)',
    confirmApplication: 'Potvrdiť aplikáciu',
    sendApplication: 'Odoslať aplikáciu',
    applicationSent: 'Aplikácia odoslaná!',
    employerReceivedRequest: 'Zamestnávateľ dostal vašu žiadosť. Dostanete notifikáciu o odpovedi.',
    gotIt: 'Rozumiem',
    applied: 'Aplikované ✓',
    applicationSuccessfullySent: 'Aplikácia úspešne odoslaná',

    // Profile Screen
    profile: 'Profil',
    currentMode: 'Aktuálny režim',
    workerMode: 'Režim pracovníka',
    employerMode: 'Režim zamestnávateľa',
    lookingForJobs: 'Hľadám prácu',
    offeringWork: 'Ponúkam prácu',
    postingJobs: 'Pridávam práce',
    switch: 'Prepnúť',
    switchMode: 'Prepnúť',
    myApplications: 'Moje žiadosti',
    workHistory: 'História práce',
    helpCenter: 'Centrum pomoci',
    support: 'Podpora',
    surname: 'Priezvisko',
    selectCountry: 'Vybrať krajinu',
    saveChanges: 'Uložiť zmeny',
    profileSettings: 'Nastavenia profilu',
    privacySettings: 'Nastavenia súkromia',
    completed: 'Dokončené',
    rating: 'Hodnotenie',
    reviews: 'Recenzie',
    signOut: 'Odhlásiť sa',
    selectPhoto: 'Vybrať fotku',
    takePhoto: 'Odfotiť',
    removePhoto: 'Odstrániť fotku',

    // My Applications Screen
    pending: 'Čakajúce',
    accepted: 'Schválené',
    history: 'História',
    waitingForResponse: 'Čaká na odpoveď',
    rejected: 'Zamietnuté',
    noApplicationsYet: 'Zatiaľ žiadne aplikácie',
    startApplyingToJobs: 'Začnite hľadať prácu a aplikujte na brigády',
    findJobs: 'Hľadať brigády',
    appliedAgo: 'Aplikované pred',
    daysAgo: 'dňami',
    hoursAgo: 'hodinami',

    // Employer - My Jobs Screen
    myJobs: 'Moje brigády',
    newApplications: 'nových aplikácií',
    open: 'Otvorené',
    inProgress: 'V procese',
    completedStatus: 'Dokončené',
    cancelled: 'Zrušené',
    noJobsPostedYet: 'Zatiaľ žiadne brigády',
    postYourFirstJob: 'Pridajte svoju prvú brigádu a začnite najímať!',

    // Employer - Job Detail with Applications
    newTab: 'Nové',
    acceptedTab: 'Schválené',
    rejectedTab: 'Zamietnuté',
    accept: 'Schváliť',
    reject: 'Zamietnuť',
    contact: 'Kontaktovať',
    markAsCompleted: 'Označiť ako dokončené',
    cancelJob: 'Zrušiť brigádu',
    workerAccepted: 'Worker schválený!',
    applicationRejected: 'Aplikácia zamietnutá',
    jobMarkedCompleted: 'Brigáda označená ako dokončená!',
    noApplicationsForJob: 'Zatiaľ žiadne aplikácie',
    waitingForWorkers: 'Čaká sa na aplikácie workerov',
    workerInfo: 'Info o workerovi',
    applicationMessage: 'Správa od workera',
    failedToLoadJob: 'Nepodarilo sa načítať brigádu',
    failedToUpdateStatus: 'Nepodarilo sa aktualizovať status',
    noApplicantsInCategory: 'Žiadni uchádzači v tejto kategórii',
    new: 'Nové',

    // P4 select → S5 escrow
    selectWorker: 'Vybrať brigádnika',
    fundEscrow: 'Zaplatiť do úschovy',
    awaitingSignatures: 'Čaká na podpisy',
    escrowConfirmTitle: 'Platba do úschovy',
    reward: 'Odmena',
    serviceFee: 'Servisný poplatok',
    totalToPay: 'Spolu na úhradu',
    escrowHeldNote: 'Peniaze sú bezpečne držané v úschove a brigádnikovi sa uvoľnia až po tvojom schválení hotovej práce.',
    payNow: 'Zaplatiť teraz',
    escrowFunded: 'Peniaze sú v úschove',
    escrowFundedNote: 'Ďalší krok: obe strany podpíšu zmluvu.',
    verifiedBadge: 'Overený',
    selectionFailed: 'Brigádnika sa nepodarilo vybrať. Skús to znova.',
    done: 'Hotovo',
    accountSettings: 'Nastavenia účtu',

    // P5/W6 booking hub + S3 sign
    bookingTitle: 'Rezervácia',
    stepEscrow: 'Platba v úschove',
    stepContract: 'Podpisy zmluvy',
    stepWork: 'Pracovný deň (QR dochádzka)',
    stepRelease: 'Schválenie a výplata',
    signContract: 'Podpísať zmluvu',
    waitingForPosterSign: 'Čaká sa na podpis zadávateľa',
    waitingForWorkerSign: 'Čaká sa na podpis brigádnika',
    approveAndRelease: 'Schváliť prácu a uvoľniť platbu',
    paymentReleased: 'Platba uvoľnená',
    paymentReleasedNote: 'Peniaze boli pripísané do peňaženky brigádnika.',
    qrComingSoon: 'QR dochádzka — čoskoro',
    contractTitle: 'Zmluva',
    contractSampleNote: 'VZOR — šablóna zatiaľ neoverená právnikom. Len na demo.',
    enterOtp: 'Zadaj SMS kód',
    otpDemoHint: 'Demo OTP: 123456',
    confirmSign: 'Podpísať',
    signFailed: 'Podpis zlyhal. Skontroluj kód a skús znova.',
    bookingNotFound: 'Rezervácia nenájdená',
    workerLabel: 'Brigádnik',
    posterLabel: 'Zadávateľ',
    bookingCancelled: 'Rezervácia zrušená',
    bookingDisputed: 'Rezervácia v spore',
    waitingForRelease: 'Čaká sa na schválenie práce zadávateľom',
    checkInWorker: 'Check-in brigádnika',
    checkOutWorker: 'Check-out brigádnika',
    workedTime: 'Odpracované',
    workingSince: 'Pracuje od',
    estimatedHoursLabel: 'Odhadovaný počet hodín',
    estimatedHoursHint: 'Použije sa na rezerváciu platby v úschove (sadzba × hodiny)',
    perHourShort: 'h',

    // W13 public profile
    memberSince: 'Členom od',
    completedJobsLabel: 'Hotové brigády',
    postedJobsLabel: 'Zadané brigády',
    reviewsTitle: 'Recenzie',
    noReviewsYet: 'Zatiaľ žiadne recenzie',
    sendMessage: 'Poslať správu',
    profileNotFound: 'Profil nenájdený',
    ratingLabel: 'Hodnotenie',
    peopleSection: 'Ľudia',
    viewProfile: 'Zobraziť profil',

    // S7 blind review
    leaveReviewTitle: 'Ohodnoť spoluprácu',
    reviewCommentPlaceholder: 'Napíš krátku recenziu…',
    submitReview: 'Odoslať hodnotenie',
    reviewThanks: 'Ďakujeme za hodnotenie!',
    reviewBlindNote: 'Recenzie sa odhalia, keď ohodnotia obe strany.',
    reviewRevealedNote: 'Obe recenzie sú teraz verejné.',
    reviewFailed: 'Hodnotenie sa nepodarilo odoslať. Skús to znova.',

    // W7/S6 QR attendance
    showQr: 'Ukáž QR',
    scanQr: 'Skenuj QR',
    waitingForCheckIn: 'Čakáme na check-in od Postera',
    workingSinceQr: 'Pracuješ od',
    checkedOutSummary: 'Odchod potvrdený',
    qrRefreshesIn: 'Obnoví sa za',
    offlineQrWarning: 'Bez pripojenia — QR nemusí byť platný; Poster ho môže odmietnuť.',
    closeAction: 'Zatvoriť',
    scanQrTitle: 'Naskenuj QR brigádnika',
    scanQrHint: 'Namier kameru na QR kód',
    cameraDenied: 'Prístup ku kamere zamietnutý',
    cameraDeniedHint: 'Povoľ prístup ku kamere v nastaveniach prehliadača, aby si mohol skenovať QR kód.',
    qrExpiredError: 'QR vypršal — požiadaj brigádnika o obnovenie',
    qrWrongBookingError: 'Tento QR nepatrí k tejto brigáde',
    qrUsedError: 'Tento QR už bol použitý',
    qrGenericError: 'QR kód sa nepodarilo prečítať. Skús to znova.',
    scanSuccessCheckIn: 'Check-in',
    scanSuccessCheckOut: 'Check-out',
    sosContact: 'SOS / Kontakt',

    // P2 wizard
    wizardStepOf: 'Krok',
    wizardBack: 'Späť',
    wizardNext: 'Pokračovať',
    wizardPublish: 'Zverejniť brigádu',
    wizardPublishing: 'Zverejňujem…',
    stepCategoryTitle: 'Kategória',
    stepDescriptionTitle: 'Popíš úlohu',
    stepPayTitle: 'Odmena',
    stepLocationTitle: 'Miesto',
    stepScheduleTitle: 'Miesta a rozvrh',
    stepSettingsTitle: 'Nastavenia',
    stepSummaryTitle: 'Súhrn a publikovanie',
    taskNatureLabel: 'O aký typ úlohy ide?',
    taskNatureResult: 'Konkrétny výsledok',
    taskNatureResultHint: 'napr. upratať byt, doručiť balíky',
    taskNatureActivity: 'Priebežná / opakovaná činnosť',
    taskNatureActivityHint: 'napr. pravidelné zmeny, opakovaná práca',
    postingAsLabel: 'Zadávam ako',
    postingAsIndividual: 'Súkromná osoba',
    postingAsCompany: 'Firma (IČO)',
    companyNameLabel: 'Názov firmy',
    companyIcoLabel: 'IČO',
    companyDicLabel: 'DIČ (nepovinné)',
    slotsCountLabel: 'Počet miest',
    startDateLabel: 'Dátum a čas začiatku',
    recurringLabel: 'Opakovaná práca',
    recurringHint: 'Zapni pri pravidelných/týždenných zmenách (ovplyvňuje typ zmluvy)',
    sosSettingLabel: 'Urgentné (SOS)',
    sosSettingHint: 'Zvýraznené červeným odznakom, vyššia viditeľnosť',
    visibilityLabel: 'Viditeľnosť',
    visibilityPublic: 'Verejná',
    visibilityInviteOnly: 'Len na pozvanie',
    feeGross: 'Odmena',
    feeService: 'Servisný poplatok',
    feeNet: 'Brigádnik dostane',
    contractTypePreview: 'Zmluva',
    wizardValidationError: 'Vyplň prosím tento krok, kým budeš pokračovať.',
    jobPublishedTitle: 'Brigáda zverejnená!',

    // Job Detail Screen
    jobNotFound: 'Práca nenájdená',
    aboutThisJob: 'O tejto práci',
    requirements: 'Požiadavky',
    applicants: 'Uchádzači',
    perHour: 'Za hodinu',
    fixedRate: 'Fixná sadzba',
    urgentHiring: 'Urgentné - Okamžité prijímanie',
    applicationSubmitted: 'Žiadosť odoslaná!',
    alreadyApplied: 'Už ste sa prihlásili',
    applyNow: 'Prihlásiť sa',
    urgent: 'Urgentné',
    applicantsCount: 'uchádzačov',
    applyForJob: 'Aplikovať na brigádu',
    fixedPrice: 'Fixná cena',
    jobDescription: 'Popis práce',
    readMore: 'Čítať viac',
    employer: 'Zamestnávateľ',
    reviewsText: 'recenzií',
    message: 'Správa',
    availability: 'Dostupnosť',

    // Settings
    settings: 'Nastavenia',
    appearance: 'Vzhľad',
    light: 'Svetlý',
    dark: 'Tmavý',
    system: 'Systém',
    general: 'Všeobecné',
    notifications: 'Notifikácie',
    language: 'Jazyk',
    changeMode: 'Zmeniť režim',
    changeModeDescription: 'Prepnúť medzi Pracovníkom a Zamestnávateľom',
    account: 'Účet',
    logOut: 'Odhlásiť sa',
    logOutConfirmTitle: 'Odhlásiť sa?',
    logOutConfirmMessage: 'Ste si istí, že sa chcete odhlásiť?',
    version: 'Brigzy v1.0.0',
    editProfile: 'Upraviť profil',
    profileUpdated: 'Profil aktualizovaný',
    profileUpdateSuccess: 'Váš profil bol úspešne aktualizovaný',
    tapToChangePhoto: 'Kliknutím zmeníte fotku',
    changesSaved: 'Zmeny uložené!',
    failedToSaveChanges: 'Nepodarilo sa uložiť zmeny',
    uploadingPhoto: 'Nahrávam fotku...',
    photoSuccessfullyChanged: 'Fotka úspešne zmenená!',
    failedToUploadPhoto: 'Nepodarilo sa nahrať fotku',
    fileTooLarge: 'Súbor je príliš veľký (max 5MB)',

    // Not Found Screen
    oops: 'Ups!',
    screenDoesntExist: 'Táto obrazovka neexistuje.',
    goToHomeScreen: 'Prejsť na domovskú obrazovku!',

    // Modal
    modal: 'Modálne okno',

    // Categories
    catRestaurant: 'Reštaurácia',
    catRetail: 'Maloobchod',
    catDelivery: 'Doručovanie',
    catCleaning: 'Upratovanie',
    catEvents: 'Podujatia',
    catWarehouse: 'Sklad',
    catOffice: 'Kancelária',
    catOther: 'Iné',
  },
};

export type TextKey = keyof TextMap;

// Get text for a specific language
export function getText(language: Language, key: TextKey): string {
  return texts[language][key];
}

// Get all texts for a language
export function getTexts(language: Language): TextMap {
  return texts[language];
}

export default texts;

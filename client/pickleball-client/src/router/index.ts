import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../store/auth';
import { useAdminStore } from '../store/admin';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomePage.vue'),
      meta: { title: 'Home' }
    },
    // Auth Routes
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/auth/LoginPage.vue'),
      meta: { title: 'Login', guest: true }
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/auth/RegisterPage.vue'),
      meta: { title: 'Register', guest: true }
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('../views/auth/ForgotPasswordPage.vue'),
      meta: { title: 'Forgot Password', guest: true }
    },
    {
      path: '/reset-password/:token',
      name: 'reset-password',
      component: () => import('../views/auth/ResetPasswordPage.vue'),
      meta: { title: 'Reset Password', guest: true }
    },
    // Court Routes
    {
      path: '/courts',
      name: 'courts',
      component: () => import('../views/CourtsPage.vue'),
      meta: { title: 'Courts' }
    },
    {
      path: '/courts/:id',
      name: 'court-details',
      component: () => import('../views/CourtDetailPage.vue'),
      meta: { title: 'Court Details' }
    },
    {
      path: '/courts/:id/book',
      name: 'book-court',
      component: () => import('../views/BookingPage.vue'),
      meta: { title: 'Book Court', requiresAuth: true }
    },
    // User Routes
    {
      path: '/bookings',
      name: 'bookings',
      component: () => import('../views/user/BookingsPage.vue'),
      meta: { title: 'My Bookings', requiresAuth: true }
    },
    {
      path: '/bookings/:id',
      name: 'booking-details',
      component: () => import('../views/user/BookingDetailPage.vue'),
      meta: { title: 'Booking Details', requiresAuth: true }
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/user/ProfilePage.vue'),
      meta: { title: 'My Profile', requiresAuth: true }
    },
    {
      path: '/rewards',
      name: 'rewards',
      component: () => import('../views/user/RewardsPage.vue'),
      meta: { title: 'My Rewards', requiresAuth: true }
    },
    // Court Owner Routes
    {
      path: '/owner/courts',
      name: 'owner-courts',
      component: () => import('../views/owner/OwnerCourtsPage.vue'),
      meta: { title: 'My Courts', requiresAuth: true, role: 'court_owner' }
    },
    {
      path: '/owner/courts/new',
      name: 'owner-courts-new',
      component: () => import('../views/owner/OwnerCourtFormPage.vue'),
      meta: { title: 'Add New Court', requiresAuth: true, role: 'court_owner' }
    },
    {
      path: '/owner/courts/:id/edit',
      name: 'owner-courts-edit',
      component: () => import('../views/owner/OwnerCourtFormPage.vue'),
      meta: { title: 'Edit Court', requiresAuth: true, role: 'court_owner' }
    },
    {
      path: '/owner/courts/:id/timeslots',
      name: 'owner-court-timeslots',
      component: () => import('../views/owner/OwnerCourtTimeslotsPage.vue'),
      meta: { title: 'Manage Timeslots', requiresAuth: true, role: 'court_owner' }
    },
    {
      path: '/owner/bookings',
      name: 'owner-bookings',
      component: () => import('../views/owner/OwnerBookingsPage.vue'),
      meta: { title: 'Court Bookings', requiresAuth: true, role: 'court_owner' }
    },
    {
      path: '/owner/analytics',
      name: 'owner-analytics',
      component: () => import('../views/owner/OwnerAnalyticsPage.vue'),
      meta: { title: 'Court Analytics', requiresAuth: true, role: 'court_owner' }
    },
    // Payment Routes
    {
      path: '/bookings/:id/payment',
      name: 'payment',
      component: () => import('../views/payment/PaymentView.vue'),
      meta: { title: 'Payment', requiresAuth: true }
    },
    {
      path: '/payment/success',
      name: 'payment-success',
      component: () => import('../views/payment/PaymentResultView.vue'),
      meta: { title: 'Payment Success', requiresAuth: true }
    },
    {
      path: '/payment/failure',
      name: 'payment-failure',
      component: () => import('../views/payment/PaymentResultView.vue'),
      meta: { title: 'Payment Failed', requiresAuth: true }
    },
    {
      path: '/payments',
      name: 'payment-history',
      component: () => import('../views/payment/PaymentHistoryView.vue'),
      meta: { title: 'Payment History', requiresAuth: true }
    },
    // Admin Routes (separate admin panel)
    {
      path: '/admin/login',
      name: 'admin-login',
      component: () => import('../views/admin/AdminLoginView.vue'),
      meta: { title: 'Admin Login', adminGuest: true }
    },
    {
      path: '/admin/dashboard',
      name: 'admin-dashboard',
      component: () => import('../views/admin/AdminDashboardView.vue'),
      meta: { title: 'Admin Dashboard', requiresAdminAuth: true }
    },
    {
      path: '/admin/users',
      name: 'admin-users',
      component: () => import('../views/admin/AdminUsersPage.vue'),
      meta: { title: 'Manage Users', requiresAdminAuth: true }
    },
    {
      path: '/admin/courts',
      name: 'admin-courts',
      component: () => import('../views/admin/AdminCourtsPage.vue'),
      meta: { title: 'Manage Courts', requiresAdminAuth: true }
    },
    {
      path: '/admin/bookings',
      name: 'admin-bookings',
      component: () => import('../views/admin/AdminBookingsPage.vue'),
      meta: { title: 'Manage Bookings', requiresAdminAuth: true }
    },
    {
      path: '/admin/promotions',
      name: 'admin-promotions',
      component: () => import('../views/admin/AdminPromotionsPage.vue'),
      meta: { title: 'Manage Promotions', requiresAdminAuth: true }
    },
    {
      path: '/admin/rewards',
      name: 'admin-rewards',
      component: () => import('../views/admin/AdminRewardsPage.vue'),
      meta: { title: 'Manage Rewards', requiresAdminAuth: true }
    },
    {
      path: '/admin/payments',
      name: 'admin-payments',
      component: () => import('../views/admin/PaymentReportView.vue'),
      meta: { title: 'Payment Reports', requiresAdminAuth: true }
    },
    {
      path: '/admin',
      redirect: '/admin/dashboard'
    },
    // Error pages
    {
      path: '/not-found',
      name: 'not-found',
      component: () => import('../views/errors/NotFoundPage.vue'),
      meta: { title: 'Page Not Found' }
    },
    {
      path: '/forbidden',
      name: 'forbidden',
      component: () => import('../views/errors/ForbiddenPage.vue'),
      meta: { title: 'Access Forbidden' }
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: { name: 'not-found' }
    }
  ]
});

// Navigation guards
router.beforeEach((to, from, next) => {
  console.log(`Router guard: Navigating from ${from.path} to ${to.path}`);

  // Set document title
  document.title = `${to.meta.title || 'Pickleball Booking'} | Pickleball Court Booking`;

  // Xử lý bfcache - Đặt một thuộc tính để đánh dấu rằng trang đã được xử lý bởi router
  // Điều này giúp giảm thiểu lỗi "Unchecked runtime.lastError" khi sử dụng back/forward cache
  window.sessionStorage.setItem('lastNavigationTimestamp', Date.now().toString());

  // Get auth state from store if possible, otherwise fallback to localStorage
  let isAuthenticated, user, isAdminAuthenticated, admin;

  try {
    const authStore = useAuthStore();
    isAuthenticated = authStore.isAuthenticated;
    user = authStore.user;
    console.log('User auth state from store:', { isAuthenticated, user });
  } catch (e) {
    // Fallback to localStorage if store is not available
    const token = localStorage.getItem('token');
    user = JSON.parse(localStorage.getItem('user') || 'null');
    isAuthenticated = !!token && !!user;
    console.log('User auth state from localStorage:', { isAuthenticated, hasToken: !!token });
  }

  // Check admin authentication
  try {
    const adminStore = useAdminStore();
    isAdminAuthenticated = adminStore.isAuthenticated;
    admin = adminStore.admin;
    console.log('Admin auth state from store:', { isAdminAuthenticated, admin });
  } catch (e) {
    // Fallback to localStorage if store is not available
    const adminToken = localStorage.getItem('admin_token');
    admin = JSON.parse(localStorage.getItem('admin') || 'null');
    isAdminAuthenticated = !!adminToken && !!admin;
    console.log('Admin auth state from localStorage:', { isAdminAuthenticated, hasToken: !!adminToken });
  }

  // Handle routes that require user authentication
  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } });
    return;
  }

  // Handle routes that require specific user role
  if (to.meta.role && isAuthenticated && user && user.role !== to.meta.role) {
    next({ name: 'forbidden' });
    return;
  }

  // Handle routes that require admin authentication
  if (to.meta.requiresAdminAuth) {
    console.log('Route requires admin auth:', to.path);
    if (!isAdminAuthenticated) {
      console.log('Admin not authenticated, redirecting to admin login');
      next({ name: 'admin-login', query: { redirect: to.fullPath } });
      return;
    }

    console.log('Admin is authenticated, proceeding to admin route');

    // Initialize admin store if needed
    try {
      const adminStore = useAdminStore();
      if (!adminStore.admin) {
        console.log('Initializing admin store');
        adminStore.init();
      }
    } catch (e) {
      console.error('Error initializing admin store:', e);
    }
  }

  // Handle routes that should only be accessible to guests
  if (to.meta.guest && isAuthenticated) {
    console.log('Guest route accessed by authenticated user, redirecting to home');
    next({ name: 'home' });
    return;
  }

  // Handle routes that should only be accessible to admin guests
  if (to.meta.adminGuest && isAdminAuthenticated) {
    console.log('Admin guest route accessed by authenticated admin, redirecting to admin dashboard');
    next({ name: 'admin-dashboard' });
    return;
  }

  console.log('Navigation allowed to:', to.path);
  next();
});

export default router;

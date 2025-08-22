import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'services/api_service.dart';
import 'services/auth_service.dart';
import 'screens/home_screen.dart';
import 'screens/booking_screen.dart';
import 'screens/quote_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/login_screen.dart';
import 'screens/legal/privacy_screen.dart';
import 'screens/legal/terms_screen.dart';
import 'screens/legal/warranty_screen.dart';
import 'screens/legal/mentions_screen.dart';
import 'utils/themes.dart';

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  MyApp({super.key});

  final GoRouter _router = GoRouter(
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) => const HomeScreen(),
      ),
      GoRoute(
        path: '/booking',
        builder: (context, state) => const BookingScreen(),
      ),
      GoRoute(
        path: '/quote',
        builder: (context, state) => const QuoteScreen(),
      ),
      GoRoute(
        path: '/dashboard',
        builder: (context, state) => const DashboardScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/privacy',
        builder: (context, state) => const PrivacyScreen(),
      ),
      GoRoute(
        path: '/terms',
        builder: (context, state) => const TermsScreen(),
      ),
      GoRoute(
        path: '/warranty',
        builder: (context, state) => const WarrantyScreen(),
      ),
      GoRoute(
        path: '/mentions',
        builder: (context, state) => const MentionsScreen(),
      ),
    ],
  );

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthService()),
        Provider(create: (_) => ApiService()),
      ],
      child: MaterialApp.router(
        title: 'MY JANTES - Expert en rénovation de jantes',
        debugShowCheckedModeBanner: false,
        theme: AppThemes.lightTheme,
        routerConfig: _router,
      ),
    );
  }
}
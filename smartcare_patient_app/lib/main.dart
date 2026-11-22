import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/config/app_config.dart';
import 'core/theme/app_theme.dart';
import 'data/repositories/auth_repository.dart';
import 'data/repositories/hospital_repository.dart';
import 'data/repositories/request_repository.dart';
import 'data/repositories/pricing_repository.dart';
import 'data/repositories/billing_repository.dart';
import 'data/repositories/blood_repository.dart';
import 'data/repositories/referral_repository.dart';
import 'data/services/api_client.dart';
import 'data/services/storage_service.dart';
import 'providers/auth_provider.dart';
import 'providers/hospital_provider.dart';
import 'providers/request_provider.dart';
import 'providers/pricing_provider.dart';
import 'providers/billing_provider.dart';
import 'providers/blood_provider.dart';
import 'providers/referral_provider.dart';
import 'ui/screens/splash/splash_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize persistent storage
  final storageService = await StorageService.init();

  // Load custom API host if configured
  final customHost = storageService.getCustomApiHost();
  if (customHost != null && customHost.isNotEmpty) {
    AppConfig.setCustomBaseUrl(customHost);
  }

  // Initialize API and Repositories
  final apiClient = ApiClient(storageService);
  final authRepository = AuthRepository(apiClient, storageService);
  final hospitalRepository = HospitalRepository(apiClient);
  final requestRepository = RequestRepository(apiClient);
  final pricingRepository = PricingRepository(apiClient);
  final billingRepository = BillingRepository(apiClient);
  final bloodRepository = BloodRepository(apiClient);
  final referralRepository = ReferralRepository(apiClient);

  runApp(
    MultiProvider(
      providers: [
        Provider<StorageService>.value(value: storageService),
        Provider<ApiClient>.value(value: apiClient),
        Provider<AuthRepository>.value(value: authRepository),
        Provider<HospitalRepository>.value(value: hospitalRepository),
        Provider<RequestRepository>.value(value: requestRepository),
        Provider<PricingRepository>.value(value: pricingRepository),
        Provider<BillingRepository>.value(value: billingRepository),
        Provider<BloodRepository>.value(value: bloodRepository),
        Provider<ReferralRepository>.value(value: referralRepository),
        ChangeNotifierProvider<AuthProvider>(
          create: (_) => AuthProvider(authRepository),
        ),
        ChangeNotifierProvider<HospitalProvider>(
          create: (_) => HospitalProvider(hospitalRepository, storageService),
        ),
        ChangeNotifierProvider<RequestProvider>(
          create: (_) => RequestProvider(requestRepository, storageService),
        ),
        ChangeNotifierProvider<PricingProvider>(
          create: (_) => PricingProvider(pricingRepository),
        ),
        ChangeNotifierProvider<BillingProvider>(
          create: (_) => BillingProvider(billingRepository),
        ),
        ChangeNotifierProvider<BloodProvider>(
          create: (_) => BloodProvider(bloodRepository),
        ),
        ChangeNotifierProvider<ReferralProvider>(
          create: (_) => ReferralProvider(referralRepository),
        ),
      ],
      child: const SmartCarePatientApp(),
    ),
  );
}

class SmartCarePatientApp extends StatelessWidget {
  const SmartCarePatientApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SmartCare Patient',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: const SplashScreen(),
    );
  }
}

import 'package:flutter/foundation.dart';

class AppConfig {
  static const String appName = 'SmartCare Patient';
  static const String appVersion = '1.0.0';

  // Network URLs
  // 10.211.56.163 is the developer machine Wi-Fi IP for physical mobile devices
  // 10.0.2.2 is the default alias to host loopback for Android emulator
  // 127.0.0.1 is for Windows Desktop and Web
  static const String productionHost = 'https://smartcarefinal.onrender.com/api';
  static const String defaultWifiHost = productionHost;
  static const String defaultEmulatorHost = productionHost;
  static const String defaultLocalhost = productionHost;

  static String _activeBaseUrl = defaultWifiHost;

  static String get baseUrl {
    // Use production URL in release builds; otherwise use defaults for development.
    if (kReleaseMode) return productionHost;
    if (kIsWeb) return defaultLocalhost;
    if (defaultTargetPlatform == TargetPlatform.windows) return defaultLocalhost;
    return _activeBaseUrl;
  }

  static void setCustomBaseUrl(String url) {
    if (url.isNotEmpty) {
      _activeBaseUrl = url.endsWith('/api') ? url : '$url/api';
    }
  }

  // Emergency contact configurations
  static const String emergencyHotline = '911';
  static const String emergencyAmbulance = '108';

  // Default coordinate center (Downtown Metro Area / Regional Center)
  static const double defaultLatitude = 18.5204;
  static const double defaultLongitude = 73.8567;
  static const String defaultLocationName = 'Downtown Metro Area';

  // API Request timeout
  static const Duration connectTimeout = Duration(seconds: 12);
}

import 'package:flutter_test/flutter_test.dart';
import 'package:smartcare_patient_app/core/config/app_config.dart';

void main() {
  test('AppConfig smoke test', () {
    expect(AppConfig.appName, 'SmartCare Patient');
    expect(AppConfig.defaultWifiHost, contains('8001'));
  });
}

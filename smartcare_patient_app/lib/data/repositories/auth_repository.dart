import '../models/user_model.dart';
import '../services/api_client.dart';
import '../services/storage_service.dart';

class AuthRepository {
  final ApiClient _api;
  final StorageService _storage;

  AuthRepository(this._api, this._storage);

  Future<AuthSession> login({
    required String email,
    required String password,
    String expectedRole = 'PATIENT',
  }) async {
    final response = await _api.post(
      '/auth/login',
      body: {
        'email': email.trim(),
        'password': password,
        'expected_role': expectedRole,
      },
    );

    final session = AuthSession.fromLoginResponse(response as Map<String, dynamic>);
    await _storage.saveToken(session.accessToken);
    await _storage.saveUser(session.user);
    return session;
  }

  Future<Map<String, dynamic>> registerHospital({
    required String name,
    required String email,
    required String password,
    required String licenseNumber,
    required String address,
    required String city,
    required String state,
    required String pincode,
    required String emergencyPhone,
    String? receptionPhone,
    String? website,
    String type = 'General Hospital',
    int totalCapacity = 100,
    int ambulanceCount = 3,
    double latitude = 12.9716,
    double longitude = 77.5946,
    String? documentsSummary,
  }) async {
    final response = await _api.post(
      '/auth/register-hospital',
      body: {
        'name': name.trim(),
        'email': email.trim(),
        'password': password,
        'license_number': licenseNumber.trim(),
        'type': type,
        'address': address.trim(),
        'city': city.trim(),
        'state': state.trim(),
        'pincode': pincode.trim(),
        'latitude': latitude,
        'longitude': longitude,
        'emergency_phone': emergencyPhone.trim(),
        'reception_phone': receptionPhone?.trim() ?? emergencyPhone.trim(),
        'website': website?.trim(),
        'total_capacity': totalCapacity,
        'ambulance_count': ambulanceCount,
        'documents_summary': documentsSummary ?? 'Medical Establishment License, NABH Certificate, Fire Safety Clearance NOC',
      },
    );
    return response as Map<String, dynamic>;
  }

  Future<AuthSession> registerPatient({
    required String name,
    required String email,
    required String password,
    String? phone,
  }) async {
    final response = await _api.post(
      '/auth/register-patient',
      body: {
        'name': name.trim(),
        'email': email.trim(),
        'password': password,
        'phone': phone?.trim(),
      },
    );

    final session = AuthSession.fromLoginResponse(response as Map<String, dynamic>);
    await _storage.saveToken(session.accessToken);
    await _storage.saveUser(session.user);
    return session;
  }

  Future<UserModel> fetchMe() async {
    final response = await _api.get('/auth/me', requiresAuth: true);
    final user = UserModel.fromJson(response as Map<String, dynamic>);
    await _storage.saveUser(user);
    return user;
  }

  UserModel? getCachedUser() {
    return _storage.getUser();
  }

  bool get isAuthenticated => _storage.getToken() != null;

  Future<void> logout() async {
    await _storage.logout();
  }
}

import 'package:flutter/material.dart';
import '../data/models/user_model.dart';
import '../data/repositories/auth_repository.dart';

class AuthProvider extends ChangeNotifier {
  final AuthRepository _repo;

  UserModel? _user;
  bool _isLoading = false;
  String? _errorMessage;

  AuthProvider(this._repo) {
    _user = _repo.getCachedUser();
    if (_repo.isAuthenticated && _user == null) {
      refreshProfile();
    }
  }

  UserModel? get user => _user;
  bool get isAuthenticated => _repo.isAuthenticated;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<bool> login(String email, String password, {String expectedRole = 'PATIENT'}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final session = await _repo.login(email: email, password: password, expectedRole: expectedRole);
      _user = session.user;
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceFirst('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> registerHospital({
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
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      await _repo.registerHospital(
        name: name,
        email: email,
        password: password,
        licenseNumber: licenseNumber,
        address: address,
        city: city,
        state: state,
        pincode: pincode,
        emergencyPhone: emergencyPhone,
        receptionPhone: receptionPhone,
        website: website,
        type: type,
        totalCapacity: totalCapacity,
        ambulanceCount: ambulanceCount,
        latitude: latitude,
        longitude: longitude,
      );
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceFirst('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> register({
    required String name,
    required String email,
    required String password,
    String? phone,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final session = await _repo.registerPatient(
        name: name,
        email: email,
        password: password,
        phone: phone,
      );
      _user = session.user;
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> refreshProfile() async {
    try {
      _user = await _repo.fetchMe();
      notifyListeners();
    } catch (_) {}
  }

  Future<void> logout() async {
    await _repo.logout();
    _user = null;
    notifyListeners();
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}

import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user_model.dart';

class StorageService {
  static const String _keyToken = 'auth_token';
  static const String _keyUser = 'auth_user';
  static const String _keySavedHospitals = 'saved_hospital_ids';
  static const String _keyRecentSearches = 'recent_searches';
  static const String _keyApiHost = 'custom_api_host';
  static const String _keyLastTicket = 'last_tracked_ticket';

  final SharedPreferences _prefs;

  StorageService(this._prefs);

  static Future<StorageService> init() async {
    final prefs = await SharedPreferences.getInstance();
    return StorageService(prefs);
  }

  // Token Management
  Future<void> saveToken(String token) async {
    await _prefs.setString(_keyToken, token);
  }

  String? getToken() {
    return _prefs.getString(_keyToken);
  }

  Future<void> clearToken() async {
    await _prefs.remove(_keyToken);
  }

  // User Profile
  Future<void> saveUser(UserModel user) async {
    await _prefs.setString(_keyUser, jsonEncode(user.toJson()));
  }

  UserModel? getUser() {
    final raw = _prefs.getString(_keyUser);
    if (raw == null) return null;
    try {
      return UserModel.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    } catch (_) {
      return null;
    }
  }

  Future<void> clearUser() async {
    await _prefs.remove(_keyUser);
  }

  // Saved / Bookmarked Hospitals
  List<int> getSavedHospitalIds() {
    final rawList = _prefs.getStringList(_keySavedHospitals) ?? [];
    return rawList.map((e) => int.tryParse(e) ?? 0).where((id) => id > 0).toList();
  }

  Future<void> toggleSaveHospital(int hospitalId) async {
    final current = getSavedHospitalIds();
    if (current.contains(hospitalId)) {
      current.remove(hospitalId);
    } else {
      current.add(hospitalId);
    }
    await _prefs.setStringList(
      _keySavedHospitals,
      current.map((e) => e.toString()).toList(),
    );
  }

  bool isHospitalSaved(int hospitalId) {
    return getSavedHospitalIds().contains(hospitalId);
  }

  // Recent Searches
  List<String> getRecentSearches() {
    return _prefs.getStringList(_keyRecentSearches) ?? [
      'St. Jude ICU beds',
      'Westside Trauma Center',
      'Memorial General Oxygen',
    ];
  }

  Future<void> addRecentSearch(String query) async {
    if (query.trim().isEmpty) return;
    final current = getRecentSearches();
    current.remove(query.trim());
    current.insert(0, query.trim());
    if (current.length > 8) {
      current.removeLast();
    }
    await _prefs.setStringList(_keyRecentSearches, current);
  }

  Future<void> clearRecentSearches() async {
    await _prefs.setStringList(_keyRecentSearches, []);
  }

  // Custom API Host
  String? getCustomApiHost() {
    return _prefs.getString(_keyApiHost);
  }

  Future<void> setCustomApiHost(String host) async {
    await _prefs.setString(_keyApiHost, host);
  }

  // Last Tracked Ticket
  String? getLastTicketCode() {
    return _prefs.getString(_keyLastTicket);
  }

  Future<void> saveLastTicketCode(String code) async {
    if (code.trim().isEmpty) return;
    await _prefs.setString(_keyLastTicket, code.trim().toUpperCase());
  }

  // Full Logout
  Future<void> logout() async {
    await clearToken();
    await clearUser();
  }
}

import 'dart:async';
import 'package:flutter/material.dart';
import '../../core/config/app_config.dart';
import '../data/models/hospital_model.dart';
import '../data/repositories/hospital_repository.dart';
import '../data/services/storage_service.dart';

class HospitalProvider extends ChangeNotifier {
  final HospitalRepository _hospitalRepo;
  final StorageService _storage;

  List<HospitalModel> _hospitals = [];
  HospitalModel? _selectedHospital;

  bool _isLoading = false;
  bool _isDetailLoading = false;
  String? _errorMessage;

  String _searchQuery = '';
  String _selectedCategory = 'All';
  double? _selectedRadiusKm; // defaults to null (Any Distance / All Facilities)
  String _selectedCity = 'All';

  double _userLat = AppConfig.defaultLatitude;
  double _userLng = AppConfig.defaultLongitude;
  String _locationName = AppConfig.defaultLocationName;

  Timer? _telemetryTimer;

  HospitalProvider(this._hospitalRepo, this._storage) {
    fetchHospitals();
    // Live background telemetry polling every 8 seconds
    _telemetryTimer = Timer.periodic(const Duration(seconds: 8), (_) {
      fetchHospitals(silent: true);
    });
  }

  @override
  void dispose() {
    _telemetryTimer?.cancel();
    super.dispose();
  }

  // Getters
  List<HospitalModel> get hospitals => _hospitals;
  HospitalModel? get selectedHospital => _selectedHospital;
  bool get isLoading => _isLoading;
  bool get isDetailLoading => _isDetailLoading;
  String? get errorMessage => _errorMessage;

  String get searchQuery => _searchQuery;
  String get selectedCategory => _selectedCategory;
  double? get selectedRadiusKm => _selectedRadiusKm;
  String get selectedCity => _selectedCity;

  double get userLat => _userLat;
  double get userLng => _userLng;
  String get locationName => _locationName;

  List<HospitalModel> get savedHospitals {
    final savedIds = _storage.getSavedHospitalIds();
    return _hospitals.where((h) => savedIds.contains(h.id)).toList();
  }

  List<String> get recentSearches => _storage.getRecentSearches();

  bool isSaved(int hospitalId) => _storage.isHospitalSaved(hospitalId);

  Future<void> toggleSave(int hospitalId) async {
    await _storage.toggleSaveHospital(hospitalId);
    notifyListeners();
  }

  Future<void> clearRecentSearches() async {
    await _storage.clearRecentSearches();
    notifyListeners();
  }

  // Actions
  Future<void> fetchHospitals({bool silent = false}) async {
    if (!silent) {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();
    }

    try {
      String? bedTypeParam;
      if (_selectedCategory == 'ICU Beds' || _selectedCategory == 'ICU') {
        bedTypeParam = 'ICU';
      } else if (_selectedCategory == 'General') {
        bedTypeParam = 'General';
      } else if (_selectedCategory == 'Emergency 24/7' || _selectedCategory == 'Emergency') {
        bedTypeParam = 'ER';
      } else if (_selectedCategory == 'Pediatric Care' || _selectedCategory == 'Pediatric') {
        bedTypeParam = 'PICU';
      } else if (_selectedCategory == 'Oxygen Supply' || _selectedCategory == 'Oxygen') {
        bedTypeParam = 'Oxygen';
      }

      final results = await _hospitalRepo.getHospitals(
        q: _searchQuery.trim().isNotEmpty ? _searchQuery.trim() : null,
        city: _selectedCity != 'All' ? _selectedCity : null,
        bedType: bedTypeParam,
        lat: _userLat,
        lng: _userLng,
        radiusKm: _selectedRadiusKm,
      );

      _hospitals = results;
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> setSearchQuery(String query) async {
    _searchQuery = query;
    if (query.isNotEmpty) {
      await _storage.addRecentSearch(query);
    }
    await fetchHospitals();
  }

  Future<void> setCategoryFilter(String category) async {
    if (_selectedCategory == category) return;
    _selectedCategory = category;
    await fetchHospitals();
  }

  Future<void> setRadius(double? radiusKm) async {
    _selectedRadiusKm = radiusKm;
    await fetchHospitals();
  }

  Future<void> setCity(String city) async {
    _selectedCity = city;
    await fetchHospitals();
  }

  void updateLocation({
    required double lat,
    required double lng,
    required String name,
  }) {
    _userLat = lat;
    _userLng = lng;
    _locationName = name;
    fetchHospitals();
  }

  Future<void> selectHospital(int hospitalId) async {
    // 1. Instant optimistic selection from already fetched facilities
    final existing = _hospitals.where((h) => h.id == hospitalId).firstOrNull;
    if (existing != null) {
      _selectedHospital = existing;
      _isDetailLoading = false;
      notifyListeners();
    } else {
      _isDetailLoading = true;
      _errorMessage = null;
      notifyListeners();
    }

    try {
      final detail = await _hospitalRepo.getHospitalDetail(hospitalId);
      _selectedHospital = detail;
      _isDetailLoading = false;
      notifyListeners();
    } catch (e) {
      if (_selectedHospital == null) {
        _errorMessage = e.toString();
      }
      _isDetailLoading = false;
      notifyListeners();
    }
  }

  void clearSelectedHospital() {
    _selectedHospital = null;
    notifyListeners();
  }
}

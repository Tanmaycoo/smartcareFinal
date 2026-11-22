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
  double? _selectedRadiusKm = 10.0;
  String _selectedCity = 'All';

  double _userLat = AppConfig.defaultLatitude;
  double _userLng = AppConfig.defaultLongitude;
  String _locationName = AppConfig.defaultLocationName;

  HospitalProvider(this._hospitalRepo, this._storage) {
    fetchHospitals();
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
  Future<void> fetchHospitals() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      String? bedTypeParam;
      if (_selectedCategory == 'ICU Beds' || _selectedCategory == 'ICU') {
        bedTypeParam = 'ICU';
      } else if (_selectedCategory == 'General') {
        bedTypeParam = 'General';
      }

      _hospitals = await _hospitalRepo.getHospitals(
        q: _searchQuery.isNotEmpty ? _searchQuery : null,
        city: _selectedCity,
        bedType: bedTypeParam,
        lat: _userLat,
        lng: _userLng,
        radiusKm: _selectedRadiusKm,
      );

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
    _isDetailLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _selectedHospital = await _hospitalRepo.getHospitalDetail(hospitalId);
      _isDetailLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString();
      _isDetailLoading = false;
      notifyListeners();
    }
  }

  void clearSelectedHospital() {
    _selectedHospital = null;
    notifyListeners();
  }
}

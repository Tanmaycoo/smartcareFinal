import 'package:flutter/foundation.dart';
import '../core/config/app_config.dart';
import '../data/models/blood_bank_model.dart';
import '../data/models/blood_donor_model.dart';
import '../data/repositories/blood_repository.dart';

class BloodProvider with ChangeNotifier {
  final BloodRepository _bloodRepository;

  BloodProvider(this._bloodRepository);

  List<BloodBank> _bloodBanks = [];
  List<BloodDonor> _donors = [];

  bool _loadingBanks = false;
  bool _loadingDonors = false;
  String? _bankError;
  String? _donorError;

  String _selectedBloodGroup = 'All';
  double _userLat = AppConfig.defaultLatitude;
  double _userLng = AppConfig.defaultLongitude;
  double? _radiusKm = 25.0;

  // Getters
  List<BloodBank> get bloodBanks => _bloodBanks;
  List<BloodDonor> get donors => _donors;
  bool get loadingBanks => _loadingBanks;
  bool get loadingDonors => _loadingDonors;
  String? get bankError => _bankError;
  String? get donorError => _donorError;
  String get selectedBloodGroup => _selectedBloodGroup;
  double get userLat => _userLat;
  double get userLng => _userLng;
  double? get radiusKm => _radiusKm;

  void setCoordinates(double lat, double lng) {
    _userLat = lat;
    _userLng = lng;
    fetchAll();
  }

  void setSelectedBloodGroup(String group) {
    if (_selectedBloodGroup == group) return;
    _selectedBloodGroup = group;
    fetchAll();
  }

  void setRadius(double? radius) {
    _radiusKm = radius;
    fetchAll();
  }

  Future<void> fetchAll() async {
    await Future.wait([
      fetchBloodBanks(),
      fetchDonors(),
    ]);
  }

  Future<void> fetchBloodBanks() async {
    _loadingBanks = true;
    _bankError = null;
    notifyListeners();

    try {
      _bloodBanks = await _bloodRepository.fetchNearbyBloodBanks(
        lat: _userLat,
        lng: _userLng,
        bloodGroup: _selectedBloodGroup == 'All' ? null : _selectedBloodGroup,
        radiusKm: _radiusKm,
      );
    } catch (e) {
      _bankError = e.toString().replaceFirst('Exception: ', '');
      _bloodBanks = [];
    } finally {
      _loadingBanks = false;
      notifyListeners();
    }
  }

  Future<void> fetchDonors() async {
    _loadingDonors = true;
    _donorError = null;
    notifyListeners();

    try {
      _donors = await _bloodRepository.fetchNearbyDonors(
        lat: _userLat,
        lng: _userLng,
        bloodGroup: _selectedBloodGroup == 'All' ? null : _selectedBloodGroup,
        radiusKm: _radiusKm,
        emergencyOnly: true,
      );
    } catch (e) {
      _donorError = e.toString().replaceFirst('Exception: ', '');
      _donors = [];
    } finally {
      _loadingDonors = false;
      notifyListeners();
    }
  }

  Future<bool> registerDonor({
    required String donorName,
    required String bloodGroup,
    required String contactPhone,
    required String city,
    String? address,
    bool isAvailable = true,
  }) async {
    try {
      await _bloodRepository.registerDonor(
        donorName: donorName,
        bloodGroup: bloodGroup,
        contactPhone: contactPhone,
        city: city,
        address: address,
        latitude: _userLat,
        longitude: _userLng,
        isAvailable: isAvailable,
      );
      // Refresh donors list
      await fetchDonors();
      return true;
    } catch (e) {
      return false;
    }
  }

  Future<Map<String, dynamic>?> createEmergencyRequest({
    required int hospitalId,
    int? bloodBankId,
    required String patientName,
    required String bloodGroup,
    String component = 'Whole Blood',
    int unitsRequired = 1,
    String urgencyLevel = 'CRITICAL',
    required String contactPhone,
    String? notes,
  }) async {
    try {
      return await _bloodRepository.createEmergencyBloodRequest(
        hospitalId: hospitalId,
        bloodBankId: bloodBankId,
        patientName: patientName,
        bloodGroup: bloodGroup,
        component: component,
        unitsRequired: unitsRequired,
        urgencyLevel: urgencyLevel,
        contactPhone: contactPhone,
        notes: notes,
      );
    } catch (e) {
      return null;
    }
  }
}

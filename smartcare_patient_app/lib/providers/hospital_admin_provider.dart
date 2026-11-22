import 'package:flutter/material.dart';
import '../data/models/bed_model.dart';
import '../data/models/hospital_model.dart';
import '../data/models/patient_request_model.dart';
import '../data/models/resource_model.dart';
import '../data/models/transfer_model.dart';
import '../data/repositories/hospital_admin_repository.dart';

class HospitalAdminProvider extends ChangeNotifier {
  final HospitalAdminRepository _repo;

  HospitalModel? _hospital;
  List<BedCategoryModel> _beds = [];
  List<ResourceInventoryModel> _resources = [];
  List<PatientRequestModel> _incomingRequests = [];
  List<TransferRequestModel> _transfers = [];

  bool _isLoading = false;
  String? _errorMessage;

  HospitalAdminProvider(this._repo);

  HospitalModel? get hospital => _hospital;
  List<BedCategoryModel> get beds => _beds;
  List<ResourceInventoryModel> get resources => _resources;
  List<PatientRequestModel> get incomingRequests => _incomingRequests;
  List<TransferRequestModel> get transfers => _transfers;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  // Bed quick counts
  int get generalAvailable => _beds
      .where((b) => !b.isIcu && !b.category.toUpperCase().contains('ER'))
      .fold(0, (sum, b) => sum + b.availableBeds);

  int get icuAvailable => _beds
      .where((b) => b.isIcu)
      .fold(0, (sum, b) => sum + b.availableBeds);

  int get erAvailable => _beds
      .where((b) => b.category.toUpperCase().contains('ER') || b.category.toUpperCase().contains('EMERGENCY'))
      .fold(0, (sum, b) => sum + b.availableBeds);

  Future<void> loadHospitalData(int hospitalId) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final futures = await Future.wait([
        _repo.getHospitalDetails(hospitalId),
        _repo.getHospitalBeds(hospitalId),
        _repo.getHospitalResources(hospitalId),
        _repo.getHospitalRequests(hospitalId),
        _repo.getTransfers(hospitalId),
      ]);

      _hospital = futures[0] as HospitalModel;
      _beds = futures[1] as List<BedCategoryModel>;
      _resources = futures[2] as List<ResourceInventoryModel>;
      _incomingRequests = futures[3] as List<PatientRequestModel>;
      _transfers = futures[4] as List<TransferRequestModel>;

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }

  // Quick adjust live counters (+ / -)
  Future<void> adjustCounter(String type, int delta) async {
    BedCategoryModel? targetBed;
    if (type == 'gen') {
      targetBed = _beds.firstWhere(
        (b) => !b.isIcu && !b.category.toUpperCase().contains('ER'),
        orElse: () => _beds.isNotEmpty ? _beds.first : BedCategoryModel(id: 0, hospitalId: 0, category: 'General', totalBeds: 100, availableBeds: 20, occupiedBeds: 80),
      );
    } else if (type == 'icu') {
      targetBed = _beds.firstWhere(
        (b) => b.isIcu,
        orElse: () => _beds.isNotEmpty ? _beds.first : BedCategoryModel(id: 0, hospitalId: 0, category: 'ICU', totalBeds: 30, availableBeds: 4, occupiedBeds: 26),
      );
    } else if (type == 'er') {
      targetBed = _beds.firstWhere(
        (b) => b.category.toUpperCase().contains('ER') || b.category.toUpperCase().contains('EMERGENCY'),
        orElse: () => _beds.isNotEmpty ? _beds.first : BedCategoryModel(id: 0, hospitalId: 0, category: 'ER Trauma', totalBeds: 15, availableBeds: 2, occupiedBeds: 13),
      );
    }

    if (targetBed == null || targetBed.id == 0) return;

    final newAvailable = (targetBed.availableBeds + delta).clamp(0, targetBed.totalBeds);
    try {
      final updated = await _repo.updateBed(targetBed.id, availableBeds: newAvailable);
      final idx = _beds.indexWhere((b) => b.id == updated.id);
      if (idx != -1) {
        _beds[idx] = updated;
      }
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
    }
  }

  Future<bool> updateBedDetails(
    int bedId, {
    int? availableBeds,
    int? totalBeds,
    double? pricePerDay,
  }) async {
    try {
      final updated = await _repo.updateBed(
        bedId,
        availableBeds: availableBeds,
        totalBeds: totalBeds,
        pricePerDay: pricePerDay,
      );
      final idx = _beds.indexWhere((b) => b.id == updated.id);
      if (idx != -1) {
        _beds[idx] = updated;
      }
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> updateRequest(int requestId, String status, {String? bedCategory}) async {
    try {
      final updated = await _repo.updateRequestStatus(
        requestId,
        status: status,
        allocatedBedCategory: bedCategory,
      );
      final idx = _incomingRequests.indexWhere((r) => r.id == updated.id);
      if (idx != -1) {
        _incomingRequests[idx] = updated;
      }
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> addNewBed({
    required int hospitalId,
    required String category,
    required int totalBeds,
    required int availableBeds,
    double pricePerDay = 0.0,
  }) async {
    try {
      final newBed = await _repo.createBed(
        hospitalId: hospitalId,
        category: category,
        totalBeds: totalBeds,
        availableBeds: availableBeds,
        pricePerDay: pricePerDay,
      );
      _beds.add(newBed);
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> updateResourceStock(int resourceId, int quantity, String status) async {
    try {
      final updated = await _repo.updateResource(resourceId, quantityAvailable: quantity, status: status);
      final idx = _resources.indexWhere((r) => r.id == updated.id);
      if (idx != -1) {
        _resources[idx] = updated;
      }
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }
}

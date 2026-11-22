import 'package:flutter/material.dart';
import '../data/models/audit_log_model.dart';
import '../data/models/hospital_model.dart';
import '../data/models/platform_metrics_model.dart';
import '../data/repositories/admin_repository.dart';

class AdminProvider extends ChangeNotifier {
  final AdminRepository _repo;

  List<HospitalModel> _pendingApplications = [];
  List<HospitalModel> _allHospitals = [];
  PlatformMetricsModel _metrics = PlatformMetricsModel();
  List<AuditLogModel> _auditLogs = [];

  bool _isLoading = false;
  String? _errorMessage;

  AdminProvider(this._repo);

  List<HospitalModel> get pendingApplications => _pendingApplications;
  List<HospitalModel> get allHospitals => _allHospitals;
  PlatformMetricsModel get metrics => _metrics;
  List<AuditLogModel> get auditLogs => _auditLogs;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> loadAdminDashboard() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final futures = await Future.wait([
        _repo.getPendingApplications(),
        _repo.listAllHospitals(),
        _repo.getPlatformMetrics(),
        _repo.getAuditLogs(),
      ]);

      _pendingApplications = futures[0] as List<HospitalModel>;
      _allHospitals = futures[1] as List<HospitalModel>;
      _metrics = futures[2] as PlatformMetricsModel;
      _auditLogs = futures[3] as List<AuditLogModel>;

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> verifyApplication(
    int hospitalId, {
    required String action, // "APPROVE" or "REJECT"
    String? notes,
    String? rejectionReason,
  }) async {
    try {
      final updated = await _repo.verifyHospitalApplication(
        hospitalId,
        action: action,
        notes: notes,
        rejectionReason: rejectionReason,
      );

      _pendingApplications.removeWhere((h) => h.id == hospitalId);
      final idx = _allHospitals.indexWhere((h) => h.id == hospitalId);
      if (idx != -1) {
        _allHospitals[idx] = updated;
      } else {
        _allHospitals.insert(0, updated);
      }

      await loadAdminDashboard();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> toggleHospitalActive(int hospitalId) async {
    try {
      final updated = await _repo.toggleHospitalStatus(hospitalId);
      final idx = _allHospitals.indexWhere((h) => h.id == hospitalId);
      if (idx != -1) {
        _allHospitals[idx] = updated;
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

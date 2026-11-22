import '../models/audit_log_model.dart';
import '../models/hospital_model.dart';
import '../models/platform_metrics_model.dart';
import '../services/api_client.dart';

class AdminRepository {
  final ApiClient _api;

  AdminRepository(this._api);

  Future<List<HospitalModel>> getPendingApplications() async {
    final response = await _api.get(
      '/admin/applications',
      requiresAuth: true,
    );
    if (response is List) {
      return response.map((e) => HospitalModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  Future<HospitalModel> verifyHospitalApplication(
    int hospitalId, {
    required String action, // "APPROVE" or "REJECT"
    String? notes,
    String? rejectionReason,
  }) async {
    final response = await _api.post(
      '/admin/applications/$hospitalId/verify',
      body: {
        'action': action,
        'notes': notes,
        'rejection_reason': rejectionReason,
      },
      requiresAuth: true,
    );
    return HospitalModel.fromJson(response as Map<String, dynamic>);
  }

  Future<List<HospitalModel>> listAllHospitals({String? statusFilter}) async {
    final params = <String, String>{};
    if (statusFilter != null && statusFilter != 'ALL') {
      params['status_filter'] = statusFilter;
    }

    final response = await _api.get(
      '/admin/hospitals',
      queryParams: params,
      requiresAuth: true,
    );
    if (response is List) {
      return response.map((e) => HospitalModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  Future<HospitalModel> toggleHospitalStatus(int hospitalId) async {
    final response = await _api.patch(
      '/admin/hospitals/$hospitalId/toggle-status',
      requiresAuth: true,
    );
    return HospitalModel.fromJson(response as Map<String, dynamic>);
  }

  Future<PlatformMetricsModel> getPlatformMetrics() async {
    final response = await _api.get(
      '/admin/platform-metrics',
      requiresAuth: true,
    );
    return PlatformMetricsModel.fromJson(response as Map<String, dynamic>);
  }

  Future<List<AuditLogModel>> getAuditLogs({int limit = 50}) async {
    final response = await _api.get(
      '/admin/audit-logs',
      queryParams: {'limit': limit.toString()},
      requiresAuth: true,
    );
    if (response is List) {
      return response.map((e) => AuditLogModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }
}

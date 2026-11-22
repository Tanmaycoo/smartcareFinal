import '../models/patient_request_model.dart';
import '../services/api_client.dart';

class RequestRepository {
  final ApiClient _api;

  RequestRepository(this._api);

  Future<PatientRequestModel> createEmergencyRequest({
    required String patientName,
    required int patientAge,
    required String patientGender,
    required String contactPhone,
    required String emergencyType,
    String severity = 'URGENT',
    String? notes,
    required int requestedHospitalId,
    int etaMinutes = 20,
  }) async {
    final response = await _api.post(
      '/patient/requests',
      body: {
        'patient_name': patientName.trim(),
        'patient_age': patientAge,
        'patient_gender': patientGender,
        'contact_phone': contactPhone.trim(),
        'emergency_type': emergencyType,
        'severity': severity,
        'notes': notes?.trim(),
        'requested_hospital_id': requestedHospitalId,
        'eta_minutes': etaMinutes,
      },
      requiresAuth: false, // Patient emergency requests are open for fast dispatch
    );

    return PatientRequestModel.fromJson(response as Map<String, dynamic>);
  }

  Future<PatientRequestModel> trackTicket(String ticketCode) async {
    final code = ticketCode.trim().toUpperCase();
    final response = await _api.get('/patient/requests/track/$code');
    return PatientRequestModel.fromJson(response as Map<String, dynamic>);
  }
}

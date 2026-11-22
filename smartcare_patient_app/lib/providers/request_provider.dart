import 'package:flutter/material.dart';
import '../data/models/patient_request_model.dart';
import '../data/repositories/request_repository.dart';

class RequestProvider extends ChangeNotifier {
  final RequestRepository _repo;

  PatientRequestModel? _trackedTicket;
  PatientRequestModel? _lastCreatedTicket;

  bool _isSubmitting = false;
  bool _isTracking = false;
  String? _errorMessage;
  String? _successMessage;

  RequestProvider(this._repo);

  PatientRequestModel? get trackedTicket => _trackedTicket;
  PatientRequestModel? get lastCreatedTicket => _lastCreatedTicket;
  bool get isSubmitting => _isSubmitting;
  bool get isTracking => _isTracking;
  String? get errorMessage => _errorMessage;
  String? get successMessage => _successMessage;

  Future<PatientRequestModel?> submitEmergencyRequest({
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
    _isSubmitting = true;
    _errorMessage = null;
    _successMessage = null;
    notifyListeners();

    try {
      final ticket = await _repo.createEmergencyRequest(
        patientName: patientName,
        patientAge: patientAge,
        patientGender: patientGender,
        contactPhone: contactPhone,
        emergencyType: emergencyType,
        severity: severity,
        notes: notes,
        requestedHospitalId: requestedHospitalId,
        etaMinutes: etaMinutes,
      );

      _lastCreatedTicket = ticket;
      _trackedTicket = ticket;
      _successMessage = 'Emergency request dispatched! Ticket #${ticket.ticketCode}';
      _isSubmitting = false;
      notifyListeners();
      return ticket;
    } catch (e) {
      _errorMessage = e.toString();
      _isSubmitting = false;
      notifyListeners();
      return null;
    }
  }

  Future<bool> trackTicket(String ticketCode) async {
    _isTracking = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _trackedTicket = await _repo.trackTicket(ticketCode);
      _isTracking = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _isTracking = false;
      notifyListeners();
      return false;
    }
  }

  void clearTrackedTicket() {
    _trackedTicket = null;
    _errorMessage = null;
    _successMessage = null;
    notifyListeners();
  }
}

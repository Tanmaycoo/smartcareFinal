import 'dart:async';
import 'package:flutter/material.dart';
import '../data/models/patient_request_model.dart';
import '../data/repositories/request_repository.dart';
import '../data/services/storage_service.dart';

class RequestProvider extends ChangeNotifier {
  final RequestRepository _repo;
  final StorageService? _storage;

  PatientRequestModel? _trackedTicket;
  PatientRequestModel? _lastCreatedTicket;

  bool _isSubmitting = false;
  bool _isTracking = false;
  String? _errorMessage;
  String? _successMessage;

  Timer? _pollingTimer;

  RequestProvider(this._repo, [this._storage]) {
    final savedCode = _storage?.getLastTicketCode();
    if (savedCode != null && savedCode.isNotEmpty) {
      trackTicket(savedCode, silent: true);
    }
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }

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
      _storage?.saveLastTicketCode(ticket.ticketCode);
      _successMessage = 'Emergency request dispatched! Ticket #${ticket.ticketCode}';
      _isSubmitting = false;
      notifyListeners();

      // Start live real-time auto-polling every 3 seconds
      startLiveTracking(ticket.ticketCode);
      return ticket;
    } catch (e) {
      _errorMessage = e.toString();
      _isSubmitting = false;
      notifyListeners();
      return null;
    }
  }

  Future<bool> trackTicket(String ticketCode, {bool silent = false}) async {
    if (ticketCode.trim().isEmpty) return false;

    if (!silent) {
      _isTracking = true;
      _errorMessage = null;
      notifyListeners();
    }

    try {
      final updated = await _repo.trackTicket(ticketCode.trim());
      _trackedTicket = updated;
      _storage?.saveLastTicketCode(ticketCode.trim());
      _isTracking = false;
      notifyListeners();

      // Maintain active live polling
      startLiveTracking(ticketCode.trim());
      return true;
    } catch (e) {
      if (!silent) {
        _errorMessage = e.toString();
      }
      _isTracking = false;
      notifyListeners();
      return false;
    }
  }

  void startLiveTracking(String ticketCode) {
    _pollingTimer?.cancel();
    _pollingTimer = Timer.periodic(const Duration(seconds: 3), (_) async {
      if (_trackedTicket != null) {
        try {
          final updated = await _repo.trackTicket(ticketCode);
          if (_trackedTicket?.status != updated.status ||
              _trackedTicket?.allocatedBedCategory != updated.allocatedBedCategory ||
              _trackedTicket?.etaMinutes != updated.etaMinutes ||
              _trackedTicket?.notes != updated.notes) {
            _trackedTicket = updated;
            notifyListeners();
          }
        } catch (_) {}
      }
    });
  }

  void stopLiveTracking() {
    _pollingTimer?.cancel();
    _pollingTimer = null;
  }

  void clearTrackedTicket() {
    stopLiveTracking();
    _trackedTicket = null;
    _errorMessage = null;
    _successMessage = null;
    notifyListeners();
  }
}

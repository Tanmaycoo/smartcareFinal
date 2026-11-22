import 'package:flutter/foundation.dart';
import '../data/models/referral_model.dart';
import '../data/repositories/referral_repository.dart';

class ReferralProvider with ChangeNotifier {
  final ReferralRepository _referralRepository;

  ReferralProvider(this._referralRepository);

  List<Referral> _referrals = [];
  bool _isLoading = false;
  String? _error;

  List<Referral> get referrals => _referrals;
  bool get isLoading => _isLoading;
  String? get error => _error;

  List<Referral> get confirmedAppointments =>
      _referrals.where((r) => r.status == 'CONFIRMED' || r.bookingReference != null).toList();

  List<Referral> get pendingReferrals =>
      _referrals.where((r) => r.status == 'AWAITING_ACCEPTANCE' || r.status == 'ACCEPTED' || r.status == 'RESOURCE_RESERVED' || r.status == 'IN_TRANSIT').toList();

  List<Referral> get completedReferrals =>
      _referrals.where((r) => r.status == 'COMPLETED').toList();

  Future<void> fetchReferrals() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _referrals = await _referralRepository.fetchPatientReferrals();
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
      _referrals = [];
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}

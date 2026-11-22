import 'package:flutter/foundation.dart';
import '../data/models/patient_bill_model.dart';
import '../data/repositories/billing_repository.dart';

class BillingProvider extends ChangeNotifier {
  final BillingRepository _repository;

  BillingProvider(this._repository);

  bool _isLoading = false;
  String? _error;
  List<PatientBillModel> _bills = [];
  PatientBillModel? _selectedBill;

  bool get isLoading => _isLoading;
  String? get error => _error;
  List<PatientBillModel> get bills => _bills;
  PatientBillModel? get selectedBill => _selectedBill;

  Future<void> fetchBills({String? status}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _bills = await _repository.getPatientBills(status: status);
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<PatientBillModel?> fetchBillDetail(int billId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _selectedBill = await _repository.getPatientBillDetail(billId);
      return _selectedBill;
    } catch (e) {
      _error = e.toString();
      return null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void clearSelectedBill() {
    _selectedBill = null;
    notifyListeners();
  }
}

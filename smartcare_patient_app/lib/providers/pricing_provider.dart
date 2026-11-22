import 'package:flutter/foundation.dart';
import '../data/models/hospital_service_model.dart';
import '../data/models/cost_estimate_model.dart';
import '../data/repositories/pricing_repository.dart';

class PricingProvider extends ChangeNotifier {
  final PricingRepository _repository;

  PricingProvider(this._repository);

  bool _isLoading = false;
  String? _error;

  List<HospitalServicePriceModel> _searchResults = [];
  final Map<int, List<HospitalServicePriceModel>> _hospitalPricing = {};
  List<String> _categories = [];
  CostEstimateResponseModel? _currentEstimate;

  bool get isLoading => _isLoading;
  String? get error => _error;
  List<HospitalServicePriceModel> get searchResults => _searchResults;
  List<String> get categories => _categories;
  CostEstimateResponseModel? get currentEstimate => _currentEstimate;

  List<HospitalServicePriceModel> getPricingForHospital(int hospitalId) {
    return _hospitalPricing[hospitalId] ?? [];
  }

  Future<void> loadCategories() async {
    try {
      _categories = await _repository.getCategories();
      notifyListeners();
    } catch (e) {
      debugPrint('Failed to load pricing categories: $e');
    }
  }

  Future<void> loadHospitalPricing(int hospitalId, {String? category}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final items = await _repository.getHospitalPublishedPricing(
        hospitalId,
        category: category,
      );
      _hospitalPricing[hospitalId] = items;
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> searchServices({
    String? search,
    String? category,
    String? city,
    int? hospitalId,
    String? sortBy,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _searchResults = await _repository.searchServices(
        search: search,
        category: category,
        city: city,
        hospitalId: hospitalId,
        sortBy: sortBy,
      );
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<CostEstimateResponseModel?> calculateEstimate({
    required int hospitalId,
    required List<Map<String, dynamic>> items,
    double taxPercentage = 0,
    double discountPercentage = 0,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _currentEstimate = await _repository.calculateEstimate(
        hospitalId: hospitalId,
        items: items,
        taxPercentage: taxPercentage,
        discountPercentage: discountPercentage,
      );
      return _currentEstimate;
    } catch (e) {
      _error = e.toString();
      return null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void clearEstimate() {
    _currentEstimate = null;
    notifyListeners();
  }
}

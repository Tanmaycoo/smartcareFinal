import '../models/hospital_service_model.dart';
import '../models/cost_estimate_model.dart';
import '../services/api_client.dart';

class PricingRepository {
  final ApiClient _api;

  PricingRepository(this._api);

  Future<List<HospitalServicePriceModel>> getHospitalPublishedPricing(
    int hospitalId, {
    String? category,
  }) async {
    final params = <String, String>{};
    if (category != null && category.isNotEmpty && category != 'All') {
      params['category'] = category;
    }

    final response = await _api.get(
      '/pricing/hospitals/$hospitalId',
      queryParams: params,
    );

    if (response is List) {
      return response
          .map((item) =>
              HospitalServicePriceModel.fromJson(item as Map<String, dynamic>))
          .toList();
    }
    return [];
  }

  Future<List<HospitalServicePriceModel>> searchServices({
    String? search,
    String? category,
    String? city,
    int? hospitalId,
    String? sortBy,
  }) async {
    final params = <String, String>{};
    if (search != null && search.trim().isNotEmpty) {
      params['search'] = search.trim();
    }
    if (category != null && category.isNotEmpty && category != 'All') {
      params['category'] = category;
    }
    if (city != null && city.isNotEmpty && city != 'All') {
      params['city'] = city;
    }
    if (hospitalId != null && hospitalId > 0) {
      params['hospital_id'] = hospitalId.toString();
    }
    if (sortBy != null && sortBy.isNotEmpty) {
      params['sort_by'] = sortBy;
    }

    final response = await _api.get('/pricing/services', queryParams: params);

    if (response is List) {
      return response
          .map((item) =>
              HospitalServicePriceModel.fromJson(item as Map<String, dynamic>))
          .toList();
    }
    return [];
  }

  Future<List<String>> getCategories() async {
    final response = await _api.get('/pricing/categories');
    if (response is List) {
      return response.map((e) => e.toString()).toList();
    }
    return [
      'Room and Bed Charges',
      'Emergency Services',
      'Ambulance Services',
      'Laboratory Services',
      'Diagnostic Services',
      'Other Services',
    ];
  }

  Future<CostEstimateResponseModel> calculateEstimate({
    required int hospitalId,
    required List<Map<String, dynamic>> items,
    double taxPercentage = 0,
    double discountPercentage = 0,
  }) async {
    final body = {
      'hospital_id': hospitalId,
      'items': items,
      'tax_percentage': taxPercentage,
      'discount_percentage': discountPercentage,
    };

    final response = await _api.post('/pricing/estimate', body: body);
    return CostEstimateResponseModel.fromJson(response as Map<String, dynamic>);
  }
}

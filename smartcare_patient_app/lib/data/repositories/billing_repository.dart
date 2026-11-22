import '../models/patient_bill_model.dart';
import '../services/api_client.dart';

class BillingRepository {
  final ApiClient _api;

  BillingRepository(this._api);

  Future<List<PatientBillModel>> getPatientBills({String? status, String? query}) async {
    final params = <String, String>{};
    if (status != null && status.isNotEmpty && status != 'All') {
      params['status'] = status;
    }
    if (query != null && query.trim().isNotEmpty) {
      params['query'] = query.trim();
    }

    final endpoint = (query != null && query.trim().isNotEmpty)
        ? '/billing/patient/bills/lookup'
        : '/billing/patient/bills';

    final response = await _api.get(
      endpoint,
      queryParams: params,
      requiresAuth: false,
    );

    if (response is List) {
      return response
          .map((item) => PatientBillModel.fromJson(item as Map<String, dynamic>))
          .toList();
    }
    return [];
  }

  Future<PatientBillModel> getPatientBillDetail(int billId) async {
    final response = await _api.get(
      '/billing/patient/bills/$billId',
      requiresAuth: false,
    );
    return PatientBillModel.fromJson(response as Map<String, dynamic>);
  }
}

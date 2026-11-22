import '../models/patient_bill_model.dart';
import '../services/api_client.dart';

class BillingRepository {
  final ApiClient _api;

  BillingRepository(this._api);

  Future<List<PatientBillModel>> getPatientBills({String? status}) async {
    final params = <String, String>{};
    if (status != null && status.isNotEmpty && status != 'All') {
      params['status'] = status;
    }

    final response = await _api.get(
      '/billing/patient/bills',
      queryParams: params,
      requiresAuth: true,
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
      requiresAuth: true,
    );
    return PatientBillModel.fromJson(response as Map<String, dynamic>);
  }
}

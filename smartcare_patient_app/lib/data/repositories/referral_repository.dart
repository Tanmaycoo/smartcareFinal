import '../models/referral_model.dart';
import '../services/api_client.dart';

class ReferralRepository {
  final ApiClient _apiClient;

  ReferralRepository(this._apiClient);

  Future<List<Referral>> fetchPatientReferrals() async {
    final response = await _apiClient.get(
      '/referrals/patient/my-referrals',
      requiresAuth: true,
    );

    if (response is List) {
      return response.map((json) => Referral.fromJson(json as Map<String, dynamic>)).toList();
    }
    return [];
  }

  Future<Referral> fetchReferralDetail(int referralId) async {
    final response = await _apiClient.get(
      '/referrals/$referralId',
      requiresAuth: true,
    );
    return Referral.fromJson(response as Map<String, dynamic>);
  }
}

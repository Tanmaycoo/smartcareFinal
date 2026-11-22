import '../models/blood_bank_model.dart';
import '../models/blood_donor_model.dart';
import '../services/api_client.dart';

class BloodRepository {
  final ApiClient _apiClient;

  BloodRepository(this._apiClient);

  Future<List<BloodBank>> fetchNearbyBloodBanks({
    double? lat,
    double? lng,
    String? bloodGroup,
    double? radiusKm,
  }) async {
    final params = <String, String>{};
    if (lat != null) params['lat'] = lat.toString();
    if (lng != null) params['lng'] = lng.toString();
    if (bloodGroup != null && bloodGroup.isNotEmpty && bloodGroup != 'All') {
      params['blood_group'] = bloodGroup;
    }
    if (radiusKm != null) params['radius_km'] = radiusKm.toString();

    final response = await _apiClient.get(
      '/blood-bank/nearby',
      queryParams: params,
      requiresAuth: false,
    );

    if (response is List) {
      return response.map((json) => BloodBank.fromJson(json as Map<String, dynamic>)).toList();
    }
    return [];
  }

  Future<BloodBank> fetchBloodBankDetail(int id) async {
    final response = await _apiClient.get(
      '/blood-bank/$id',
      requiresAuth: false,
    );
    return BloodBank.fromJson(response as Map<String, dynamic>);
  }

  Future<List<BloodDonor>> fetchNearbyDonors({
    required double lat,
    required double lng,
    String? bloodGroup,
    double? radiusKm,
    bool emergencyOnly = true,
  }) async {
    final params = <String, String>{
      'lat': lat.toString(),
      'lng': lng.toString(),
      'emergency_only': emergencyOnly.toString(),
    };
    if (bloodGroup != null && bloodGroup.isNotEmpty && bloodGroup != 'All') {
      params['blood_group'] = bloodGroup;
    }
    if (radiusKm != null) params['radius_km'] = radiusKm.toString();

    final response = await _apiClient.get(
      '/blood-bank/donors/nearby',
      queryParams: params,
      requiresAuth: false,
    );

    if (response is List) {
      return response.map((json) => BloodDonor.fromJson(json as Map<String, dynamic>)).toList();
    }
    return [];
  }

  Future<BloodDonor> registerDonor({
    required String donorName,
    required String bloodGroup,
    required String contactPhone,
    required String city,
    String? address,
    required double latitude,
    required double longitude,
    bool isAvailable = true,
  }) async {
    final body = {
      'name': donorName,
      'phone': contactPhone,
      'blood_group': bloodGroup,
      'city': city,
      'state': 'Maharashtra',
      if (address != null && address.isNotEmpty) 'address': address,
      'latitude': latitude,
      'longitude': longitude,
      'is_available': isAvailable,
    };

    final response = await _apiClient.post(
      '/blood-bank/donors/register',
      body: body,
      requiresAuth: false,
    );

    return BloodDonor.fromJson(response as Map<String, dynamic>);
  }

  Future<Map<String, dynamic>> createEmergencyBloodRequest({
    required int hospitalId,
    int? bloodBankId,
    required String patientName,
    required String bloodGroup,
    String component = 'Whole Blood',
    int unitsRequired = 1,
    String urgencyLevel = 'CRITICAL',
    required String contactPhone,
    String? notes,
  }) async {
    final body = {
      'hospital_id': hospitalId,
      if (bloodBankId != null) 'blood_bank_id': bloodBankId,
      'patient_name': patientName,
      'blood_group': bloodGroup,
      'component': component,
      'units_required': unitsRequired,
      'urgency_level': urgencyLevel,
      'contact_phone': contactPhone,
      if (notes != null && notes.isNotEmpty) 'notes': notes,
    };

    final response = await _apiClient.post(
      '/blood-bank/requests',
      body: body,
      requiresAuth: false,
    );

    return response as Map<String, dynamic>;
  }
}

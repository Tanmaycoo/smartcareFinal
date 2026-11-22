import '../models/hospital_model.dart';
import '../services/api_client.dart';

class HospitalRepository {
  final ApiClient _api;

  HospitalRepository(this._api);

  Future<List<HospitalModel>> getHospitals({
    String? q,
    String? city,
    String? bedType,
    double? lat,
    double? lng,
    double? radiusKm,
  }) async {
    final params = <String, String>{};
    if (q != null && q.trim().isNotEmpty) params['q'] = q.trim();
    if (city != null && city.isNotEmpty && city != 'All') params['city'] = city;
    if (bedType != null && bedType.isNotEmpty && bedType != 'All') params['bed_type'] = bedType;
    if (lat != null) params['lat'] = lat.toString();
    if (lng != null) params['lng'] = lng.toString();
    if (radiusKm != null) params['radius_km'] = radiusKm.toString();

    final response = await _api.get('/hospitals', queryParams: params);

    if (response is List) {
      return response
          .map((item) => HospitalModel.fromJson(item as Map<String, dynamic>))
          .toList();
    }
    return [];
  }

  Future<HospitalModel> getHospitalDetail(int hospitalId) async {
    final response = await _api.get('/hospitals/$hospitalId');
    return HospitalModel.fromJson(response as Map<String, dynamic>);
  }
}

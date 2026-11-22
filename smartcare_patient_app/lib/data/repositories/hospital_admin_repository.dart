import '../models/bed_model.dart';
import '../models/hospital_model.dart';
import '../models/patient_request_model.dart';
import '../models/resource_model.dart';
import '../models/transfer_model.dart';
import '../services/api_client.dart';

class HospitalAdminRepository {
  final ApiClient _api;

  HospitalAdminRepository(this._api);

  // Beds Management
  Future<List<BedCategoryModel>> getHospitalBeds(int hospitalId) async {
    final response = await _api.get(
      '/hospital/beds',
      queryParams: {'hospital_id': hospitalId.toString()},
      requiresAuth: true,
    );
    if (response is List) {
      return response.map((e) => BedCategoryModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  Future<BedCategoryModel> updateBed(
    int bedId, {
    int? availableBeds,
    int? totalBeds,
    int? occupiedBeds,
    double? pricePerDay,
  }) async {
    final body = <String, dynamic>{};
    if (availableBeds != null) body['available_beds'] = availableBeds;
    if (totalBeds != null) body['total_beds'] = totalBeds;
    if (occupiedBeds != null) body['occupied_beds'] = occupiedBeds;
    if (pricePerDay != null) body['price_per_day'] = pricePerDay;

    final response = await _api.patch(
      '/hospital/beds/$bedId',
      body: body,
      requiresAuth: true,
    );
    return BedCategoryModel.fromJson(response as Map<String, dynamic>);
  }

  Future<BedCategoryModel> createBed({
    required int hospitalId,
    required String category,
    required int totalBeds,
    required int availableBeds,
    double pricePerDay = 0.0,
  }) async {
    final response = await _api.post(
      '/hospital/beds',
      body: {
        'hospital_id': hospitalId,
        'category': category,
        'total_beds': totalBeds,
        'available_beds': availableBeds,
        'price_per_day': pricePerDay,
      },
      requiresAuth: true,
    );
    return BedCategoryModel.fromJson(response as Map<String, dynamic>);
  }

  // Resources Management
  Future<List<ResourceInventoryModel>> getHospitalResources(int hospitalId) async {
    final response = await _api.get(
      '/hospital/resources',
      queryParams: {'hospital_id': hospitalId.toString()},
      requiresAuth: true,
    );
    if (response is List) {
      return response.map((e) => ResourceInventoryModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  Future<ResourceInventoryModel> updateResource(
    int resourceId, {
    required int quantityAvailable,
    String? status,
  }) async {
    final body = <String, dynamic>{
      'quantity_available': quantityAvailable,
    };
    if (status != null) body['status'] = status;

    final response = await _api.patch(
      '/hospital/resources/$resourceId',
      body: body,
      requiresAuth: true,
    );
    return ResourceInventoryModel.fromJson(response as Map<String, dynamic>);
  }

  // Emergency Patient Requests
  Future<List<PatientRequestModel>> getHospitalRequests(int hospitalId, {String? statusFilter}) async {
    final params = {'hospital_id': hospitalId.toString()};
    if (statusFilter != null && statusFilter != 'ALL') {
      params['status_filter'] = statusFilter;
    }
    final response = await _api.get(
      '/hospital/requests',
      queryParams: params,
      requiresAuth: true,
    );
    if (response is List) {
      return response.map((e) => PatientRequestModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  Future<PatientRequestModel> updateRequestStatus(
    int requestId, {
    required String status,
    String? allocatedBedCategory,
    String? notes,
  }) async {
    final body = <String, dynamic>{'status': status};
    if (allocatedBedCategory != null) body['allocated_bed_category'] = allocatedBedCategory;
    if (notes != null) body['notes'] = notes;

    final response = await _api.patch(
      '/hospital/requests/$requestId',
      body: body,
      requiresAuth: true,
    );
    return PatientRequestModel.fromJson(response as Map<String, dynamic>);
  }

  // Transfers
  Future<List<TransferRequestModel>> getTransfers(int hospitalId, {String direction = 'ALL'}) async {
    final response = await _api.get(
      '/hospital/transfers',
      queryParams: {
        'hospital_id': hospitalId.toString(),
        'direction': direction,
      },
      requiresAuth: true,
    );
    if (response is List) {
      return response.map((e) => TransferRequestModel.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  Future<HospitalModel> getHospitalDetails(int hospitalId) async {
    final response = await _api.get('/hospitals/$hospitalId');
    return HospitalModel.fromJson(response as Map<String, dynamic>);
  }
}

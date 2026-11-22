import 'bed_model.dart';
import 'resource_model.dart';

class HospitalModel {
  final int id;
  final String name;
  final String licenseNumber;
  final String type;
  final String address;
  final String city;
  final String state;
  final String pincode;
  final double latitude;
  final double longitude;
  final String emergencyPhone;
  final String? receptionPhone;
  final String email;
  final String? website;
  final String verificationStatus;
  final int totalCapacity;
  final int ambulanceCount;
  final int availableAmbulances;
  final bool isActive;
  final double? distanceKm;
  final int totalAvailableBeds;
  final int icuAvailable;
  final List<BedCategoryModel> beds;
  final List<ResourceInventoryModel> resources;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  HospitalModel({
    required this.id,
    required this.name,
    required this.licenseNumber,
    required this.type,
    required this.address,
    required this.city,
    required this.state,
    required this.pincode,
    required this.latitude,
    required this.longitude,
    required this.emergencyPhone,
    this.receptionPhone,
    required this.email,
    this.website,
    required this.verificationStatus,
    this.totalCapacity = 100,
    this.ambulanceCount = 2,
    this.availableAmbulances = 1,
    this.isActive = true,
    this.distanceKm,
    this.totalAvailableBeds = 0,
    this.icuAvailable = 0,
    this.beds = const [],
    this.resources = const [],
    this.createdAt,
    this.updatedAt,
  });

  factory HospitalModel.fromJson(Map<String, dynamic> json) {
    List<BedCategoryModel> parsedBeds = [];
    if (json['beds'] is List) {
      parsedBeds = (json['beds'] as List)
          .map((b) => BedCategoryModel.fromJson(b as Map<String, dynamic>))
          .toList();
    }

    List<ResourceInventoryModel> parsedResources = [];
    if (json['resources'] is List) {
      parsedResources = (json['resources'] as List)
          .map((r) => ResourceInventoryModel.fromJson(r as Map<String, dynamic>))
          .toList();
    }

    return HospitalModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      name: json['name'] as String? ?? 'Hospital',
      licenseNumber: json['license_number'] as String? ?? '',
      type: json['type'] as String? ?? 'General Hospital',
      address: json['address'] as String? ?? '',
      city: json['city'] as String? ?? '',
      state: json['state'] as String? ?? '',
      pincode: json['pincode'] as String? ?? '',
      latitude: json['latitude'] is num
          ? (json['latitude'] as num).toDouble()
          : double.tryParse(json['latitude'].toString()) ?? 0.0,
      longitude: json['longitude'] is num
          ? (json['longitude'] as num).toDouble()
          : double.tryParse(json['longitude'].toString()) ?? 0.0,
      emergencyPhone: json['emergency_phone'] as String? ?? '',
      receptionPhone: json['reception_phone'] as String?,
      email: json['email'] as String? ?? '',
      website: json['website'] as String?,
      verificationStatus: json['verification_status'] as String? ?? 'APPROVED',
      totalCapacity: json['total_capacity'] is int
          ? json['total_capacity']
          : int.tryParse(json['total_capacity'].toString()) ?? 100,
      ambulanceCount: json['ambulance_count'] is int
          ? json['ambulance_count']
          : int.tryParse(json['ambulance_count'].toString()) ?? 2,
      availableAmbulances: json['available_ambulances'] is int
          ? json['available_ambulances']
          : int.tryParse(json['available_ambulances'].toString()) ?? 1,
      isActive: json['is_active'] as bool? ?? true,
      distanceKm: json['distance_km'] is num
          ? (json['distance_km'] as num).toDouble()
          : (json['distance_km'] != null
              ? double.tryParse(json['distance_km'].toString())
              : null),
      totalAvailableBeds: json['total_available_beds'] is int
          ? json['total_available_beds']
          : int.tryParse(json['total_available_beds'].toString()) ?? 0,
      icuAvailable: json['icu_available'] is int
          ? json['icu_available']
          : int.tryParse(json['icu_available'].toString()) ?? 0,
      beds: parsedBeds,
      resources: parsedResources,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'].toString())
          : null,
      updatedAt: json['updated_at'] != null
          ? DateTime.tryParse(json['updated_at'].toString())
          : null,
    );
  }

  bool get isVerified => verificationStatus == 'APPROVED';

  String get distanceFormatted {
    if (distanceKm == null) return 'Distance unavailable';
    final dist = distanceKm!.toStringAsFixed(1);
    final driveMinutes = (distanceKm! * 3.2).clamp(3, 120).round();
    return '$dist km ($driveMinutes min drive)';
  }

  String get erWaitEstimate {
    if (icuAvailable > 10) return '~10m';
    if (icuAvailable > 3) return '~15m';
    if (icuAvailable > 0) return '~25m';
    return '~35m';
  }

  List<String> get capabilityTags {
    final tags = <String>['Emergency 24/7'];
    if (type.isNotEmpty) tags.add(type);
    if (icuAvailable > 0) tags.add('ICU Beds ($icuAvailable)');
    if (availableAmbulances > 0) tags.add('$availableAmbulances Ambulances');
    return tags;
  }
}

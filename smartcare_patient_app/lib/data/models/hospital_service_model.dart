class HospitalServicePriceModel {
  final int serviceId;
  final String serviceName;
  final String category;
  final String? description;
  final String billingUnit;
  final double price;
  final int hospitalId;
  final String hospitalName;
  final String hospitalCity;
  final String? hospitalAddress;
  final String? hospitalPhone;
  final String? hospitalVerificationStatus;
  final DateTime? effectiveFrom;
  final DateTime? effectiveUntil;
  final DateTime? lastUpdated;

  HospitalServicePriceModel({
    required this.serviceId,
    required this.serviceName,
    required this.category,
    this.description,
    required this.billingUnit,
    required this.price,
    required this.hospitalId,
    required this.hospitalName,
    required this.hospitalCity,
    this.hospitalAddress,
    this.hospitalPhone,
    this.hospitalVerificationStatus,
    this.effectiveFrom,
    this.effectiveUntil,
    this.lastUpdated,
  });

  factory HospitalServicePriceModel.fromJson(Map<String, dynamic> json) {
    return HospitalServicePriceModel(
      serviceId: json['service_id'] is int
          ? json['service_id']
          : int.tryParse(json['service_id'].toString()) ?? 0,
      serviceName: json['service_name'] as String? ?? 'Service',
      category: json['category'] as String? ?? 'Other Services',
      description: json['description'] as String?,
      billingUnit: json['billing_unit'] as String? ?? 'per day',
      price: json['price'] is num
          ? (json['price'] as num).toDouble()
          : double.tryParse(json['price'].toString()) ?? 0.0,
      hospitalId: json['hospital_id'] is int
          ? json['hospital_id']
          : int.tryParse(json['hospital_id'].toString()) ?? 0,
      hospitalName: json['hospital_name'] as String? ?? '',
      hospitalCity: json['hospital_city'] as String? ?? '',
      hospitalAddress: json['hospital_address'] as String?,
      hospitalPhone: json['hospital_phone'] as String?,
      hospitalVerificationStatus:
          json['hospital_verification_status'] as String?,
      effectiveFrom: json['effective_from'] != null
          ? DateTime.tryParse(json['effective_from'].toString())
          : null,
      effectiveUntil: json['effective_until'] != null
          ? DateTime.tryParse(json['effective_until'].toString())
          : null,
      lastUpdated: json['last_updated'] != null
          ? DateTime.tryParse(json['last_updated'].toString())
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'service_id': serviceId,
      'service_name': serviceName,
      'category': category,
      'description': description,
      'billing_unit': billingUnit,
      'price': price,
      'hospital_id': hospitalId,
      'hospital_name': hospitalName,
      'hospital_city': hospitalCity,
      'hospital_address': hospitalAddress,
      'hospital_phone': hospitalPhone,
      'hospital_verification_status': hospitalVerificationStatus,
      'effective_from': effectiveFrom?.toIso8601String(),
      'effective_until': effectiveUntil?.toIso8601String(),
      'last_updated': lastUpdated?.toIso8601String(),
    };
  }
}

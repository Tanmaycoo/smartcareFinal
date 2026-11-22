class BedCategoryModel {
  final int id;
  final int hospitalId;
  final String category;
  final int totalBeds;
  final int availableBeds;
  final int occupiedBeds;
  final double pricePerDay;
  final DateTime? lastUpdated;

  BedCategoryModel({
    required this.id,
    required this.hospitalId,
    required this.category,
    required this.totalBeds,
    required this.availableBeds,
    required this.occupiedBeds,
    this.pricePerDay = 0.0,
    this.lastUpdated,
  });

  factory BedCategoryModel.fromJson(Map<String, dynamic> json) {
    return BedCategoryModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      hospitalId: json['hospital_id'] is int
          ? json['hospital_id']
          : int.tryParse(json['hospital_id'].toString()) ?? 0,
      category: json['category'] as String? ?? 'General',
      totalBeds: json['total_beds'] is int
          ? json['total_beds']
          : int.tryParse(json['total_beds'].toString()) ?? 0,
      availableBeds: json['available_beds'] is int
          ? json['available_beds']
          : int.tryParse(json['available_beds'].toString()) ?? 0,
      occupiedBeds: json['occupied_beds'] is int
          ? json['occupied_beds']
          : int.tryParse(json['occupied_beds'].toString()) ?? 0,
      pricePerDay: json['price_per_day'] is num
          ? (json['price_per_day'] as num).toDouble()
          : double.tryParse(json['price_per_day'].toString()) ?? 0.0,
      lastUpdated: json['last_updated'] != null
          ? DateTime.tryParse(json['last_updated'].toString())
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'hospital_id': hospitalId,
      'category': category,
      'total_beds': totalBeds,
      'available_beds': availableBeds,
      'occupied_beds': occupiedBeds,
      'price_per_day': pricePerDay,
      'last_updated': lastUpdated?.toIso8601String(),
    };
  }

  double get occupancyRatio {
    if (totalBeds <= 0) return 0.0;
    return (totalBeds - availableBeds) / totalBeds;
  }

  int get occupancyPercentage => (occupancyRatio * 100).round();

  bool get isIcu => category.toUpperCase().contains('ICU');
}

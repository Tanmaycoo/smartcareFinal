class ResourceInventoryModel {
  final int id;
  final int hospitalId;
  final String resourceName;
  final String category;
  final int quantityAvailable;
  final String unit;
  final String status;
  final DateTime? lastUpdated;

  ResourceInventoryModel({
    required this.id,
    required this.hospitalId,
    required this.resourceName,
    required this.category,
    required this.quantityAvailable,
    required this.unit,
    required this.status,
    this.lastUpdated,
  });

  factory ResourceInventoryModel.fromJson(Map<String, dynamic> json) {
    return ResourceInventoryModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      hospitalId: json['hospital_id'] is int
          ? json['hospital_id']
          : int.tryParse(json['hospital_id'].toString()) ?? 0,
      resourceName: json['resource_name'] as String? ?? 'Resource',
      category: json['category'] as String? ?? 'General',
      quantityAvailable: json['quantity_available'] is int
          ? json['quantity_available']
          : int.tryParse(json['quantity_available'].toString()) ?? 0,
      unit: json['unit'] as String? ?? 'units',
      status: json['status'] as String? ?? 'ADEQUATE',
      lastUpdated: json['last_updated'] != null
          ? DateTime.tryParse(json['last_updated'].toString())
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'hospital_id': hospitalId,
      'resource_name': resourceName,
      'category': category,
      'quantity_available': quantityAvailable,
      'unit': unit,
      'status': status,
      'last_updated': lastUpdated?.toIso8601String(),
    };
  }
}

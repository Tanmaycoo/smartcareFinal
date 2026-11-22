class BloodInventoryItem {
  final int id;
  final String bloodGroup;
  final String component;
  final int unitsAvailable;
  final String? lastUpdated;

  BloodInventoryItem({
    required this.id,
    required this.bloodGroup,
    required this.component,
    required this.unitsAvailable,
    this.lastUpdated,
  });

  factory BloodInventoryItem.fromJson(Map<String, dynamic> json) {
    return BloodInventoryItem(
      id: json['id'] as int? ?? 0,
      bloodGroup: json['blood_group'] as String? ?? '',
      component: json['component'] as String? ?? 'Whole Blood',
      unitsAvailable: json['units_available'] as int? ?? 0,
      lastUpdated: json['last_updated']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'blood_group': bloodGroup,
      'component': component,
      'units_available': unitsAvailable,
      'last_updated': lastUpdated,
    };
  }
}

class BloodBank {
  final int id;
  final String name;
  final String licenseNumber;
  final String type;
  final String address;
  final String city;
  final String state;
  final String pincode;
  final String contactPhone;
  final String? emergencyPhone;
  final String? contactEmail;
  final double latitude;
  final double longitude;
  final bool isActive;
  final bool isVerified;
  final int totalUnits;
  final double? distanceKm;
  final List<BloodInventoryItem> inventory;

  BloodBank({
    required this.id,
    required this.name,
    required this.licenseNumber,
    this.type = 'Red Cross / Blood Center',
    required this.address,
    required this.city,
    required this.state,
    this.pincode = '',
    required this.contactPhone,
    this.emergencyPhone,
    this.contactEmail,
    required this.latitude,
    required this.longitude,
    required this.isActive,
    required this.isVerified,
    this.totalUnits = 0,
    this.distanceKm,
    this.inventory = const [],
  });

  factory BloodBank.fromJson(Map<String, dynamic> json) {
    var rawInv = json['inventory'];
    List<BloodInventoryItem> invList = [];
    if (rawInv is List) {
      invList = rawInv.map((i) => BloodInventoryItem.fromJson(i as Map<String, dynamic>)).toList();
    }

    final verificationStatus = (json['verification_status'] as String? ?? '').toUpperCase();
    final isVer = verificationStatus == 'APPROVED' || (json['is_verified'] as bool? ?? false);

    return BloodBank(
      id: json['id'] as int? ?? 0,
      name: json['name'] as String? ?? 'Blood Bank',
      licenseNumber: json['license_number'] as String? ?? '',
      type: json['type'] as String? ?? 'Blood Bank',
      address: json['address'] as String? ?? '',
      city: json['city'] as String? ?? '',
      state: json['state'] as String? ?? '',
      pincode: json['pincode']?.toString() ?? '',
      contactPhone: (json['phone'] ?? json['contact_phone'] ?? '').toString(),
      emergencyPhone: (json['emergency_phone'] ?? json['phone'])?.toString(),
      contactEmail: (json['email'] ?? json['contact_email'])?.toString(),
      latitude: (json['latitude'] as num?)?.toDouble() ?? 0.0,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 0.0,
      isActive: json['is_active'] as bool? ?? true,
      isVerified: isVer,
      totalUnits: json['total_units'] as int? ?? 0,
      distanceKm: (json['distance_km'] as num?)?.toDouble(),
      inventory: invList,
    );
  }

  int getStockForGroup(String group) {
    if (inventory.isNotEmpty) {
      return inventory
          .where((item) => item.bloodGroup.trim().toUpperCase() == group.trim().toUpperCase())
          .fold(0, (sum, item) => sum + item.unitsAvailable);
    }
    // Fallback if inventory list not expanded
    return totalUnits > 0 ? (totalUnits ~/ 8) : 0;
  }
}

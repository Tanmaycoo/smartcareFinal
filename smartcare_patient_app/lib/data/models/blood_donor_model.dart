class BloodDonor {
  final int id;
  final int? userId;
  final String donorName;
  final String bloodGroup;
  final String contactPhone;
  final String? email;
  final int? age;
  final String? gender;
  final String city;
  final String state;
  final String? address;
  final double latitude;
  final double longitude;
  final bool isAvailableForEmergency;
  final String? lastDonationDate;
  final double? distanceKm;

  BloodDonor({
    required this.id,
    this.userId,
    required this.donorName,
    required this.bloodGroup,
    required this.contactPhone,
    this.email,
    this.age,
    this.gender,
    required this.city,
    this.state = 'Maharashtra',
    this.address,
    required this.latitude,
    required this.longitude,
    required this.isAvailableForEmergency,
    this.lastDonationDate,
    this.distanceKm,
  });

  factory BloodDonor.fromJson(Map<String, dynamic> json) {
    return BloodDonor(
      id: json['id'] as int? ?? 0,
      userId: json['user_id'] as int?,
      donorName: (json['name'] ?? json['donor_name'] ?? 'Voluntary Donor').toString(),
      bloodGroup: json['blood_group'] as String? ?? 'O+',
      contactPhone: (json['phone'] ?? json['contact_phone'] ?? '').toString(),
      email: json['email']?.toString(),
      age: json['age'] as int?,
      gender: json['gender']?.toString(),
      city: json['city'] as String? ?? 'Solapur',
      state: json['state'] as String? ?? 'Maharashtra',
      address: json['address']?.toString(),
      latitude: (json['latitude'] as num?)?.toDouble() ?? 0.0,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 0.0,
      isAvailableForEmergency: (json['is_available'] ?? json['is_available_for_emergency'] ?? true) as bool,
      lastDonationDate: json['last_donation_date']?.toString(),
      distanceKm: (json['distance_km'] as num?)?.toDouble(),
    );
  }
}

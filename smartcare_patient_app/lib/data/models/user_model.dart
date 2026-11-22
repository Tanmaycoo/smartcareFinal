class UserModel {
  final int id;
  final String name;
  final String email;
  final String role;
  final String? phone;
  final int? hospitalId;
  final String? hospitalName;
  final String? verificationStatus;
  final bool isActive;
  final DateTime? createdAt;

  UserModel({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.phone,
    this.hospitalId,
    this.hospitalName,
    this.verificationStatus,
    this.isActive = true,
    this.createdAt,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      name: json['name'] as String? ?? 'Patient',
      email: json['email'] as String? ?? '',
      role: json['role'] as String? ?? 'PATIENT',
      phone: json['phone'] as String?,
      hospitalId: json['hospital_id'] != null ? int.tryParse(json['hospital_id'].toString()) : null,
      hospitalName: json['hospital_name'] as String?,
      verificationStatus: json['verification_status'] as String?,
      isActive: json['is_active'] as bool? ?? true,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'].toString())
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'role': role,
      'phone': phone,
      'hospital_id': hospitalId,
      'hospital_name': hospitalName,
      'verification_status': verificationStatus,
      'is_active': isActive,
      'created_at': createdAt?.toIso8601String(),
    };
  }
}

class AuthSession {
  final String accessToken;
  final String tokenType;
  final UserModel user;

  AuthSession({
    required this.accessToken,
    this.tokenType = 'bearer',
    required this.user,
  });

  factory AuthSession.fromLoginResponse(Map<String, dynamic> json) {
    return AuthSession(
      accessToken: json['access_token'] as String? ?? '',
      tokenType: json['token_type'] as String? ?? 'bearer',
      user: UserModel(
        id: json['user_id'] is int ? json['user_id'] : int.tryParse(json['user_id'].toString()) ?? 0,
        name: json['name'] as String? ?? 'Patient',
        email: json['email'] as String? ?? '',
        role: json['role'] as String? ?? 'PATIENT',
        hospitalId: json['hospital_id'] != null ? int.tryParse(json['hospital_id'].toString()) : null,
        hospitalName: json['hospital_name'] as String?,
        verificationStatus: json['verification_status'] as String?,
      ),
    );
  }
}

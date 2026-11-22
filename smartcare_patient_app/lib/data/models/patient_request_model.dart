class PatientRequestModel {
  final int id;
  final String ticketCode;
  final String patientName;
  final int patientAge;
  final String patientGender;
  final String contactPhone;
  final String emergencyType;
  final String severity;
  final String? notes;
  final int requestedHospitalId;
  final String? hospitalName;
  final String? allocatedBedCategory;
  final String status;
  final int etaMinutes;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  PatientRequestModel({
    required this.id,
    required this.ticketCode,
    required this.patientName,
    required this.patientAge,
    required this.patientGender,
    required this.contactPhone,
    required this.emergencyType,
    required this.severity,
    this.notes,
    required this.requestedHospitalId,
    this.hospitalName,
    this.allocatedBedCategory,
    required this.status,
    this.etaMinutes = 20,
    this.createdAt,
    this.updatedAt,
  });

  factory PatientRequestModel.fromJson(Map<String, dynamic> json) {
    return PatientRequestModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      ticketCode: json['ticket_code'] as String? ?? '',
      patientName: json['patient_name'] as String? ?? '',
      patientAge: json['patient_age'] is int
          ? json['patient_age']
          : int.tryParse(json['patient_age'].toString()) ?? 0,
      patientGender: json['patient_gender'] as String? ?? 'Other',
      contactPhone: json['contact_phone'] as String? ?? '',
      emergencyType: json['emergency_type'] as String? ?? 'General Emergency',
      severity: json['severity'] as String? ?? 'URGENT',
      notes: json['notes'] as String?,
      requestedHospitalId: json['requested_hospital_id'] is int
          ? json['requested_hospital_id']
          : int.tryParse(json['requested_hospital_id'].toString()) ?? 0,
      hospitalName: json['hospital_name'] as String?,
      allocatedBedCategory: json['allocated_bed_category'] as String?,
      status: json['status'] as String? ?? 'PENDING',
      etaMinutes: json['eta_minutes'] is int
          ? json['eta_minutes']
          : int.tryParse(json['eta_minutes'].toString()) ?? 20,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'].toString())
          : null,
      updatedAt: json['updated_at'] != null
          ? DateTime.tryParse(json['updated_at'].toString())
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'ticket_code': ticketCode,
      'patient_name': patientName,
      'patient_age': patientAge,
      'patient_gender': patientGender,
      'contact_phone': contactPhone,
      'emergency_type': emergencyType,
      'severity': severity,
      'notes': notes,
      'requested_hospital_id': requestedHospitalId,
      'hospital_name': hospitalName,
      'allocated_bed_category': allocatedBedCategory,
      'status': status,
      'eta_minutes': etaMinutes,
      'created_at': createdAt?.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }

  bool get isApproved => status == 'ACCEPTED' || status == 'ALLOCATED';
  bool get isPending => status == 'PENDING';
  bool get isRejected => status == 'REJECTED';
}

class ReferralTimelineEvent {
  final int id;
  final int referralId;
  final String action;
  final String? fromStatus;
  final String toStatus;
  final String performedBy;
  final String actorRole;
  final String? notes;
  final String createdAt;

  ReferralTimelineEvent({
    required this.id,
    required this.referralId,
    required this.action,
    this.fromStatus,
    required this.toStatus,
    required this.performedBy,
    required this.actorRole,
    this.notes,
    required this.createdAt,
  });

  factory ReferralTimelineEvent.fromJson(Map<String, dynamic> json) {
    return ReferralTimelineEvent(
      id: json['id'] as int? ?? 0,
      referralId: json['referral_id'] as int? ?? 0,
      action: json['action'] as String? ?? '',
      fromStatus: json['from_status'] as String?,
      toStatus: json['to_status'] as String? ?? '',
      performedBy: json['performed_by'] as String? ?? 'Clinician',
      actorRole: json['actor_role'] as String? ?? 'HOSPITAL',
      notes: json['notes'] as String?,
      createdAt: json['created_at']?.toString() ?? '',
    );
  }
}

class Referral {
  final int id;
  final String referralCode;
  final int referringHospitalId;
  final String referringHospitalName;
  final int? receivingHospitalId;
  final String? receivingHospitalName;
  final String? receivingHospitalCity;
  final String? receivingHospitalPhone;
  final String patientName;
  final String patientPhone;
  final int? patientAge;
  final String? patientGender;
  final String? patientReferenceId;
  final String requestType;
  final String serviceCategory;
  final String serviceName;
  final String clinicalUrgency;
  final String? preferredDate;
  final String? preferredTimeSlot;
  final int quantity;
  final String? clinicalSummary;
  final String? specialInstructions;
  final String status;
  final String? bookingReference;
  final String? confirmedDate;
  final String? confirmedTimeSlot;
  final String? preparationInstructions;
  final double? quotedPrice;
  final String? billingUnit;
  final String? declineReason;
  final String? alternativeDetails;
  final String? referringDoctorName;
  final String? referringContactPhone;
  final String? receivingContactName;
  final String? receivingContactPhone;
  final String? dispatchedAt;
  final String? arrivedAt;
  final String? completedAt;
  final String createdAt;
  final List<ReferralTimelineEvent> timeline;

  Referral({
    required this.id,
    required this.referralCode,
    required this.referringHospitalId,
    this.referringHospitalName = 'Referring Hospital',
    this.receivingHospitalId,
    this.receivingHospitalName,
    this.receivingHospitalCity,
    this.receivingHospitalPhone,
    required this.patientName,
    required this.patientPhone,
    this.patientAge,
    this.patientGender,
    this.patientReferenceId,
    required this.requestType,
    required this.serviceCategory,
    required this.serviceName,
    this.clinicalUrgency = 'ROUTINE',
    this.preferredDate,
    this.preferredTimeSlot,
    this.quantity = 1,
    this.clinicalSummary,
    this.specialInstructions,
    required this.status,
    this.bookingReference,
    this.confirmedDate,
    this.confirmedTimeSlot,
    this.preparationInstructions,
    this.quotedPrice,
    this.billingUnit,
    this.declineReason,
    this.alternativeDetails,
    this.referringDoctorName,
    this.referringContactPhone,
    this.receivingContactName,
    this.receivingContactPhone,
    this.dispatchedAt,
    this.arrivedAt,
    this.completedAt,
    required this.createdAt,
    this.timeline = const [],
  });

  factory Referral.fromJson(Map<String, dynamic> json) {
    var rawTimeline = json['timeline'];
    List<ReferralTimelineEvent> events = [];
    if (rawTimeline is List) {
      events = rawTimeline.map((e) => ReferralTimelineEvent.fromJson(e as Map<String, dynamic>)).toList();
    }

    return Referral(
      id: json['id'] as int? ?? 0,
      referralCode: json['referral_code'] as String? ?? '',
      referringHospitalId: json['referring_hospital_id'] as int? ?? 0,
      referringHospitalName: json['referring_hospital_name'] as String? ?? 'Referring Facility',
      receivingHospitalId: json['receiving_hospital_id'] as int?,
      receivingHospitalName: json['receiving_hospital_name'] as String?,
      receivingHospitalCity: json['receiving_hospital_city'] as String?,
      receivingHospitalPhone: json['receiving_hospital_phone'] as String?,
      patientName: json['patient_name'] as String? ?? '',
      patientPhone: json['patient_phone'] as String? ?? '',
      patientAge: json['patient_age'] as int?,
      patientGender: json['patient_gender'] as String?,
      patientReferenceId: json['patient_reference_id'] as String?,
      requestType: json['request_type'] as String? ?? 'DIAGNOSTIC',
      serviceCategory: json['service_category'] as String? ?? 'Diagnostic Services',
      serviceName: json['service_name'] as String? ?? '',
      clinicalUrgency: json['clinical_urgency'] as String? ?? 'ROUTINE',
      preferredDate: json['preferred_date']?.toString(),
      preferredTimeSlot: json['preferred_time_slot'] as String?,
      quantity: json['quantity'] as int? ?? 1,
      clinicalSummary: json['clinical_summary'] as String?,
      specialInstructions: json['special_instructions'] as String?,
      status: json['status'] as String? ?? 'AWAITING_ACCEPTANCE',
      bookingReference: json['booking_reference'] as String?,
      confirmedDate: json['confirmed_date']?.toString(),
      confirmedTimeSlot: json['confirmed_time_slot'] as String?,
      preparationInstructions: json['preparation_instructions'] as String?,
      quotedPrice: (json['quoted_price'] as num?)?.toDouble(),
      billingUnit: json['billing_unit'] as String?,
      declineReason: json['decline_reason'] as String?,
      alternativeDetails: json['alternative_details'] as String?,
      referringDoctorName: json['referring_doctor_name'] as String?,
      referringContactPhone: json['referring_contact_phone'] as String?,
      receivingContactName: json['receiving_contact_name'] as String?,
      receivingContactPhone: json['receiving_contact_phone'] as String?,
      dispatchedAt: json['dispatched_at']?.toString(),
      arrivedAt: json['arrived_at']?.toString(),
      completedAt: json['completed_at']?.toString(),
      createdAt: json['created_at']?.toString() ?? '',
      timeline: events,
    );
  }
}

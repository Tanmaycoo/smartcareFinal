class AuditLogModel {
  final int id;
  final String actorEmail;
  final String actorRole;
  final String action;
  final String entityType;
  final String? entityId;
  final String? details;
  final DateTime? timestamp;

  AuditLogModel({
    required this.id,
    required this.actorEmail,
    required this.actorRole,
    required this.action,
    required this.entityType,
    this.entityId,
    this.details,
    this.timestamp,
  });

  factory AuditLogModel.fromJson(Map<String, dynamic> json) {
    return AuditLogModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      actorEmail: json['actor_email'] as String? ?? 'system',
      actorRole: json['actor_role'] as String? ?? 'SYSTEM',
      action: json['action'] as String? ?? 'ACTION',
      entityType: json['entity_type'] as String? ?? 'SYSTEM',
      entityId: json['entity_id']?.toString(),
      details: json['details'] as String?,
      timestamp: json['timestamp'] != null ? DateTime.tryParse(json['timestamp'].toString()) : null,
    );
  }
}

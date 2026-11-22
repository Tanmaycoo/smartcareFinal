import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

enum StatusBadgeType { verified, live, available, limited, emergency, neutral }

class StatusBadge extends StatelessWidget {
  final String label;
  final StatusBadgeType type;
  final IconData? icon;

  const StatusBadge({
    super.key,
    required this.label,
    this.type = StatusBadgeType.verified,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color textColor;
    IconData? defaultIcon;

    switch (type) {
      case StatusBadgeType.verified:
        bg = AppTheme.tertiaryFixed.withValues(alpha: 0.35);
        textColor = AppTheme.onTertiaryFixedVariant;
        defaultIcon = Icons.verified;
        break;
      case StatusBadgeType.live:
        bg = AppTheme.tertiaryFixed;
        textColor = AppTheme.onTertiaryFixed;
        break;
      case StatusBadgeType.available:
        bg = AppTheme.statusAvailableBg;
        textColor = AppTheme.statusAvailableText;
        break;
      case StatusBadgeType.limited:
        bg = AppTheme.statusLimitedBg;
        textColor = AppTheme.statusLimitedText;
        break;
      case StatusBadgeType.emergency:
        bg = AppTheme.statusEmergencyBg;
        textColor = AppTheme.statusEmergencyText;
        defaultIcon = Icons.emergency;
        break;
      case StatusBadgeType.neutral:
        bg = AppTheme.surfaceContainerLow;
        textColor = AppTheme.onSurfaceVariant;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(9999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null || defaultIcon != null) ...[
            Icon(
              icon ?? defaultIcon,
              size: 13,
              color: textColor,
            ),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: textColor,
              height: 1.2,
            ),
          ),
        ],
      ),
    );
  }
}

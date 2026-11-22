import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../providers/hospital_provider.dart';

class FilterBottomSheet extends StatefulWidget {
  const FilterBottomSheet({super.key});

  static Future<void> show(BuildContext context) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => const FilterBottomSheet(),
    );
  }

  @override
  State<FilterBottomSheet> createState() => _FilterBottomSheetState();
}

class _FilterBottomSheetState extends State<FilterBottomSheet> {
  late double? _tempRadius;
  late String _tempCategory;

  @override
  void initState() {
    super.initState();
    final provider = context.read<HospitalProvider>();
    _tempRadius = provider.selectedRadiusKm;
    _tempCategory = provider.selectedCategory;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppTheme.surfaceContainerLowest,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.only(
        top: 16,
        left: 20,
        right: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: AppTheme.outlineVariant,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Filter Hospitals',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.onSurface,
                ),
              ),
              TextButton(
                onPressed: () {
                  setState(() {
                    _tempRadius = null;
                    _tempCategory = 'All';
                  });
                },
                child: const Text('Reset', style: TextStyle(color: AppTheme.primary)),
              ),
            ],
          ),
          const Divider(height: 24),
          const Text(
            'SEARCH RADIUS',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: AppTheme.onSurfaceVariant,
              letterSpacing: 0.8,
            ),
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _buildRadiusChip(5.0, '< 5 km'),
              _buildRadiusChip(10.0, '10 km'),
              _buildRadiusChip(25.0, '25 km'),
              _buildRadiusChip(50.0, '50 km'),
              _buildRadiusChip(null, 'Any distance'),
            ],
          ),
          const SizedBox(height: 20),
          const Text(
            'RESOURCE REQUIREMENT',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: AppTheme.onSurfaceVariant,
              letterSpacing: 0.8,
            ),
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _buildCategoryChip('All', 'All Facilities'),
              _buildCategoryChip('ICU Beds', 'ICU Beds Available'),
              _buildCategoryChip('Emergency 24/7', 'Emergency 24/7'),
              _buildCategoryChip('Pediatric Care', 'Pediatric Care'),
              _buildCategoryChip('Oxygen Supply', 'Oxygen Ready'),
            ],
          ),
          const SizedBox(height: 28),
          ElevatedButton(
            onPressed: () {
              final provider = context.read<HospitalProvider>();
              provider.setRadius(_tempRadius);
              provider.setCategoryFilter(_tempCategory);
              Navigator.pop(context);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primary,
              foregroundColor: Colors.white,
              minimumSize: const Size(double.infinity, 48),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text(
              'Apply Filters',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRadiusChip(double? value, String label) {
    final isSelected = _tempRadius == value;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (_) => setState(() => _tempRadius = value),
      selectedColor: AppTheme.primaryFixed,
      backgroundColor: AppTheme.surfaceContainerLow,
      labelStyle: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w600,
        color: isSelected ? AppTheme.primary : AppTheme.onSurfaceVariant,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(9999),
        side: BorderSide(
          color: isSelected ? AppTheme.primary : Colors.transparent,
          width: 1,
        ),
      ),
    );
  }

  Widget _buildCategoryChip(String value, String label) {
    final isSelected = _tempCategory == value;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (_) => setState(() => _tempCategory = value),
      selectedColor: AppTheme.primaryFixed,
      backgroundColor: AppTheme.surfaceContainerLow,
      labelStyle: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w600,
        color: isSelected ? AppTheme.primary : AppTheme.onSurfaceVariant,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(9999),
        side: BorderSide(
          color: isSelected ? AppTheme.primary : Colors.transparent,
          width: 1,
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../data/models/cost_estimate_model.dart';
import '../../../data/models/hospital_service_model.dart';
import '../../../providers/hospital_provider.dart';
import '../../../providers/pricing_provider.dart';
import '../../widgets/clinical_header.dart';

class CostEstimationScreen extends StatefulWidget {
  final int? preselectedHospitalId;

  const CostEstimationScreen({super.key, this.preselectedHospitalId});

  @override
  State<CostEstimationScreen> createState() => _CostEstimationScreenState();
}

class _CostEstimationScreenState extends State<CostEstimationScreen> {
  int? _selectedHospitalId;
  final Map<int, double> _selectedQuantities = {};
  CostEstimateResponseModel? _estimateResult;
  bool _isCalculating = false;

  @override
  void initState() {
    super.initState();
    _selectedHospitalId = widget.preselectedHospitalId;

    WidgetsBinding.instance.addPostFrameCallback((_) {
      final hospProv = context.read<HospitalProvider>();
      if (hospProv.hospitals.isEmpty) {
        hospProv.fetchHospitals();
      }

      if (_selectedHospitalId != null) {
        _loadServicesForHospital(_selectedHospitalId!);
      }
    });
  }

  void _loadServicesForHospital(int hospitalId) {
    setState(() {
      _selectedHospitalId = hospitalId;
      _selectedQuantities.clear();
      _estimateResult = null;
    });
    context.read<PricingProvider>().loadHospitalPricing(hospitalId);
  }

  void _toggleService(HospitalServicePriceModel service) {
    setState(() {
      if (_selectedQuantities.containsKey(service.serviceId)) {
        _selectedQuantities.remove(service.serviceId);
      } else {
        _selectedQuantities[service.serviceId] = 1.0;
      }
    });
  }

  void _updateQuantity(int serviceId, double qty) {
    if (qty <= 0) {
      setState(() => _selectedQuantities.remove(serviceId));
    } else {
      setState(() => _selectedQuantities[serviceId] = qty);
    }
  }

  Future<void> _calculateEstimate() async {
    if (_selectedHospitalId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a hospital first.')),
      );
      return;
    }

    if (_selectedQuantities.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select at least one service to estimate.')),
      );
      return;
    }

    setState(() => _isCalculating = true);

    final items = _selectedQuantities.entries.map((e) {
      return {
        'service_id': e.key,
        'quantity': e.value,
      };
    }).toList();

    try {
      final res = await context.read<PricingProvider>().calculateEstimate(
            hospitalId: _selectedHospitalId!,
            items: items,
          );
      setState(() {
        _estimateResult = res;
      });
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error calculating estimate: $e')),
      );
    } finally {
      setState(() => _isCalculating = false);
    }
  }

  String _formatINR(double amount) {
    return '₹${amount.toStringAsFixed(amount.truncateToDouble() == amount ? 0 : 2)}';
  }

  String _getQuantityLabel(String billingUnit) {
    final u = billingUnit.toLowerCase();
    if (u.contains('day')) return 'Days';
    if (u.contains('visit')) return 'Visits';
    if (u.contains('trip')) return 'Trips';
    if (u.contains('test')) return 'Tests';
    if (u.contains('scan')) return 'Scans';
    if (u.contains('hour')) return 'Hours';
    return 'Qty';
  }

  @override
  Widget build(BuildContext context) {
    final hospProv = context.watch<HospitalProvider>();
    final pricingProv = context.watch<PricingProvider>();
    final hospitals = hospProv.hospitals;

    final services = _selectedHospitalId != null
        ? pricingProv.getPricingForHospital(_selectedHospitalId!)
        : <HospitalServicePriceModel>[];

    final isServiceLoading = pricingProv.isLoading;

    return Scaffold(
      backgroundColor: AppTheme.surface,
      body: SafeArea(
        child: Column(
          children: [
            ClinicalHeader(
              title: 'Estimate Hospital Cost',
              showBackButton: true,
              onBack: () => Navigator.of(context).pop(),
            ),

            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Step 1: Hospital Selector
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppTheme.surfaceContainerLowest,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: AppTheme.cardShadow,
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Row(
                            children: [
                              Icon(Icons.local_hospital, color: AppTheme.primary, size: 20),
                              SizedBox(width: 8),
                              Text(
                                'Select Facility',
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w700,
                                  color: AppTheme.onSurface,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            decoration: BoxDecoration(
                              color: AppTheme.surfaceContainerLow,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: AppTheme.outlineVariant.withValues(alpha: 0.5)),
                            ),
                            child: DropdownButtonHideUnderline(
                              child: DropdownButton<int>(
                                isExpanded: true,
                                value: _selectedHospitalId,
                                hint: const Text('Choose a verified hospital...', style: TextStyle(fontSize: 13)),
                                items: hospitals.map((h) {
                                  return DropdownMenuItem<int>(
                                    value: h.id,
                                    child: Text(
                                      '${h.name} (${h.city})',
                                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  );
                                }).toList(),
                                onChanged: (val) {
                                  if (val != null) {
                                    _loadServicesForHospital(val);
                                  }
                                },
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Step 2: Select Services from Published Catalogue
                    if (_selectedHospitalId != null) ...[
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Select Services & Units',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.onSurface,
                            ),
                          ),
                          Text(
                            '${_selectedQuantities.length} selected',
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.primary,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),

                      if (isServiceLoading)
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 24),
                          child: Center(child: CircularProgressIndicator(color: AppTheme.primary)),
                        )
                      else if (services.isEmpty)
                        Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: AppTheme.surfaceContainerLowest,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: const Center(
                            child: Text(
                              'This hospital has not published public rates yet.',
                              style: TextStyle(fontSize: 13, color: AppTheme.onSurfaceVariant),
                            ),
                          ),
                        )
                      else
                        ListView.separated(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: services.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 8),
                          itemBuilder: (context, index) {
                            final s = services[index];
                            final isSelected = _selectedQuantities.containsKey(s.serviceId);
                            final currentQty = _selectedQuantities[s.serviceId] ?? 1.0;

                            return Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: isSelected
                                    ? AppTheme.primaryFixed.withValues(alpha: 0.15)
                                    : AppTheme.surfaceContainerLowest,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: isSelected
                                      ? AppTheme.primary
                                      : AppTheme.outlineVariant.withValues(alpha: 0.3),
                                  width: isSelected ? 1.5 : 1,
                                ),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Checkbox(
                                        value: isSelected,
                                        activeColor: AppTheme.primary,
                                        onChanged: (_) => _toggleService(s),
                                      ),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              s.serviceName,
                                              style: const TextStyle(
                                                fontSize: 14,
                                                fontWeight: FontWeight.w700,
                                                color: AppTheme.onSurface,
                                              ),
                                            ),
                                            Text(
                                              '${s.category} • ${_formatINR(s.price)} ${s.billingUnit}',
                                              style: const TextStyle(
                                                fontSize: 11,
                                                color: AppTheme.onSurfaceVariant,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),

                                  if (isSelected) ...[
                                    const SizedBox(height: 8),
                                    Padding(
                                      padding: const EdgeInsets.only(left: 48, right: 8),
                                      child: Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text(
                                            _getQuantityLabel(s.billingUnit),
                                            style: const TextStyle(
                                              fontSize: 12,
                                              fontWeight: FontWeight.bold,
                                              color: AppTheme.onSurface,
                                            ),
                                          ),
                                          Row(
                                            children: [
                                              IconButton(
                                                icon: const Icon(Icons.remove_circle_outline, size: 20),
                                                color: AppTheme.primary,
                                                onPressed: () => _updateQuantity(s.serviceId, currentQty - 1),
                                              ),
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                                                decoration: BoxDecoration(
                                                  color: AppTheme.surfaceContainerHigh,
                                                  borderRadius: BorderRadius.circular(6),
                                                ),
                                                child: Text(
                                                  '${currentQty.toInt()}',
                                                  style: const TextStyle(
                                                    fontSize: 14,
                                                    fontWeight: FontWeight.bold,
                                                  ),
                                                ),
                                              ),
                                              IconButton(
                                                icon: const Icon(Icons.add_circle_outline, size: 20),
                                                color: AppTheme.primary,
                                                onPressed: () => _updateQuantity(s.serviceId, currentQty + 1),
                                              ),
                                            ],
                                          ),
                                          Text(
                                            _formatINR(s.price * currentQty),
                                            style: const TextStyle(
                                              fontSize: 14,
                                              fontWeight: FontWeight.w800,
                                              color: AppTheme.primary,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            );
                          },
                        ),

                      const SizedBox(height: 20),

                      // Calculate Button
                      ElevatedButton.icon(
                        onPressed: _selectedQuantities.isEmpty || _isCalculating
                            ? null
                            : _calculateEstimate,
                        icon: _isCalculating
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                              )
                            : const Icon(Icons.calculate, color: Colors.white, size: 20),
                        label: Text(
                          _isCalculating ? 'Calculating...' : 'Calculate Itemized Estimate',
                          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primary,
                          foregroundColor: Colors.white,
                          minimumSize: const Size(double.infinity, 50),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                    ],

                    // Step 3: Breakdown Results
                    if (_estimateResult != null) ...[
                      const SizedBox(height: 24),
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: AppTheme.surfaceContainerLowest,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: AppTheme.cardShadow,
                          border: Border.all(color: AppTheme.primary.withValues(alpha: 0.4)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text(
                                  'Estimated Breakdown',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w700,
                                    color: AppTheme.onSurface,
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: AppTheme.tertiaryFixed,
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: const Text(
                                    'ESTIMATE ONLY',
                                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.tertiary),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),

                            ..._estimateResult!.items.map((it) => Padding(
                                  padding: const EdgeInsets.symmetric(vertical: 4),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Expanded(
                                        child: Text(
                                          '${it.serviceName} (${it.quantity.toInt()} ${it.billingUnit})',
                                          style: const TextStyle(fontSize: 13, color: AppTheme.onSurfaceVariant),
                                        ),
                                      ),
                                      Text(
                                        _formatINR(it.itemTotal),
                                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                                      ),
                                    ],
                                  ),
                                )),

                            const Divider(height: 24, color: AppTheme.outlineVariant),

                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text(
                                  'Estimated Total (INR)',
                                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppTheme.onSurface),
                                ),
                                Text(
                                  _formatINR(_estimateResult!.estimatedTotal),
                                  style: const TextStyle(
                                    fontSize: 22,
                                    fontWeight: FontWeight.w900,
                                    color: AppTheme.primary,
                                  ),
                                ),
                              ],
                            ),

                            const SizedBox(height: 14),

                            // Mandatory Disclaimer
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: AppTheme.surfaceContainerLow,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Text(
                                _estimateResult!.disclaimer,
                                style: const TextStyle(
                                  fontSize: 11,
                                  color: AppTheme.onSurfaceVariant,
                                  height: 1.3,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

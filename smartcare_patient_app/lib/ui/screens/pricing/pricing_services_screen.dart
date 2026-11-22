import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../data/models/hospital_service_model.dart';
import '../../../providers/pricing_provider.dart';
import '../../widgets/clinical_header.dart';
import '../../widgets/empty_error_view.dart';
import '../details/hospital_details_screen.dart';
import 'cost_estimation_screen.dart';

class PricingServicesScreen extends StatefulWidget {
  final int? preselectedHospitalId;

  const PricingServicesScreen({super.key, this.preselectedHospitalId});

  @override
  State<PricingServicesScreen> createState() => _PricingServicesScreenState();
}

class _PricingServicesScreenState extends State<PricingServicesScreen> {
  final TextEditingController _searchCtrl = TextEditingController();
  String _selectedCategory = 'All';
  String _selectedSort = 'price_asc';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final prov = context.read<PricingProvider>();
      prov.loadCategories();
      _executeSearch();
    });
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  void _executeSearch() {
    context.read<PricingProvider>().searchServices(
          search: _searchCtrl.text,
          category: _selectedCategory != 'All' ? _selectedCategory : null,
          hospitalId: widget.preselectedHospitalId,
          sortBy: _selectedSort,
        );
  }

  String _formatINR(double amount) {
    return '₹${amount.toStringAsFixed(amount.truncateToDouble() == amount ? 0 : 2)}';
  }

  @override
  Widget build(BuildContext context) {
    final pricingProvider = context.watch<PricingProvider>();
    final services = pricingProvider.searchResults;
    final isLoading = pricingProvider.isLoading;
    final categories = ['All', ...pricingProvider.categories];

    return Scaffold(
      backgroundColor: AppTheme.surface,
      body: SafeArea(
        child: Column(
          children: [
            ClinicalHeader(
              title: 'Hospital Pricing & Services',
              showBackButton: true,
              onBack: () => Navigator.of(context).pop(),
            ),

            // Top Search & Sort Filter
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
              child: Column(
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Container(
                          decoration: BoxDecoration(
                            color: AppTheme.surfaceContainerLowest,
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: AppTheme.cardShadow,
                          ),
                          child: TextField(
                            controller: _searchCtrl,
                            onSubmitted: (_) => _executeSearch(),
                            style: const TextStyle(fontSize: 13, color: AppTheme.onSurface),
                            decoration: InputDecoration(
                              hintText: 'Search service, test, ICU, bed...',
                              hintStyle: const TextStyle(fontSize: 13, color: AppTheme.onSurfaceVariant),
                              prefixIcon: const Icon(Icons.search, size: 20, color: AppTheme.primary),
                              suffixIcon: _searchCtrl.text.isNotEmpty
                                  ? IconButton(
                                      icon: const Icon(Icons.clear, size: 18),
                                      onPressed: () {
                                        _searchCtrl.clear();
                                        _executeSearch();
                                      },
                                    )
                                  : null,
                              border: InputBorder.none,
                              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      // Sort selector
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10),
                        decoration: BoxDecoration(
                          color: AppTheme.surfaceContainerLowest,
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: AppTheme.cardShadow,
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: _selectedSort,
                            icon: const Icon(Icons.sort, size: 18, color: AppTheme.primary),
                            items: const [
                              DropdownMenuItem(value: 'price_asc', child: Text('Price: Low', style: TextStyle(fontSize: 12))),
                              DropdownMenuItem(value: 'price_desc', child: Text('Price: High', style: TextStyle(fontSize: 12))),
                              DropdownMenuItem(value: 'name_asc', child: Text('Name A-Z', style: TextStyle(fontSize: 12))),
                            ],
                            onChanged: (val) {
                              if (val != null) {
                                setState(() => _selectedSort = val);
                                _executeSearch();
                              }
                            },
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 10),

                  // Category Filter Chips
                  SizedBox(
                    height: 36,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: categories.length,
                      separatorBuilder: (_, __) => const SizedBox(width: 8),
                      itemBuilder: (context, index) {
                        final cat = categories[index];
                        final isSelected = _selectedCategory == cat;

                        return ChoiceChip(
                          label: Text(
                            cat,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                              color: isSelected ? Colors.white : AppTheme.onSurfaceVariant,
                            ),
                          ),
                          selected: isSelected,
                          selectedColor: AppTheme.primary,
                          backgroundColor: AppTheme.surfaceContainerLow,
                          onSelected: (selected) {
                            if (selected) {
                              setState(() => _selectedCategory = cat);
                              _executeSearch();
                            }
                          },
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),

            // Official Disclaimer Notice Banner
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: AppTheme.surfaceContainerLow,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppTheme.outlineVariant.withValues(alpha: 0.5)),
              ),
              child: const Row(
                children: [
                  Icon(Icons.info_outline, size: 16, color: AppTheme.primary),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Rates are published by hospitals for informational purposes. Final charges depend on procedures & stay.',
                      style: TextStyle(fontSize: 11, color: AppTheme.onSurfaceVariant, height: 1.2),
                    ),
                  ),
                ],
              ),
            ),

            // Content Area
            Expanded(
              child: isLoading
                  ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
                  : pricingProvider.error != null
                      ? EmptyErrorView(
                          title: 'Could Not Load Rates',
                          description: pricingProvider.error!,
                          buttonText: 'Retry Search',
                          onRetry: _executeSearch,
                        )
                      : services.isEmpty
                          ? EmptyErrorView(
                              title: 'No Published Services Found',
                              description: 'Try adjusting your search query or selecting a different category.',
                              buttonText: 'Reset Filters',
                              onRetry: () {
                                _searchCtrl.clear();
                                setState(() => _selectedCategory = 'All');
                                _executeSearch();
                              },
                            )
                          : ListView.separated(
                              padding: const EdgeInsets.all(16),
                              itemCount: services.length,
                              separatorBuilder: (_, __) => const SizedBox(height: 12),
                              itemBuilder: (context, index) {
                                final s = services[index];
                                return _buildServicePriceCard(context, s);
                              },
                            ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: AppTheme.surfaceContainerLowest,
          boxShadow: AppTheme.elevatedShadow,
        ),
        child: ElevatedButton.icon(
          onPressed: () {
            Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => CostEstimationScreen(
                  preselectedHospitalId: widget.preselectedHospitalId,
                ),
              ),
            );
          },
          icon: const Icon(Icons.calculate_outlined, color: Colors.white, size: 20),
          label: const Text(
            'Estimate My Hospital Cost',
            style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
          ),
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTheme.primary,
            foregroundColor: Colors.white,
            minimumSize: const Size(double.infinity, 48),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
      ),
    );
  }

  Widget _buildServicePriceCard(BuildContext context, HospitalServicePriceModel service) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(16),
        boxShadow: AppTheme.cardShadow,
        border: Border.all(color: AppTheme.outlineVariant.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      service.serviceName,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.onSurface,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppTheme.surfaceContainerHigh,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        service.category,
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.onSurfaceVariant,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    _formatINR(service.price),
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.primary,
                    ),
                  ),
                  Text(
                    service.billingUnit,
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                      color: AppTheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ],
          ),

          if (service.description != null && service.description!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              service.description!,
              style: const TextStyle(
                fontSize: 12,
                color: AppTheme.onSurfaceVariant,
                height: 1.3,
              ),
            ),
          ],

          const Divider(height: 20, color: AppTheme.outlineVariant),

          // Hospital Name & Actions
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              InkWell(
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => HospitalDetailsScreen(hospitalId: service.hospitalId),
                    ),
                  );
                },
                child: Row(
                  children: [
                    const Icon(Icons.local_hospital_outlined, size: 16, color: AppTheme.primary),
                    const SizedBox(width: 6),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          service.hospitalName,
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.primary,
                          ),
                        ),
                        Text(
                          service.hospitalCity,
                          style: const TextStyle(fontSize: 10, color: AppTheme.onSurfaceVariant),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              ElevatedButton(
                onPressed: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => CostEstimationScreen(
                        preselectedHospitalId: service.hospitalId,
                      ),
                    ),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.surfaceContainerHigh,
                  foregroundColor: AppTheme.primary,
                  elevation: 0,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                child: const Text('Add to Estimate', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

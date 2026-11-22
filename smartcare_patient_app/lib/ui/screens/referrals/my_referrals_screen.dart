import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/theme/app_theme.dart';
import '../../../data/models/referral_model.dart';
import '../../../providers/referral_provider.dart';
import '../../widgets/empty_error_view.dart';

class MyReferralsScreen extends StatefulWidget {
  const MyReferralsScreen({super.key});

  @override
  State<MyReferralsScreen> createState() => _MyReferralsScreenState();
}

class _MyReferralsScreenState extends State<MyReferralsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);

    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ReferralProvider>().fetchReferrals();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _makeCall(String phoneNumber) async {
    final cleanPhone = phoneNumber.replaceAll(RegExp(r'[^\d+]'), '');
    final uri = Uri.parse('tel:$cleanPhone');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  Widget _buildStatusBadge(String status) {
    Color bg = AppTheme.surfaceContainerLow;
    Color fg = AppTheme.onSurfaceVariant;
    IconData icon = Icons.info_outline;

    switch (status) {
      case 'CONFIRMED':
        bg = const Color(0xFFECFDF5);
        fg = const Color(0xFF047857);
        icon = Icons.check_circle_outline;
        break;
      case 'AWAITING_ACCEPTANCE':
        bg = const Color(0xFFFFFBEB);
        fg = const Color(0xFFB45309);
        icon = Icons.hourglass_empty;
        break;
      case 'RESOURCE_RESERVED':
      case 'ACCEPTED':
        bg = const Color(0xFFEFF6FF);
        fg = const Color(0xFF1D4ED8);
        icon = Icons.event_available;
        break;
      case 'IN_TRANSIT':
        bg = const Color(0xFFFFF7ED);
        fg = const Color(0xFFC2410C);
        icon = Icons.local_shipping_outlined;
        break;
      case 'COMPLETED':
        bg = AppTheme.surfaceContainerLow;
        fg = AppTheme.onSurface;
        icon = Icons.task_alt;
        break;
      case 'DECLINED':
      case 'CANCELLED':
        bg = const Color(0xFFFEF2F2);
        fg = const Color(0xFFB91C1C);
        icon = Icons.cancel_outlined;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: fg),
          const SizedBox(width: 4),
          Text(
            status.replaceAll('_', ' '),
            style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: fg),
          ),
        ],
      ),
    );
  }

  Widget _buildReferralCard(Referral referral) {
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
          // Header with Code & Status
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    referral.referralCode,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.primary,
                      letterSpacing: 0.5,
                    ),
                  ),
                  if (referral.bookingReference != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      'Booking: ${referral.bookingReference}',
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF047857),
                      ),
                    ),
                  ],
                ],
              ),
              _buildStatusBadge(referral.status),
            ],
          ),

          const SizedBox(height: 12),

          // Service and Category
          Text(
            referral.serviceName,
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: AppTheme.onSurface,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            referral.serviceCategory,
            style: const TextStyle(fontSize: 12, color: AppTheme.onSurfaceVariant),
          ),

          const SizedBox(height: 12),

          // Receiving Facility Details
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppTheme.surfaceContainerLow,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.business_outlined, size: 14, color: AppTheme.primary),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        referral.receivingHospitalName ?? 'Designated Hospital Pool',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.onSurface,
                        ),
                      ),
                    ),
                  ],
                ),
                if (referral.confirmedDate != null || referral.preferredDate != null) ...[
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      const Icon(Icons.calendar_today_outlined, size: 13, color: AppTheme.onSurfaceVariant),
                      const SizedBox(width: 6),
                      Text(
                        'Date: ${referral.confirmedDate ?? referral.preferredDate}',
                        style: const TextStyle(fontSize: 12, color: AppTheme.onSurfaceVariant),
                      ),
                      if (referral.confirmedTimeSlot != null || referral.preferredTimeSlot != null) ...[
                        const SizedBox(width: 6),
                        Text(
                          '(${referral.confirmedTimeSlot ?? referral.preferredTimeSlot})',
                          style: const TextStyle(fontSize: 11, color: AppTheme.onSurfaceVariant),
                        ),
                      ],
                    ],
                  ),
                ],
                if (referral.quotedPrice != null) ...[
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      const Icon(Icons.currency_rupee, size: 13, color: AppTheme.primary),
                      const SizedBox(width: 4),
                      Text(
                        'Estimated Tariff: ₹${referral.quotedPrice!.toStringAsFixed(0)} ${referral.billingUnit ?? ''}',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.primary,
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),

          if (referral.preparationInstructions != null && referral.preparationInstructions!.isNotEmpty) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFFFFFBEB),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFFFDE68A)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.assignment_outlined, size: 14, color: Color(0xFFB45309)),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      'Prep Instructions: ${referral.preparationInstructions}',
                      style: const TextStyle(fontSize: 11, color: Color(0xFF92400E), height: 1.3),
                    ),
                  ),
                ],
              ),
            ),
          ],

          if (referral.receivingHospitalPhone != null && referral.receivingHospitalPhone!.isNotEmpty) ...[
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () => _makeCall(referral.receivingHospitalPhone!),
                icon: const Icon(Icons.phone, size: 14, color: AppTheme.primary),
                label: Text(
                  'Call Facility (${referral.receivingHospitalPhone})',
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                ),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: AppTheme.outlineVariant),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final refProv = context.watch<ReferralProvider>();

    return Scaffold(
      backgroundColor: AppTheme.surface,
      appBar: AppBar(
        title: const Text(
          'My Referrals & Appointments',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: AppTheme.onSurface,
          ),
        ),
        backgroundColor: AppTheme.surfaceContainerLowest,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: AppTheme.primary),
            onPressed: () => refProv.fetchReferrals(),
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppTheme.primary,
          indicatorWeight: 3,
          labelColor: AppTheme.primary,
          unselectedLabelColor: AppTheme.onSurfaceVariant,
          labelStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
          unselectedLabelStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
          tabs: [
            Tab(text: 'Confirmed (${refProv.confirmedAppointments.length})'),
            Tab(text: 'Pending (${refProv.pendingReferrals.length})'),
            Tab(text: 'All (${refProv.referrals.length})'),
          ],
        ),
      ),
      body: refProv.isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : refProv.error != null
              ? EmptyErrorView(
                  title: 'Unable to Load Referrals',
                  description: refProv.error!,
                  buttonText: 'Retry',
                  onRetry: () => refProv.fetchReferrals(),
                )
              : TabBarView(
                  controller: _tabController,
                  children: [
                    _buildList(refProv.confirmedAppointments, 'No confirmed appointments found.'),
                    _buildList(refProv.pendingReferrals, 'No pending referrals awaiting response.'),
                    _buildList(refProv.referrals, 'No referral records associated with your account.'),
                  ],
                ),
    );
  }

  Widget _buildList(List<Referral> items, String emptyMessage) {
    if (items.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.calendar_month_outlined, size: 48, color: AppTheme.outline.withValues(alpha: 0.5)),
              const SizedBox(height: 12),
              Text(
                emptyMessage,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 13, color: AppTheme.onSurfaceVariant),
              ),
            ],
          ),
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: items.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (context, idx) => _buildReferralCard(items[idx]),
    );
  }
}

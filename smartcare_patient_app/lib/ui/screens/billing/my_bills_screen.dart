import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../data/models/patient_bill_model.dart';
import '../../../providers/auth_provider.dart';
import '../../../providers/billing_provider.dart';
import '../../widgets/clinical_header.dart';
import '../../widgets/empty_error_view.dart';
import '../auth/login_screen.dart';
import 'bill_detail_screen.dart';

class MyBillsScreen extends StatefulWidget {
  const MyBillsScreen({super.key});

  @override
  State<MyBillsScreen> createState() => _MyBillsScreenState();
}

class _MyBillsScreenState extends State<MyBillsScreen> {
  String _selectedStatus = 'All';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final auth = context.read<AuthProvider>();
      if (auth.isAuthenticated) {
        _loadBills();
      }
    });
  }

  void _loadBills() {
    context.read<BillingProvider>().fetchBills(
          status: _selectedStatus != 'All' ? _selectedStatus : null,
        );
  }

  String _formatINR(double amount) {
    return '₹${amount.toStringAsFixed(amount.truncateToDouble() == amount ? 0 : 2)}';
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final billingProvider = context.watch<BillingProvider>();
    final isAuthenticated = authProvider.isAuthenticated;
    final bills = billingProvider.bills;
    final isLoading = billingProvider.isLoading;

    return Scaffold(
      backgroundColor: AppTheme.surface,
      body: SafeArea(
        child: Column(
          children: [
            ClinicalHeader(
              title: 'My Medical Bills',
              showBackButton: true,
              onBack: () => Navigator.of(context).pop(),
            ),

            if (!isAuthenticated)
              Expanded(
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.lock_outline, size: 54, color: AppTheme.primary),
                        const SizedBox(height: 16),
                        const Text(
                          'Patient Authentication Required',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.onSurface,
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Log in with your registered SmartCare patient account to securely view your invoices and receipts.',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 13, color: AppTheme.onSurfaceVariant),
                        ),
                        const SizedBox(height: 24),
                        ElevatedButton(
                          onPressed: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(builder: (_) => const LoginScreen()),
                            );
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.primary,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          child: const Text('Log In to Patient Account', style: TextStyle(fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),
                  ),
                ),
              )
            else ...[
              // Filter Status Tabs
              Container(
                height: 48,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  children: [
                    _buildFilterChip('All', 'All Invoices'),
                    const SizedBox(width: 8),
                    _buildFilterChip('ISSUED', 'Unpaid'),
                    const SizedBox(width: 8),
                    _buildFilterChip('PARTIALLY_PAID', 'Partially Paid'),
                    const SizedBox(width: 8),
                    _buildFilterChip('PAID', 'Settled / Paid'),
                    const SizedBox(width: 8),
                    _buildFilterChip('OVERDUE', 'Overdue'),
                  ],
                ),
              ),

              // Content Area
              Expanded(
                child: isLoading
                    ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
                    : billingProvider.error != null
                        ? EmptyErrorView(
                            title: 'Could Not Load Bills',
                            description: billingProvider.error!,
                            buttonText: 'Retry',
                            onRetry: _loadBills,
                          )
                        : bills.isEmpty
                            ? EmptyErrorView(
                                title: 'No Bills Issued Yet',
                                description:
                                    'You have no active or historical medical bills registered for this account.',
                                buttonText: 'Refresh',
                                onRetry: _loadBills,
                              )
                            : RefreshIndicator(
                                onRefresh: () async => _loadBills(),
                                color: AppTheme.primary,
                                child: ListView.separated(
                                  padding: const EdgeInsets.all(16),
                                  itemCount: bills.length,
                                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                                  itemBuilder: (context, index) {
                                    final bill = bills[index];
                                    return _buildBillCard(context, bill);
                                  },
                                ),
                              ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChip(String status, String label) {
    final isSelected = _selectedStatus == status;
    return ChoiceChip(
      label: Text(
        label,
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
          setState(() => _selectedStatus = status);
          _loadBills();
        }
      },
    );
  }

  Widget _buildBillCard(BuildContext context, PatientBillModel bill) {
    Color statusColor;
    String statusLabel;

    switch (bill.status) {
      case 'PAID':
        statusColor = Colors.green;
        statusLabel = 'Paid in Full';
        break;
      case 'PARTIALLY_PAID':
        statusColor = Colors.teal;
        statusLabel = 'Partially Paid';
        break;
      case 'OVERDUE':
        statusColor = AppTheme.error;
        statusLabel = 'Overdue';
        break;
      default:
        statusColor = AppTheme.primary;
        statusLabel = 'Issued';
    }

    return InkWell(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => BillDetailScreen(billId: bill.id),
          ),
        );
      },
      borderRadius: BorderRadius.circular(16),
      child: Container(
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
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(Icons.receipt_long, color: AppTheme.primary, size: 20),
                    const SizedBox(width: 8),
                    Text(
                      bill.billNumber,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'monospace',
                        color: AppTheme.onSurface,
                      ),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    statusLabel,
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: statusColor,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),

            Text(
              bill.hospitalName ?? 'SmartCare Network Hospital',
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: AppTheme.onSurface,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              'Date: ${bill.billDate.day}/${bill.billDate.month}/${bill.billDate.year}',
              style: const TextStyle(fontSize: 12, color: AppTheme.onSurfaceVariant),
            ),

            const Divider(height: 20, color: AppTheme.outlineVariant),

            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Total Amount', style: TextStyle(fontSize: 11, color: AppTheme.onSurfaceVariant)),
                    Text(
                      _formatINR(bill.totalAmount),
                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppTheme.onSurface),
                    ),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    const Text('Balance Due', style: TextStyle(fontSize: 11, color: AppTheme.onSurfaceVariant)),
                    Text(
                      _formatINR(bill.balanceDue),
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: bill.balanceDue > 0 ? AppTheme.error : Colors.green,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

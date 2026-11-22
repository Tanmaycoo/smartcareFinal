import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../data/models/patient_bill_model.dart';
import '../../../data/services/storage_service.dart';
import '../../../providers/auth_provider.dart';
import '../../../providers/billing_provider.dart';
import '../../widgets/clinical_header.dart';
import '../../widgets/empty_error_view.dart';
import '../auth/login_screen.dart';
import 'bill_detail_screen.dart';

class MyBillsScreen extends StatefulWidget {
  final String? initialQuery;

  const MyBillsScreen({super.key, this.initialQuery});

  @override
  State<MyBillsScreen> createState() => _MyBillsScreenState();
}

class _MyBillsScreenState extends State<MyBillsScreen> {
  String _selectedStatus = 'All';
  late final TextEditingController _searchCtrl;

  @override
  void initState() {
    super.initState();
    _searchCtrl = TextEditingController(text: widget.initialQuery ?? '');

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_searchCtrl.text.isEmpty) {
        final storage = context.read<StorageService>();
        final lastTicket = storage.getLastTicketCode();
        if (lastTicket != null && lastTicket.isNotEmpty) {
          // Keep as suggestion or pre-fill
        }
      }
      _loadBills();
    });
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  void _loadBills() {
    context.read<BillingProvider>().fetchBills(
          status: _selectedStatus != 'All' ? _selectedStatus : null,
          query: _searchCtrl.text.trim().isNotEmpty ? _searchCtrl.text.trim() : null,
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

            // Search Bar for Quick Invoice Lookup
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              color: AppTheme.surfaceContainerLowest,
              child: Row(
                children: [
                  Expanded(
                    child: Container(
                      height: 44,
                      decoration: BoxDecoration(
                        color: AppTheme.surfaceContainerLow,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppTheme.outlineVariant.withValues(alpha: 0.5)),
                      ),
                      child: TextField(
                        controller: _searchCtrl,
                        onSubmitted: (_) => _loadBills(),
                        decoration: InputDecoration(
                          hintText: 'Search by Phone, Ticket #, or Bill #',
                          hintStyle: const TextStyle(fontSize: 12, color: AppTheme.onSurfaceVariant),
                          prefixIcon: const Icon(Icons.search, size: 20, color: AppTheme.onSurfaceVariant),
                          suffixIcon: _searchCtrl.text.isNotEmpty
                              ? IconButton(
                                  icon: const Icon(Icons.clear, size: 16, color: AppTheme.onSurfaceVariant),
                                  onPressed: () {
                                    _searchCtrl.clear();
                                    _loadBills();
                                  },
                                )
                              : null,
                          border: InputBorder.none,
                          contentPadding: const EdgeInsets.symmetric(vertical: 12),
                          filled: false,
                        ),
                        style: const TextStyle(fontSize: 13, color: AppTheme.onSurface),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton(
                    onPressed: _loadBills,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primary,
                      foregroundColor: Colors.white,
                      minimumSize: const Size(60, 44),
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    child: const Text('Find', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  ),
                ],
              ),
            ),

            // Guest hint strip if not logged in
            if (!isAuthenticated)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                color: AppTheme.primaryContainer.withValues(alpha: 0.25),
                child: Row(
                  children: [
                    const Icon(Icons.info_outline, size: 15, color: AppTheme.primary),
                    const SizedBox(width: 6),
                    const Expanded(
                      child: Text(
                        'Viewing verified issued invoices. Sign in to link bills to your profile.',
                        style: TextStyle(fontSize: 11, color: AppTheme.onSurfaceVariant),
                      ),
                    ),
                    TextButton(
                      style: TextButton.styleFrom(
                        padding: EdgeInsets.zero,
                        minimumSize: const Size(50, 24),
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                      onPressed: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(builder: (_) => const LoginScreen()),
                        );
                      },
                      child: const Text(
                        'Sign In',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.primary),
                      ),
                    ),
                  ],
                ),
              ),

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
                              title: 'No Invoices Found',
                              description: _searchCtrl.text.isNotEmpty
                                  ? 'No issued bills matched "${_searchCtrl.text}". Try entering your phone number or ticket code.'
                                  : 'No medical bills are currently registered for this query.',
                              buttonText: 'Show All Issued Bills',
                              onRetry: () {
                                _searchCtrl.clear();
                                setState(() => _selectedStatus = 'All');
                                _loadBills();
                              },
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

            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    bill.patientName,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.onSurface,
                    ),
                  ),
                ),
                if (bill.patientPhone != null && bill.patientPhone!.isNotEmpty)
                  Text(
                    bill.patientPhone!,
                    style: const TextStyle(fontSize: 12, color: AppTheme.onSurfaceVariant),
                  ),
              ],
            ),
            const SizedBox(height: 2),

            Text(
              bill.hospitalName ?? 'SmartCare Network Hospital',
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: AppTheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              'Issued: ${bill.billDate.day}/${bill.billDate.month}/${bill.billDate.year}',
              style: const TextStyle(fontSize: 11, color: AppTheme.onSurfaceVariant),
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

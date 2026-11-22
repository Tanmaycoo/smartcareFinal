import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/theme/app_theme.dart';
import '../../../providers/billing_provider.dart';
import '../../widgets/clinical_header.dart';
import '../../widgets/empty_error_view.dart';

class BillDetailScreen extends StatefulWidget {
  final int billId;

  const BillDetailScreen({super.key, required this.billId});

  @override
  State<BillDetailScreen> createState() => _BillDetailScreenState();
}

class _BillDetailScreenState extends State<BillDetailScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<BillingProvider>().fetchBillDetail(widget.billId);
    });
  }

  String _formatINR(double amount) {
    return '₹${amount.toStringAsFixed(amount.truncateToDouble() == amount ? 0 : 2)}';
  }

  Future<void> _callHospital(String? phone) async {
    if (phone == null || phone.isEmpty) return;
    final clean = phone.replaceAll(RegExp(r'[^0-9+]'), '');
    final uri = Uri.parse('tel:$clean');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  @override
  Widget build(BuildContext context) {
    final billingProvider = context.watch<BillingProvider>();
    final bill = billingProvider.selectedBill;
    final isLoading = billingProvider.isLoading;

    return Scaffold(
      backgroundColor: AppTheme.surface,
      body: SafeArea(
        child: Column(
          children: [
            ClinicalHeader(
              title: 'Invoice Details',
              showBackButton: true,
              onBack: () => Navigator.of(context).pop(),
            ),

            Expanded(
              child: isLoading
                  ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
                  : bill == null
                      ? EmptyErrorView(
                          title: 'Invoice Not Found',
                          description: billingProvider.error ?? 'Unable to retrieve invoice record.',
                          buttonText: 'Retry',
                          onRetry: () => billingProvider.fetchBillDetail(widget.billId),
                        )
                      : SingleChildScrollView(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Top Hospital Letterhead Card
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
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                bill.hospitalName ?? 'SmartCare Network Hospital',
                                                style: const TextStyle(
                                                  fontSize: 18,
                                                  fontWeight: FontWeight.bold,
                                                  color: AppTheme.onSurface,
                                                ),
                                              ),
                                              if (bill.hospitalAddress != null)
                                                Padding(
                                                  padding: const EdgeInsets.only(top: 2),
                                                  child: Text(
                                                    bill.hospitalAddress!,
                                                    style: const TextStyle(fontSize: 12, color: AppTheme.onSurfaceVariant),
                                                  ),
                                                ),
                                            ],
                                          ),
                                        ),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                          decoration: BoxDecoration(
                                            color: AppTheme.primaryFixed,
                                            borderRadius: BorderRadius.circular(8),
                                          ),
                                          child: Text(
                                            bill.status,
                                            style: const TextStyle(
                                              fontSize: 11,
                                              fontWeight: FontWeight.bold,
                                              color: AppTheme.primary,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const Divider(height: 24, color: AppTheme.outlineVariant),

                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            const Text('Invoice No', style: TextStyle(fontSize: 11, color: AppTheme.onSurfaceVariant)),
                                            Text(
                                              bill.billNumber,
                                              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, fontFamily: 'monospace'),
                                            ),
                                          ],
                                        ),
                                        Column(
                                          crossAxisAlignment: CrossAxisAlignment.end,
                                          children: [
                                            const Text('Issue Date', style: TextStyle(fontSize: 11, color: AppTheme.onSurfaceVariant)),
                                            Text(
                                              '${bill.billDate.day}/${bill.billDate.month}/${bill.billDate.year}',
                                              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),

                                    if (bill.dueDate != null) ...[
                                      const SizedBox(height: 8),
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          const Text('Payment Due Date', style: TextStyle(fontSize: 11, color: AppTheme.error)),
                                          Text(
                                            '${bill.dueDate!.day}/${bill.dueDate!.month}/${bill.dueDate!.year}',
                                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.error),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ],
                                ),
                              ),

                              const SizedBox(height: 16),

                              // Itemized Services Table
                              const Text(
                                'Itemized Medical Charges',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                  color: AppTheme.onSurface,
                                ),
                              ),
                              const SizedBox(height: 8),

                              Container(
                                decoration: BoxDecoration(
                                  color: AppTheme.surfaceContainerLowest,
                                  borderRadius: BorderRadius.circular(16),
                                  boxShadow: AppTheme.cardShadow,
                                ),
                                child: ListView.separated(
                                  shrinkWrap: true,
                                  physics: const NeverScrollableScrollPhysics(),
                                  itemCount: bill.items.length,
                                  separatorBuilder: (_, __) => const Divider(height: 1, color: AppTheme.outlineVariant),
                                  itemBuilder: (context, index) {
                                    final item = bill.items[index];
                                    return Padding(
                                      padding: const EdgeInsets.all(14),
                                      child: Row(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                  item.serviceName,
                                                  style: const TextStyle(
                                                    fontSize: 13,
                                                    fontWeight: FontWeight.bold,
                                                    color: AppTheme.onSurface,
                                                  ),
                                                ),
                                                if (item.category != null)
                                                  Text(
                                                    item.category!,
                                                    style: const TextStyle(fontSize: 11, color: AppTheme.onSurfaceVariant),
                                                  ),
                                                Text(
                                                  '${_formatINR(item.unitPrice)} × ${item.quantity.toStringAsFixed(item.quantity.truncateToDouble() == item.quantity ? 0 : 1)}',
                                                  style: const TextStyle(fontSize: 11, color: AppTheme.outline),
                                                ),
                                              ],
                                            ),
                                          ),
                                          Text(
                                            _formatINR(item.totalPrice),
                                            style: const TextStyle(
                                              fontSize: 14,
                                              fontWeight: FontWeight.w700,
                                              color: AppTheme.onSurface,
                                            ),
                                          ),
                                        ],
                                      ),
                                    );
                                  },
                                ),
                              ),

                              const SizedBox(height: 16),

                              // Summary Totals Card
                              Container(
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: AppTheme.surfaceContainerLowest,
                                  borderRadius: BorderRadius.circular(16),
                                  boxShadow: AppTheme.cardShadow,
                                ),
                                child: Column(
                                  children: [
                                    _buildSummaryRow('Subtotal', _formatINR(bill.subtotal)),
                                    if (bill.taxAmount > 0)
                                      _buildSummaryRow('GST / Healthcare Tax', _formatINR(bill.taxAmount)),
                                    if (bill.discountAmount > 0)
                                      _buildSummaryRow('Discount / Concession', '-${_formatINR(bill.discountAmount)}', isDiscount: true),
                                    const Divider(height: 20, color: AppTheme.outlineVariant),
                                    _buildSummaryRow('Total Amount', _formatINR(bill.totalAmount), isBold: true),
                                    _buildSummaryRow('Total Paid', _formatINR(bill.amountPaid), isSuccess: true),
                                    const Divider(height: 20, color: AppTheme.outlineVariant),
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        const Text(
                                          'Balance Due',
                                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppTheme.onSurface),
                                        ),
                                        Text(
                                          _formatINR(bill.balanceDue),
                                          style: TextStyle(
                                            fontSize: 20,
                                            fontWeight: FontWeight.w900,
                                            color: bill.balanceDue > 0 ? AppTheme.error : Colors.green,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),

                              // Payment Receipts
                              if (bill.payments.isNotEmpty) ...[
                                const SizedBox(height: 20),
                                const Text(
                                  'Payment Receipts',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w700,
                                    color: AppTheme.onSurface,
                                  ),
                                ),
                                const SizedBox(height: 8),

                                ...bill.payments.map((p) => Container(
                                      margin: const EdgeInsets.only(bottom: 8),
                                      padding: const EdgeInsets.all(14),
                                      decoration: BoxDecoration(
                                        color: AppTheme.surfaceContainerLowest,
                                        borderRadius: BorderRadius.circular(12),
                                        border: Border.all(color: AppTheme.outlineVariant.withValues(alpha: 0.3)),
                                      ),
                                      child: Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                p.receiptNumber,
                                                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, fontFamily: 'monospace'),
                                              ),
                                              Text(
                                                '${p.paymentMethod} • ${p.paymentDate.day}/${p.paymentDate.month}/${p.paymentDate.year}',
                                                style: const TextStyle(fontSize: 11, color: AppTheme.onSurfaceVariant),
                                              ),
                                            ],
                                          ),
                                          Text(
                                            _formatINR(p.amount),
                                            style: const TextStyle(
                                              fontSize: 15,
                                              fontWeight: FontWeight.bold,
                                              color: Colors.green,
                                            ),
                                          ),
                                        ],
                                      ),
                                    )),
                              ],

                              const SizedBox(height: 20),

                              if (bill.hospitalPhone != null)
                                OutlinedButton.icon(
                                  onPressed: () => _callHospital(bill.hospitalPhone),
                                  icon: const Icon(Icons.phone, size: 18),
                                  label: const Text('Contact Hospital Billing Desk', style: TextStyle(fontWeight: FontWeight.bold)),
                                  style: OutlinedButton.styleFrom(
                                    foregroundColor: AppTheme.primary,
                                    minimumSize: const Size(double.infinity, 48),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  ),
                                ),
                            ],
                          ),
                        ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryRow(String label, String value, {bool isBold = false, bool isDiscount = false, bool isSuccess = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: isBold ? 14 : 12,
              fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
              color: AppTheme.onSurfaceVariant,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: isBold ? 15 : 12,
              fontWeight: isBold ? FontWeight.bold : FontWeight.w600,
              color: isDiscount
                  ? Colors.green
                  : isSuccess
                      ? Colors.teal
                      : AppTheme.onSurface,
            ),
          ),
        ],
      ),
    );
  }
}

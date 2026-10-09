import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'config/api_config.dart';

class PaymentWebViewScreen extends StatefulWidget {
  final String checkoutUrl;
  final String reference;
  final String provider;
  final String tier;

  const PaymentWebViewScreen({
    super.key,
    required this.checkoutUrl,
    required this.reference,
    required this.provider,
    required this.tier,
  });

  @override
  State<PaymentWebViewScreen> createState() => _PaymentWebViewScreenState();
}

class _PaymentWebViewScreenState extends State<PaymentWebViewScreen> {
  late final WebViewController _controller;
  int _loadingProgress = 0;
  bool _isVerifying = false;
  bool _hasTriggeredVerification = false;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFF120B1C))
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (int progress) {
            if (mounted) setState(() => _loadingProgress = progress);
          },
          onPageStarted: (String url) {
            _handleUrlNavigation(url);
          },
          onPageFinished: (String url) {
            _handleUrlNavigation(url);
          },
          onNavigationRequest: (NavigationRequest request) {
            _handleUrlNavigation(request.url);
            return NavigationDecision.navigate;
          },
          onWebResourceError: (WebResourceError error) {
            debugPrint('WebView error: ${error.description}');
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.checkoutUrl));
  }

  void _handleUrlNavigation(String url) {
    debugPrint('Payment WebView navigated to: $url');
    final lower = url.toLowerCase();
    // Check if the user reached a completion or success callback
    if (lower.contains('status=success') ||
        lower.contains('status=successful') ||
        lower.contains('status=completed') ||
        lower.contains('/pricing') ||
        lower.contains('callback') ||
        lower.contains('trxref=') ||
        lower.contains('tx_ref=')) {
      if (!_hasTriggeredVerification) {
        _hasTriggeredVerification = true;
        _verifyPayment(isAuto: true);
      }
    }
  }

  Future<void> _verifyPayment({bool isAuto = false}) async {
    if (_isVerifying) return;
    setState(() => _isVerifying = true);

    try {
      final res = await http.get(
        Uri.parse(
          '${ApiConfig.baseUrl}/payments/verify/${widget.reference}?provider=${widget.provider}',
        ),
      );

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data['success'] == true) {
          if (!mounted) return;
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              backgroundColor: const Color(0xFF10B981),
              duration: const Duration(seconds: 4),
              content: Text(
                '🎉 Payment confirmed! Successfully upgraded to ${widget.tier} tier!',
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
          );
          Navigator.pop(context, true);
          return;
        }
      }

      if (!isAuto && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            backgroundColor: Color(0xFFF59E0B),
            content: Text(
              'Payment verification pending. If you just authorized payment, please wait 3-5 seconds and tap again.',
            ),
          ),
        );
      }
    } catch (e) {
      if (!isAuto && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: Colors.redAccent,
            content: Text('Verification check error: $e'),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isVerifying = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF120B1C),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A102A),
        elevation: 1,
        leading: IconButton(
          icon: const Icon(Icons.close, color: Colors.white),
          onPressed: () => Navigator.pop(context, false),
        ),
        title: Row(
          children: [
            Icon(
              widget.provider == 'PAYSTACK' ? Icons.credit_card : Icons.waves,
              color: const Color(0xFF00F0FF),
              size: 20,
            ),
            const SizedBox(width: 8),
            Text(
              '${widget.provider} Checkout',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white70),
            onPressed: () => _controller.reload(),
          ),
        ],
        bottom: _loadingProgress < 100
            ? PreferredSize(
                preferredSize: const Size.fromHeight(3),
                child: LinearProgressIndicator(
                  value: _loadingProgress / 100,
                  backgroundColor: Colors.transparent,
                  valueColor: const AlwaysStoppedAnimation<Color>(
                    Color(0xFF00F0FF),
                  ),
                ),
              )
            : null,
      ),
      body: Stack(
        children: [
          WebViewWidget(controller: _controller),
          if (_isVerifying)
            Container(
              color: Colors.black54,
              child: const Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CircularProgressIndicator(color: Color(0xFF00F0FF)),
                    SizedBox(height: 16),
                    Text(
                      'Verifying payment with gateway...',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: const Color(0xFF1A102A),
          border: Border(
            top: BorderSide(color: Colors.white.withOpacity(0.08)),
          ),
        ),
        child: SafeArea(
          child: Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: _isVerifying ? null : () => _verifyPayment(isAuto: false),
                  icon: const Icon(Icons.check_circle_outline, color: Colors.black, size: 20),
                  label: Text(
                    _isVerifying ? 'Verifying...' : 'I Have Completed Payment',
                    style: const TextStyle(
                      color: Colors.black,
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF00F0FF),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

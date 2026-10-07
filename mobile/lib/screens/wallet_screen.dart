import 'package:flutter/material.dart';
import '../../widgets/glass_card.dart';

class WalletScreen extends StatelessWidget {
  const WalletScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final credentials = [
      {'type': 'DEGREE', 'name': 'B.Sc. Computer Science', 'issuer': 'Stanford University', 'status': 'VERIFIED', 'icon': Icons.school},
      {'type': 'CERTIFICATE', 'name': 'AWS Solutions Architect', 'issuer': 'Amazon Web Services', 'status': 'VERIFIED', 'icon': Icons.cloud_done},
      {'type': 'ID', 'name': 'National Passport', 'issuer': 'Govt. Issued', 'status': 'PENDING', 'icon': Icons.badge},
    ];

    return Scaffold(
      backgroundColor: const Color(0xFF120B1C),
      appBar: AppBar(
        title: const Text('Digital Credential Wallet'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {},
        icon: const Icon(Icons.upload_file),
        label: const Text('Add Credential'),
        backgroundColor: Colors.blueAccent,
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16.0),
        itemCount: credentials.length,
        itemBuilder: (context, index) {
          final cred = credentials[index];
          final isVerified = cred['status'] == 'VERIFIED';
          
          return GlassCard(
            margin: const EdgeInsets.only(bottom: 16),
            padding: EdgeInsets.zero,
            color: isVerified ? Colors.green : Colors.yellow,
            opacity: 0.05,
            child: ListTile(
              contentPadding: const EdgeInsets.all(16),
              leading: CircleAvatar(
                backgroundColor: Colors.blueAccent.withOpacity(0.2),
                radius: 28,
                child: Icon(cred['icon'] as IconData, color: Colors.blueAccent, size: 28),
              ),
              title: Text(
                cred['name'] as String,
                style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 18),
              ),
              subtitle: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 4),
                  Text(cred['issuer'] as String, style: TextStyle(color: Colors.white.withOpacity(0.7))),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: isVerified ? Colors.green.withOpacity(0.2) : Colors.yellow.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(isVerified ? Icons.verified : Icons.hourglass_empty, 
                             color: isVerified ? Colors.greenAccent : Colors.yellowAccent, size: 16),
                        const SizedBox(width: 4),
                        Text(
                          cred['status'] as String,
                          style: TextStyle(
                            color: isVerified ? Colors.greenAccent : Colors.yellowAccent,
                            fontSize: 12,
                            fontWeight: FontWeight.bold
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

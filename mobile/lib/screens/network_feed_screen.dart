import 'package:flutter/material.dart';

class NetworkFeedScreen extends StatelessWidget {
  const NetworkFeedScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final posts = [
      {
        'author': 'Jane Doe',
        'role': 'Senior React Developer',
        'time': '2h ago',
        'content': "Just earned my AWS Solutions Architect certification! 🚀 Really excited to apply these cloud patterns to my next big project.",
        'likes': 124,
        'comments': 18
      },
      {
        'author': 'Tech Innovators Inc.',
        'role': 'Company Update',
        'time': '5h ago',
        'content': "We're expanding our remote engineering team! If you're passionate about AI and scalable systems, check out our latest job postings.",
        'likes': 342,
        'comments': 56
      },
    ];

    return Scaffold(
      backgroundColor: const Color(0xFF120B1C),
      appBar: AppBar(
        title: const Text('Professional Network'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {},
        backgroundColor: Colors.blueAccent,
        child: const Icon(Icons.edit),
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16.0),
        itemCount: posts.length,
        itemBuilder: (context, index) {
          final post = posts[index];
          return Container(
            margin: const EdgeInsets.only(bottom: 24),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.05),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    CircleAvatar(
                      backgroundColor: Colors.indigoAccent,
                      child: Text(post['author'].toString()[0]),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(post['author'].toString(), style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 16)),
                          Text('${post['role']} • ${post['time']}', style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 12)),
                        ],
                      ),
                    ),
                    Icon(Icons.more_horiz, color: Colors.white.withOpacity(0.5)),
                  ],
                ),
                const SizedBox(height: 16),
                Text(post['content'].toString(), style: const TextStyle(color: Colors.white70, fontSize: 15)),
                const SizedBox(height: 16),
                const Divider(color: Colors.white24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _buildActionButton(Icons.favorite_border, '${post['likes']}'),
                    _buildActionButton(Icons.comment_outlined, '${post['comments']}'),
                    _buildActionButton(Icons.share, 'Share'),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildActionButton(IconData icon, String label) {
    return TextButton.icon(
      onPressed: () {},
      icon: Icon(icon, color: Colors.white54, size: 20),
      label: Text(label, style: const TextStyle(color: Colors.white54)),
    );
  }
}

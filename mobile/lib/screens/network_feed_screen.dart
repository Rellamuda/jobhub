import 'package:flutter/material.dart';

class NetworkFeedScreen extends StatefulWidget {
  const NetworkFeedScreen({super.key});

  @override
  State<NetworkFeedScreen> createState() => _NetworkFeedScreenState();
}

class _NetworkFeedScreenState extends State<NetworkFeedScreen> {
  String _selectedFilter = 'All';
  final List<String> _filters = ['All', 'Tech & Dev', 'Hiring', 'Milestones'];

  List<Map<String, dynamic>> _posts = [
    {
      'id': '1',
      'author': 'Jane Doe',
      'role': 'Senior React Developer',
      'category': 'Milestones',
      'time': '2h ago',
      'content': "Just earned my AWS Solutions Architect certification! 🚀 Really excited to apply these cloud patterns to my next big project. Huge thanks to everyone who shared study resources!",
      'likes': 124,
      'isLiked': false,
      'comments': [
        {'user': 'Alex Smith', 'text': 'Huge congrats Jane! Well deserved! 🎉'},
        {'user': 'Michael Chen', 'text': 'What was your favorite topic in the exam?'}
      ],
      'tags': ['#AWS', '#Cloud', '#Certification']
    },
    {
      'id': '2',
      'author': 'Tech Innovators Inc.',
      'role': 'Hiring Manager',
      'category': 'Hiring',
      'time': '4h ago',
      'content': "We're expanding our remote engineering team! If you're passionate about AI and scalable systems, check out our latest job postings on JobHub. Competitive compensation + equity.",
      'likes': 342,
      'isLiked': false,
      'comments': [
        {'user': 'Sarah Connor', 'text': 'Just submitted my application via 1-tap apply!'}
      ],
      'tags': ['#Hiring', '#Remote', '#SoftwareEngineer']
    },
    {
      'id': '3',
      'author': 'David Kim',
      'role': 'Fullstack AI Engineer',
      'category': 'Tech & Dev',
      'time': '7h ago',
      'content': "Pro tip for junior developers: Focus deeply on fundamentals (Data structures, clean APIs, system design) before chasing every new library. That foundational depth is what top teams look for in interviews.",
      'likes': 89,
      'isLiked': false,
      'comments': [
        {'user': 'Liam Brown', 'text': '100% agreed, solid basics make learning new frameworks a breeze.'}
      ],
      'tags': ['#CareerAdvice', '#Coding', '#Mentorship']
    },
  ];

  void _toggleLike(int index) {
    setState(() {
      final post = _posts[index];
      final isCurrentlyLiked = post['isLiked'] as bool;
      post['isLiked'] = !isCurrentlyLiked;
      post['likes'] = (post['likes'] as int) + (isCurrentlyLiked ? -1 : 1);
    });
  }

  void _showCreatePostModal() {
    final contentController = TextEditingController();
    String category = 'Tech & Dev';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF1E1430),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 24,
                bottom: MediaQuery.of(context).viewInsets.bottom + 24,
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Share an Update',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close, color: Colors.white70),
                          onPressed: () => Navigator.pop(context),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        const CircleAvatar(
                          backgroundColor: Colors.blueAccent,
                          child: Icon(Icons.person, color: Colors.white),
                        ),
                        const SizedBox(width: 12),
                        DropdownButton<String>(
                          value: category,
                          dropdownColor: const Color(0xFF251A3E),
                          underline: const SizedBox(),
                          style: const TextStyle(color: Colors.blueAccent, fontWeight: FontWeight.bold),
                          items: const [
                            DropdownMenuItem(value: 'Tech & Dev', child: Text('Category: Tech & Dev')),
                            DropdownMenuItem(value: 'Hiring', child: Text('Category: Hiring / Opportunity')),
                            DropdownMenuItem(value: 'Milestones', child: Text('Category: Milestone / Achievement')),
                          ],
                          onChanged: (val) {
                            if (val != null) setModalState(() => category = val);
                          },
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: contentController,
                      maxLines: 5,
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        hintText: "What do you want to talk about? (Insights, job opportunities, milestones...)",
                        hintStyle: TextStyle(color: Colors.white.withOpacity(0.4)),
                        filled: true,
                        fillColor: Colors.white.withOpacity(0.06),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(16),
                          borderSide: BorderSide.none,
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton.icon(
                        icon: const Icon(Icons.send, color: Colors.white),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.blueAccent,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                        onPressed: () {
                          final text = contentController.text.trim();
                          if (text.isEmpty) return;

                          final newPost = {
                            'id': DateTime.now().millisecondsSinceEpoch.toString(),
                            'author': 'You (Profile)',
                            'role': 'JobHub Member',
                            'category': category,
                            'time': 'Just now',
                            'content': text,
                            'likes': 0,
                            'isLiked': false,
                            'comments': <Map<String, String>>[],
                            'tags': ['#JobHub', '#Networking'],
                          };

                          setState(() {
                            _posts.insert(0, newPost);
                          });

                          Navigator.pop(context);
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Post published to professional network! 🚀')),
                          );
                        },
                        label: const Text('Publish Post', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  void _showCommentsModal(int postIndex) {
    final commentController = TextEditingController();
    final post = _posts[postIndex];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF1E1430),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            final List comments = post['comments'] as List;
            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 24,
                bottom: MediaQuery.of(context).viewInsets.bottom + 20,
              ),
              child: SizedBox(
                height: 480,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Comments (${comments.length})',
                          style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close, color: Colors.white70),
                          onPressed: () => Navigator.pop(context),
                        ),
                      ],
                    ),
                    const Divider(color: Colors.white24),
                    Expanded(
                      child: comments.isEmpty
                          ? Center(
                              child: Text(
                                'No comments yet. Be the first to join the conversation!',
                                style: TextStyle(color: Colors.white.withOpacity(0.5)),
                                textAlign: TextAlign.center,
                              ),
                            )
                          : ListView.builder(
                              itemCount: comments.length,
                              itemBuilder: (context, i) {
                                final c = comments[i];
                                return Container(
                                  margin: const EdgeInsets.only(bottom: 12),
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withOpacity(0.05),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        c['user'] ?? 'User',
                                        style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.blueAccent, fontSize: 13),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        c['text'] ?? '',
                                        style: const TextStyle(color: Colors.white70, fontSize: 14),
                                      ),
                                    ],
                                  ),
                                );
                              },
                            ),
                    ),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: commentController,
                            style: const TextStyle(color: Colors.white),
                            decoration: InputDecoration(
                              hintText: 'Add your comment...',
                              hintStyle: TextStyle(color: Colors.white.withOpacity(0.4)),
                              filled: true,
                              fillColor: Colors.white.withOpacity(0.08),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(24),
                                borderSide: BorderSide.none,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        IconButton(
                          icon: const Icon(Icons.send, color: Colors.blueAccent),
                          onPressed: () {
                            final text = commentController.text.trim();
                            if (text.isEmpty) return;

                            final newComment = {'user': 'You', 'text': text};
                            setModalState(() {
                              comments.add(newComment);
                            });
                            setState(() {
                              post['comments'] = comments;
                            });
                            commentController.clear();
                          },
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final filteredPosts = _selectedFilter == 'All'
        ? _posts
        : _posts.where((p) => p['category'] == _selectedFilter).toList();

    return Scaffold(
      backgroundColor: const Color(0xFF120B1C),
      appBar: AppBar(
        title: const Text('Professional Network'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showCreatePostModal,
        backgroundColor: Colors.blueAccent,
        icon: const Icon(Icons.edit, color: Colors.white),
        label: const Text('Post Update', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await Future.delayed(const Duration(milliseconds: 600));
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Network feed refreshed! 🔄')),
          );
        },
        child: Column(
          children: [
            // Filter categories horizontal list
            Container(
              height: 48,
              margin: const EdgeInsets.symmetric(vertical: 8),
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: _filters.length,
                itemBuilder: (context, i) {
                  final f = _filters[i];
                  final isSelected = f == _selectedFilter;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: FilterChip(
                      selected: isSelected,
                      label: Text(f),
                      labelStyle: TextStyle(
                        color: isSelected ? Colors.white : Colors.white70,
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                      ),
                      backgroundColor: Colors.white.withOpacity(0.06),
                      selectedColor: Colors.blueAccent,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                      onSelected: (selected) {
                        setState(() => _selectedFilter = f);
                      },
                    ),
                  );
                },
              ),
            ),
            // Posts list
            Expanded(
              child: filteredPosts.isEmpty
                  ? Center(
                      child: Text(
                        'No posts found in this category.',
                        style: TextStyle(color: Colors.white.withOpacity(0.5)),
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 80),
                      itemCount: filteredPosts.length,
                      itemBuilder: (context, index) {
                        final post = filteredPosts[index];
                        final origIndex = _posts.indexWhere((p) => p['id'] == post['id']);
                        final isLiked = post['isLiked'] as bool? ?? false;
                        final List comments = post['comments'] as List? ?? [];

                        return Container(
                          margin: const EdgeInsets.only(bottom: 20),
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.05),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: Colors.white.withOpacity(0.08)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  CircleAvatar(
                                    backgroundColor: Colors.indigoAccent,
                                    child: Text(
                                      post['author'].toString()[0],
                                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          post['author'].toString(),
                                          style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 16),
                                        ),
                                        Text(
                                          '${post['role']} • ${post['time']}',
                                          style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 12),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: Colors.blueAccent.withOpacity(0.15),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      post['category'] ?? '',
                                      style: const TextStyle(color: Colors.blueAccent, fontSize: 11, fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 14),
                              Text(
                                post['content'].toString(),
                                style: const TextStyle(color: Colors.white70, fontSize: 15, height: 1.4),
                              ),
                              const SizedBox(height: 10),
                              if (post['tags'] != null)
                                Wrap(
                                  spacing: 6,
                                  children: (post['tags'] as List).map((tag) {
                                    return Text(
                                      tag,
                                      style: const TextStyle(color: Colors.cyanAccent, fontSize: 12, fontWeight: FontWeight.w500),
                                    );
                                  }).toList(),
                                ),
                              const SizedBox(height: 14),
                              const Divider(color: Colors.white12),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceAround,
                                children: [
                                  TextButton.icon(
                                    onPressed: () => _toggleLike(origIndex),
                                    icon: Icon(
                                      isLiked ? Icons.favorite : Icons.favorite_border,
                                      color: isLiked ? Colors.redAccent : Colors.white60,
                                      size: 20,
                                    ),
                                    label: Text(
                                      '${post['likes']}',
                                      style: TextStyle(color: isLiked ? Colors.redAccent : Colors.white60, fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                  TextButton.icon(
                                    onPressed: () => _showCommentsModal(origIndex),
                                    icon: const Icon(Icons.comment_outlined, color: Colors.white60, size: 20),
                                    label: Text(
                                      '${comments.length}',
                                      style: const TextStyle(color: Colors.white60, fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                  TextButton.icon(
                                    onPressed: () {
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        const SnackBar(content: Text('Post link copied to clipboard! 📋')),
                                      );
                                    },
                                    icon: const Icon(Icons.share_outlined, color: Colors.white60, size: 20),
                                    label: const Text('Share', style: TextStyle(color: Colors.white60)),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

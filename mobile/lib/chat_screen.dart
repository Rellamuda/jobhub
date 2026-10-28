import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'config/api_config.dart';

class ChatScreen extends StatefulWidget {
  final String otherUserId;
  final String otherUserName;
  final String? otherUserRole;

  const ChatScreen({
    super.key,
    required this.otherUserId,
    required this.otherUserName,
    this.otherUserRole,
  });

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  List<dynamic> _messages = [];
  bool _isLoading = true;
  bool _isSending = false;
  final TextEditingController _msgCtrl = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _fetchMessages();
  }

  @override
  void dispose() {
    _msgCtrl.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _fetchMessages() async {
    try {
      final headers = await ApiConfig.authHeaders();
      final res = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/messages/${widget.otherUserId}'),
        headers: headers,
      );
      if (res.statusCode == 200) {
        final decoded = jsonDecode(res.body);
        if (mounted) {
          setState(() {
            _messages = decoded is List ? decoded : [];
            _isLoading = false;
          });
          _scrollToBottom();
        }
      } else {
        if (mounted) setState(() => _isLoading = false);
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _sendMessage([String? presetText]) async {
    final content = (presetText ?? _msgCtrl.text).trim();
    if (content.isEmpty || _isSending) return;

    setState(() => _isSending = true);
    if (presetText == null) _msgCtrl.clear();

    try {
      final headers = await ApiConfig.authHeaders();
      final res = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/messages'),
        headers: headers,
        body: jsonEncode({
          'receiverId': widget.otherUserId,
          'content': content,
        }),
      );
      if (res.statusCode == 200 || res.statusCode == 201) {
        await _fetchMessages();
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Could not send message. Please try again.')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Network error: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isSending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF120B1C) : const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF1E162B) : Colors.white,
        elevation: 1,
        iconTheme: IconThemeData(color: isDark ? Colors.white : Colors.black87),
        title: Row(
          children: [
            CircleAvatar(
              radius: 18,
              backgroundColor: const Color(0xFF00F0FF).withOpacity(0.2),
              child: Text(
                widget.otherUserName.isNotEmpty ? widget.otherUserName[0].toUpperCase() : 'U',
                style: const TextStyle(color: Color(0xFF00F0FF), fontWeight: FontWeight.bold),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.otherUserName,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: isDark ? Colors.white : Colors.black87,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (widget.otherUserRole != null && widget.otherUserRole!.isNotEmpty)
                    Text(
                      widget.otherUserRole!,
                      style: const TextStyle(fontSize: 11, color: Color(0xFF00F0FF)),
                    ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Refresh Messages',
            onPressed: _fetchMessages,
          ),
        ],
      ),
      body: Column(
        children: [
          // Quick response chips for interview invitations / follow-ups
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: isDark ? Colors.white.withOpacity(0.03) : Colors.grey.shade100,
              border: Border(
                bottom: BorderSide(color: isDark ? Colors.white12 : Colors.black12),
              ),
            ),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildQuickChip('✅ I accept the interview invitation!'),
                  const SizedBox(width: 8),
                  _buildQuickChip('📅 What time works best for the interview?'),
                  const SizedBox(width: 8),
                  _buildQuickChip('📄 Thank you! Looking forward to speaking.'),
                ],
              ),
            ),
          ),

          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _messages.isEmpty
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(24.0),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.chat_bubble_outline, size: 54, color: isDark ? Colors.white24 : Colors.black26),
                              const SizedBox(height: 12),
                              Text(
                                'No messages yet with ${widget.otherUserName}.',
                                textAlign: TextAlign.center,
                                style: TextStyle(color: isDark ? Colors.white70 : Colors.black54, fontSize: 15),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                'Send a message below to start or respond to an interview invitation.',
                                textAlign: TextAlign.center,
                                style: TextStyle(color: isDark ? Colors.white38 : Colors.black45, fontSize: 13),
                              ),
                            ],
                          ),
                        ),
                      )
                    : ListView.builder(
                        controller: _scrollController,
                        padding: const EdgeInsets.all(16),
                        itemCount: _messages.length,
                        itemBuilder: (context, index) {
                          final msg = _messages[index];
                          final isFromOther = msg['senderId'] == widget.otherUserId;
                          final isMe = !isFromOther;
                          final createdAt = msg['createdAt'] != null
                              ? DateTime.tryParse(msg['createdAt'].toString())
                              : null;
                          final timeLabel = createdAt != null
                              ? '${createdAt.hour.toString().padLeft(2, '0')}:${createdAt.minute.toString().padLeft(2, '0')}'
                              : '';

                          return Align(
                            alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                            child: Container(
                              margin: const EdgeInsets.only(bottom: 10),
                              constraints: BoxConstraints(
                                maxWidth: MediaQuery.of(context).size.width * 0.78,
                              ),
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                              decoration: BoxDecoration(
                                color: isMe
                                    ? const Color(0xFF6366F1)
                                    : (isDark ? const Color(0xFF251B35) : Colors.white),
                                borderRadius: BorderRadius.only(
                                  topLeft: const Radius.circular(16),
                                  topRight: const Radius.circular(16),
                                  bottomLeft: Radius.circular(isMe ? 16 : 4),
                                  bottomRight: Radius.circular(isMe ? 4 : 16),
                                ),
                                border: isMe
                                    ? null
                                    : Border.all(
                                        color: isDark ? Colors.white12 : Colors.black12,
                                      ),
                              ),
                              child: Column(
                                crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    msg['content'] ?? '',
                                    style: TextStyle(
                                      color: isMe
                                          ? Colors.white
                                          : (isDark ? Colors.white : Colors.black87),
                                      fontSize: 14,
                                      height: 1.4,
                                    ),
                                  ),
                                  if (timeLabel.isNotEmpty) ...[
                                    const SizedBox(height: 4),
                                    Text(
                                      timeLabel,
                                      style: TextStyle(
                                        fontSize: 10,
                                        color: isMe
                                            ? Colors.white70
                                            : (isDark ? Colors.white38 : Colors.black45),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          );
                        },
                      ),
          ),

          // Message input bar
          SafeArea(
            top: false,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1E162B) : Colors.white,
                border: Border(
                  top: BorderSide(color: isDark ? Colors.white12 : Colors.black12),
                ),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _msgCtrl,
                      style: TextStyle(color: isDark ? Colors.white : Colors.black87),
                      minLines: 1,
                      maxLines: 4,
                      decoration: InputDecoration(
                        hintText: 'Write a message...',
                        hintStyle: TextStyle(color: isDark ? Colors.white38 : Colors.black38),
                        filled: true,
                        fillColor: isDark ? Colors.white.withOpacity(0.06) : Colors.grey.shade100,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                          borderSide: BorderSide.none,
                        ),
                      ),
                      onSubmitted: (_) => _sendMessage(),
                    ),
                  ),
                  const SizedBox(width: 8),
                  CircleAvatar(
                    radius: 22,
                    backgroundColor: const Color(0xFF00F0FF),
                    child: IconButton(
                      icon: _isSending
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black),
                            )
                          : const Icon(Icons.send, color: Colors.black, size: 20),
                      onPressed: _isSending ? null : () => _sendMessage(),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickChip(String text) {
    return ActionChip(
      backgroundColor: const Color(0xFF00F0FF).withOpacity(0.12),
      side: BorderSide(color: const Color(0xFF00F0FF).withOpacity(0.35)),
      label: Text(
        text,
        style: const TextStyle(color: Color(0xFF00F0FF), fontSize: 12, fontWeight: FontWeight.w600),
      ),
      onPressed: () => _sendMessage(text),
    );
  }
}

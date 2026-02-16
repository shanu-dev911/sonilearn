import 'package:flutter/material.dart';
import 'dart:ui';

class LoginScreen extends StatefulWidget {
  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    // 3D background movement ke liye controller
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 10),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // 1. Animated 3D Background (Moving Blobs)
          AnimatedBuilder(
            animation: _controller,
            builder: (context, child) {
              return Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      Color(0xFF1A237E),
                      Color.lerp(Colors.blue.shade900, Colors.purple.shade900,
                          _controller.value)!,
                    ],
                  ),
                ),
              );
            },
          ),

          // 2. Glassmorphism Card (3D Feel)
          Center(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(30),
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
                child: Container(
                  width: 400,
                  padding: EdgeInsets.all(40),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(30),
                    border: Border.all(color: Colors.white.withOpacity(0.2)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.2),
                        blurRadius: 20,
                        offset: Offset(10, 10), // Shadow for 3D depth
                      )
                    ],
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // 3D Logo Icon
                      Hero(
                        tag: 'logo',
                        child: Icon(Icons.auto_stories,
                            size: 80, color: Colors.cyanAccent),
                      ),
                      SizedBox(height: 20),
                      Text("SONI LEARN",
                          style: TextStyle(
                              fontSize: 32,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                              letterSpacing: 2)),
                      SizedBox(height: 40),

                      // Input Fields
                      _build3DTextField(Icons.email, "Student Email"),
                      SizedBox(height: 20),
                      _build3DTextField(Icons.lock, "Password", obscure: true),
                      SizedBox(height: 40),

                      // 3D Styled Button
                      InkWell(
                        onTap: () => Navigator.pushReplacementNamed(
                            context, '/state-selection'),
                        child: Container(
                          height: 55,
                          decoration: BoxDecoration(
                              gradient: LinearGradient(colors: [
                                Colors.cyanAccent,
                                Colors.blueAccent
                              ]),
                              borderRadius: BorderRadius.circular(15),
                              boxShadow: [
                                BoxShadow(
                                    color: Colors.cyanAccent.withOpacity(0.4),
                                    blurRadius: 10,
                                    offset: Offset(0, 5))
                              ]),
                          child: Center(
                              child: Text("LOGIN",
                                  style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 18))),
                        ),
                      )
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _build3DTextField(IconData icon, String hint, {bool obscure = false}) {
    return TextField(
      obscureText: obscure,
      style: TextStyle(color: Colors.white),
      decoration: InputDecoration(
        prefixIcon: Icon(icon, color: Colors.cyanAccent),
        hintText: hint,
        hintStyle: TextStyle(color: Colors.white60),
        filled: true,
        fillColor: Colors.white.withOpacity(0.05),
        border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(15),
            borderSide: BorderSide.none),
      ),
    );
  }
}

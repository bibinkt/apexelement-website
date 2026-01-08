'use client';

import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    // Supabase configuration - Replace with your actual Supabase credentials
    const SUPABASE_URL = "https://uyvkcyupnofxlcmurdjl.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5dmtjeXVwbm9meGxjbXVyZGpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMzU4NjgsImV4cCI6MjA3MDYxMTg2OH0.cb4EWvhx7jTI6U5psy-YMtdcpOr5jZSiataAcJbTR54";

    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const navLinks = document.getElementById('navLinks');

    if (mobileMenuToggle && navLinks) {
      const handleMobileMenu = () => {
        navLinks.classList.toggle('active');
        mobileMenuToggle.textContent = navLinks.classList.contains('active') ? '✕' : '☰';
      };

      mobileMenuToggle.addEventListener('click', handleMobileMenu);

      // Close mobile menu when clicking a link
      navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          navLinks.classList.remove('active');
          mobileMenuToggle.textContent = '☰';
        });
      });
    }

    // Contact Form Handler
    const contactForm = document.getElementById('contactForm');
    const submitBtn = document.getElementById('submitBtn');
    const formMessage = document.getElementById('formMessage');

    if (contactForm) {
      const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Disable submit button
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
        
        // Get form data
        const formData = {
          name: document.getElementById('name').value,
          email: document.getElementById('email').value,
          company: document.getElementById('company').value || null,
          phone: document.getElementById('phone').value || null,
          message: document.getElementById('message').value,
          created_at: new Date().toISOString()
        };

        try {
          // If Supabase credentials are configured
          if (SUPABASE_URL !== 'YOUR_SUPABASE_PROJECT_URL') {
            // Send to Supabase
            const response = await fetch(`${SUPABASE_URL}/rest/v1/contacts`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Prefer': 'return=minimal'
              },
              body: JSON.stringify(formData)
            });

            if (response.ok) {
              // Success
              formMessage.textContent = 'Thank you for your message! We\'ll get back to you soon.';
              formMessage.className = 'form-message success';
              contactForm.reset();
            } else {
              throw new Error('Failed to submit');
            }
          } else {
            // For demo purposes - log to console
            console.log('Form submission:', formData);
            console.log('Configure Supabase credentials to save to database');
            
            // Show success message for demo
            formMessage.textContent = 'Thank you for your message! (Demo mode - configure Supabase to save data)';
            formMessage.className = 'form-message success';
            contactForm.reset();
          }
        } catch (error) {
          // Error
          console.error('Error submitting form:', error);
          formMessage.textContent = 'Sorry, there was an error. Please try again or call us directly.';
          formMessage.className = 'form-message error';
        } finally {
          // Re-enable submit button
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send Message';
          
          // Hide message after 5 seconds
          setTimeout(() => {
            formMessage.style.display = 'none';
          }, 5000);
        }
      };

      contactForm.addEventListener('submit', handleSubmit);
    }

    // Fade in animation on scroll
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    document.querySelectorAll('.fade-in').forEach(el => {
      observer.observe(el);
    });

    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });

    // Add scroll effect to navigation
    const handleScroll = () => {
      const nav = document.querySelector('nav');
      if (nav) {
        if (window.scrollY > 100) {
          nav.style.background = 'rgba(255, 255, 255, 0.98)';
          nav.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        } else {
          nav.style.background = 'rgba(255, 255, 255, 0.95)';
          nav.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
        }
      }
    };

    window.addEventListener('scroll', handleScroll);

    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <>
      {/* Navigation */}
      <nav>
        <div className="nav-container">
          <a href="#home" className="logo">
            <img src="/images/logo.png" alt="ApexElement" className="logo-image" />
          </a>
          <ul className="nav-links" id="navLinks">
            <li><a href="#home">Home</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#products">Products</a></li>
            <li><a href="#services">Services</a></li>
            <li><a href="#features">Features</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
          <button className="mobile-menu-toggle" id="mobileMenuToggle">☰</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero" id="home">
        <div className="hero-content">
          <h1>Transform Your Business with AI Automation</h1>
          <p>ApexElement delivers cutting-edge artificial intelligence solutions that make advanced AI tools accessible, affordable, and practical for everyday business use.</p>
          <div className="cta-buttons">
            <a href="#contact" className="btn btn-primary">Get Started</a>
            <a href="#services" className="btn btn-secondary">Explore Services</a>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="about" id="about">
        <div className="container">
          <h2 className="section-title">About ApexElement</h2>
          <p className="section-subtitle">Empowering businesses with next-generation AI solutions</p>
          <div className="about-content">
            <div className="about-text fade-in">
              <p>ApexElement is a next-generation AI automation firm dedicated to empowering small businesses, creators, and entrepreneurs with cutting-edge artificial intelligence solutions.</p>
              <br />
              <p>Our mission is simple — make advanced AI tools accessible, affordable, and practical for everyday business use. We believe that every business, regardless of size, deserves access to the transformative power of artificial intelligence.</p>
              <br />
              <p>With our expertise in machine learning, natural language processing, and automation technologies, we help businesses streamline operations, enhance customer experiences, and unlock new opportunities for growth.</p>
            </div>
            <div className="about-image fade-in">
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="products" id="products">
        <div className="container">
          <h2 className="section-title">Our Products</h2>
          <p className="section-subtitle">Innovative AI-powered tools designed for everyday use</p>
          <div className="products-grid">
            <div className="product-card fade-in">
              <div className="product-header">
                <div className="product-icon">🍳</div>
                <span className="coming-soon-badge">Coming Soon</span>
              </div>
              <div className="product-body">
                <h3 className="product-title">TasteMoji - Track What You Eat Smarter </h3>
                <p className="product-description">TasteMoji is a smart nutrition companion, designed for effortless calorie tracking and meal logging 🧮. Snap a photo of your food or type it in, and TateMoji will estimate calories, macros, and keep you on track with your daily goals. You can also discover authentic recipes based on ingredients in your fridge 🍛 and get simple nutrition tips 👩‍🍳 to eat better every day.</p>
                <ul className="product-features">
                  <li>Effortless calorie tracking</li>
                  <li>Smart ingredient matching</li>
                  <li>Dietary restrictions support</li>
                  <li>Detailed nutritional information</li>
                  <li>Step-by-Step cooking instructions</li>
                  <li>Shopping list generator</li>
                </ul>
                <button className="btn btn-primary" style={{width: '100%', opacity: 0.7, cursor: 'not-allowed'}} disabled>Launching Soon </button>
              </div>
            </div>
            <div className="product-card fade-in">
              <div className="product-header">
                <div className="product-icon">🎓</div>
              </div>
              <div className="product-body">
                <h3 className="product-title">Syntara - Learn to Code with AI</h3>
                <p className="product-description">Syntara is an AI-powered adaptive learning coach - a mobile-first application that teaches programming through personalized, conversational coaching sessions. Think of it as having a patient, knowledgeable tutor available 24/7 who adapts to your learning style and pace.</p>
                <ul className="product-features">
                  <li>AI coach that adapts in real-time</li>
                  <li>Personalized explanations using analogies</li>
                  <li>Active learning through challenges</li>
                  <li>Affordable and available anytime</li>
                  <li>Gamification to keep learners engaged</li>
                  <li>Perfect for career changers & developers</li>
                </ul>
                <a href="https://syntara.apexelement.ai" className="btn btn-primary" style={{width: '100%', display: 'block', textAlign: 'center', textDecoration: 'none'}} target="_blank" rel="noopener noreferrer">Try Syntara</a>
              </div>
            </div>
            <div className="product-card fade-in">
              <div className="product-header">
                <div className="product-icon">👗</div>
              </div>
              <div className="product-body">
                <h3 className="product-title">LumaMode - AI-Powered Fashion Showcase</h3>
                <p className="product-description">LumaMode is a stunning, modern e-commerce platform that revolutionizes how fashion products are displayed. Powered by AI-generated marketing content including dynamic images, immersive videos, and authentic audio testimonials, LumaMode brings your fashion catalog to life with cutting-edge visual storytelling.</p>
                <ul className="product-features">
                  <li>AI-generated images & videos</li>
                  <li>Interactive product gallery with zoom</li>
                  <li>AI audio testimonials</li>
                  <li>Smooth Framer Motion animations</li>
                  <li>Glass morphism & gradient designs</li>
                  <li>Fully responsive on all devices</li>
                </ul>
                <a href="https://www.lumamode.org/" className="btn btn-primary" style={{width: '100%', display: 'block', textAlign: 'center', textDecoration: 'none'}} target="_blank" rel="noopener noreferrer">Visit LumaMode</a>
              </div>
            </div>
            <div className="product-card fade-in">
              <div className="product-header">
                <div className="product-icon">🌸</div>
              </div>
              <div className="product-body">
                <h3 className="product-title">Cyclara - Private Menstrual Wellness</h3>
                <p className="product-description">Cyclara is your private, AI-powered companion for menstrual wellness. Track your cycle, log your mood, and get personalized support from "Serene" - an empathetic AI that runs 100% offline. Your body, your data, your privacy. Everything stays on your device where it belongs.</p>
                <ul className="product-features">
                  <li>100% offline - no cloud, no tracking</li>
                  <li>On-device AI companion "Serene"</li>
                  <li>Period & cycle phase predictions</li>
                  <li>Mood & symptom logging</li>
                  <li>Export or delete data anytime</li>
                  <li>No account required</li>
                </ul>
                <a href="https://cyclara.apexelement.ai" className="btn btn-primary" style={{width: '100%', display: 'block', textAlign: 'center', textDecoration: 'none'}} target="_blank" rel="noopener noreferrer">Try Cyclara</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="services" id="services">
        <div className="container">
          <h2 className="section-title">Our Services</h2>
          <p className="section-subtitle">Comprehensive AI solutions tailored to your business needs</p>
          <div className="services-grid">
            <div className="service-card fade-in">
              <div className="service-icon">🤖</div>
              <h3 className="service-title">AI Process Automation</h3>
              <p className="service-description">Streamline repetitive tasks and workflows with intelligent automation. Our AI-powered solutions reduce manual work by up to 80%, allowing your team to focus on strategic initiatives that drive growth.</p>
            </div>
            <div className="service-card fade-in">
              <div className="service-icon">💬</div>
              <h3 className="service-title">Conversational AI & Chatbots</h3>
              <p className="service-description">Deploy sophisticated chatbots that understand context and provide human-like interactions. Enhance customer service, automate support, and engage users 24/7 with our advanced NLP solutions.</p>
            </div>
            <div className="service-card fade-in">
              <div className="service-icon">📊</div>
              <h3 className="service-title">Predictive Analytics</h3>
              <p className="service-description">Harness the power of machine learning to forecast trends, identify opportunities, and make data-driven decisions. Transform your raw data into actionable insights that give you a competitive edge.</p>
            </div>
            <div className="service-card fade-in">
              <div className="service-icon">🎯</div>
              <h3 className="service-title">Custom AI Solutions</h3>
              <p className="service-description">Every business is unique. We develop tailored AI applications that address your specific challenges, from computer vision systems to recommendation engines, designed to integrate seamlessly with your existing infrastructure.</p>
            </div>
            <div className="service-card fade-in">
              <div className="service-icon">📝</div>
              <h3 className="service-title">Content Generation & Optimization</h3>
              <p className="service-description">Leverage AI to create, optimize, and personalize content at scale. From marketing copy to product descriptions, our solutions ensure consistent, high-quality output that resonates with your audience.</p>
            </div>
            <div className="service-card fade-in">
              <div className="service-icon">🔍</div>
              <h3 className="service-title">Intelligent Document Processing</h3>
              <p className="service-description">Automate document extraction, classification, and analysis with our AI-powered OCR and NLP technologies. Process invoices, contracts, and forms with 99% accuracy while reducing processing time by 90%.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features" id="features">
        <div className="container">
          <h2 className="section-title">Why Choose ApexElement?</h2>
          <p className="section-subtitle">The competitive advantages that set us apart</p>
          <div className="features-grid">
            <div className="feature-item fade-in">
              <div className="feature-icon">⚡</div>
              <h3 className="feature-title">Rapid Deployment</h3>
              <p className="feature-text">Get your AI solutions up and running in weeks, not months, with our agile implementation approach.</p>
            </div>
            <div className="feature-item fade-in">
              <div className="feature-icon">💰</div>
              <h3 className="feature-title">Cost-Effective</h3>
              <p className="feature-text">Enterprise-grade AI capabilities at prices that make sense for small and medium businesses.</p>
            </div>
            <div className="feature-item fade-in">
              <div className="feature-icon">🔧</div>
              <h3 className="feature-title">Fully Customizable</h3>
              <p className="feature-text">Solutions tailored to your specific industry, workflows, and business objectives.</p>
            </div>
            <div className="feature-item fade-in">
              <div className="feature-icon">📈</div>
              <h3 className="feature-title">Scalable Architecture</h3>
              <p className="feature-text">Our solutions grow with your business, from startup to enterprise scale.</p>
            </div>
            <div className="feature-item fade-in">
              <div className="feature-icon">🛡️</div>
              <h3 className="feature-title">Secure & Compliant</h3>
              <p className="feature-text">Bank-level security with full compliance to industry standards and regulations.</p>
            </div>
            <div className="feature-item fade-in">
              <div className="feature-icon">🎓</div>
              <h3 className="feature-title">Expert Support</h3>
              <p className="feature-text">Dedicated AI specialists provide ongoing support and optimization for your solutions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact" id="contact">
        <div className="container">
          <div className="contact-content">
            <h2 className="section-title">Ready to Transform Your Business?</h2>
            <p style={{fontSize: '1.2rem', marginBottom: '2rem'}}>Let's discuss how AI can revolutionize your operations</p>
            
            {/* Contact Form */}
            <form className="contact-form" id="contactForm">
              <div className="form-group">
                <label htmlFor="name">Full Name *</label>
                <input type="text" id="name" name="name" required placeholder="John Doe" />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input type="email" id="email" name="email" required placeholder="john@example.com" />
              </div>
              <div className="form-group">
                <label htmlFor="company">Company Name</label>
                <input type="text" id="company" name="company" placeholder="Your Company" />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input type="tel" id="phone" name="phone" placeholder="+1 (555) 123-4567" />
              </div>
              <div className="form-group">
                <label htmlFor="message">How can we help you? *</label>
                <textarea id="message" name="message" required placeholder="Tell us about your project or requirements..."></textarea>
              </div>
              <button type="submit" className="form-submit" id="submitBtn">Send Message</button>
              <div className="form-message" id="formMessage"></div>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="footer-content">
          <p>&copy; 2025 ApexElement. All rights reserved. | Empowering businesses with AI</p>
        </div>
      </footer>
    </>
  );
}

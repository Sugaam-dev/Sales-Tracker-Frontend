import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Zap,
  Flame,
  CheckCircle2,
  Lock,
  Play,
  FileText,
  DollarSign,
  Building2,
  Star,
  Activity,
  BarChart3,
  Layers,
  ArrowUpRight,
  ChevronRight,
  Users,
  Download,
  ChevronUp
} from "lucide-react";
import LandingChatbot from "../components/LandingChatbot";
import "./LandingPage.css";

export default function LandingPage() {
  const [selectedPlanTier, setSelectedPlanTier] = useState("growth");
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    document.title = "PMRG Sales Tracker — Intelligent CRM & Revenue Platform";

    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  // Trusted enterprise partners
  const partners = [
    { name: "StratEdge", icon: "⬡" },
    { name: "Synerzo", icon: "◈" },
    { name: "Quantix", icon: "❖" },
    { name: "EuroSync", icon: "⌬" },
    { name: "VortexAI", icon: "⎔" },
    { name: "ApexCore", icon: "⯁" }
  ];

  return (
    <div className="pmrg-landing">
      {/* Clean Subtle Sapphire Ambient Glow */}
      <div className="pmrg-spotlight spotlight-blue-top"></div>
      <div className="pmrg-spotlight spotlight-blue-bottom"></div>

      {/* Navigation Bar */}
      <header className="pmrg-nav-wrapper">
        <div className="pmrg-nav">
          {/* PMRG Brand Logo (Using /logo.png) */}
          <Link to="/" className="pmrg-brand-link">
            <img 
              src="/logo.png" 
              alt="PMRG Solution" 
              className="pmrg-navbar-logo" 
            />
          </Link>

          {/* Navigation Pill Container */}
          <nav className="pmrg-nav-pill">
            <a href="#hero" className="nav-pill-item active">Home</a>
            <a href="#features" className="nav-pill-item">Features</a>
            <a href="#solutions" className="nav-pill-item">Solutions</a>
            <a href="#testimonials" className="nav-pill-item">Testimonials</a>
          </nav>

          {/* Auth Actions */}
          <div className="pmrg-nav-actions">
            <Link 
              to="/login" 
              className="btn-nav-primary"
            >
              Login <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pmrg-hero" id="hero">
        <div className="hero-grid-layout">
          {/* Left Column: Value Proposition */}
          <div className="hero-text-col">
            <div className="pmrg-badge-pill">
              <span className="badge-sparkle">✦</span>
              <span>Next-Gen Sales Intelligence</span>
              <span className="badge-dot">•</span>
              <span className="badge-highlight">PMRG Platform</span>
            </div>

            <h1 className="hero-main-title">
              Designed to Help <br />
              Revenue Leaders <br />
              <span className="gradient-brand-text">Boost Sales</span>
            </h1>

            <p className="hero-lead-text">
              Predict, optimize, and close deals faster powered by cutting-edge
              automation that feels as intuitive as your best sales rep.
            </p>

            <div className="hero-cta-button-row">
              <Link to="/login" className="btn-primary-glow">
                Login <ArrowRight size={17} />
              </Link>
            </div>

            
          </div>

          {/* Right Column: Interactive CRM Metrics & Forecast Chart */}
          <div className="hero-visual-col">
            {/* Top Row: Mini Metrics */}
            <div className="hero-kpi-cards-row">
              {/* Metric Card 1 */}
              <div className="pmrg-glass-card metric-card">
                <div className="metric-header-text">Sales velocity</div>
                <div className="metric-data-row">
                  <span className="metric-number-big">$210</span>
                  <span className="growth-badge positive">+ 23%</span>
                </div>
              </div>

              {/* Metric Card 2 */}
              <div className="pmrg-glass-card metric-card">
                <div className="metric-header-text">Closed deals amount</div>
                <div className="metric-data-row">
                  <span className="metric-number-big">$12,400</span>
                  <span className="growth-badge positive">+ 13%</span>
                </div>
              </div>
            </div>

            {/* Bottom Forecast Card */}
            <div className="pmrg-glass-card forecast-main-card">
              <div className="forecast-header">
                <div className="forecast-title-group">
                  <h3>Current forecast</h3>
                  <span className="forecast-sub">Q1 Performance Pipeline</span>
                </div>
                <div className="forecast-legend-wrap">
                  <span className="legend-entry">
                    <span className="legend-indicator plan"></span> Plan
                  </span>
                  <span className="legend-entry">
                    <span className="legend-indicator forecast"></span> Forecast
                  </span>
                </div>
              </div>

              {/* Bar Chart Visualization */}
              <div className="forecast-bars-wrapper">
                {/* Month 1: January */}
                <div className="forecast-bar-column">
                  <div className="bars-cluster">
                    <div className="single-bar-unit">
                      <span className="bar-amt-tag">$24,000</span>
                      <div className="chart-bar-pillar plan-pillar" style={{ height: "105px" }}></div>
                    </div>
                    <div className="single-bar-unit">
                      <span className="bar-amt-tag highlight-blue">$21,000</span>
                      <div className="chart-bar-pillar forecast-pillar" style={{ height: "92px" }}></div>
                    </div>
                  </div>
                  <div className="month-caption">January</div>
                </div>

                {/* Month 2: February */}
                <div className="forecast-bar-column">
                  <div className="bars-cluster">
                    <div className="single-bar-unit">
                      <span className="bar-amt-tag">$33,500</span>
                      <div className="chart-bar-pillar plan-pillar" style={{ height: "150px" }}></div>
                    </div>
                    <div className="single-bar-unit">
                      <span className="bar-amt-tag highlight-blue">$28,000</span>
                      <div className="chart-bar-pillar forecast-pillar" style={{ height: "130px" }}></div>
                    </div>
                  </div>
                  <div className="month-caption">February</div>
                </div>

                {/* Month 3: March */}
                <div className="forecast-bar-column">
                  <div className="bars-cluster">
                    <div className="single-bar-unit">
                      <span className="bar-amt-tag">$39,000</span>
                      <div className="chart-bar-pillar plan-pillar" style={{ height: "170px" }}></div>
                    </div>
                    <div className="single-bar-unit">
                      <span className="bar-amt-tag highlight-blue">$48,000</span>
                      <div className="chart-bar-pillar forecast-pillar accent-glow" style={{ height: "200px" }}></div>
                    </div>
                  </div>
                  <div className="month-caption">March</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted Partners Section */}
      <section className="pmrg-partners-strip">
        <p className="partners-heading-caption">Our Trusted Partners</p>
        <div className="partners-badges-grid">
          {partners.map((partner, index) => (
            <div key={index} className="partner-item-card">
              <span className="partner-symbol">{partner.icon}</span>
              <span className="partner-title">{partner.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Bento Grid CRM Features Section */}
      <section className="pmrg-features-section" id="features">
        <div className="section-headline-block">
          <div className="section-pill-tag">
            <span>PMRG CRM INTELLIGENCE</span>
          </div>
          <h2 className="section-main-heading">Empower Your Entire Sales Cycle</h2>
          <p className="section-sub-heading">
            High-fidelity pipeline management and intelligence across every stage — from lead discovery to commercial sign-off.
          </p>
        </div>

        <div className="pmrg-bento-grid">
          {/* Bento Box 1: Lead Heatmap & Intent Scoring */}
          <div className="bento-tile bento-tile-featured">
            <div className="bento-tile-header">
              <div className="bento-category-tag">LEAD HEAT MAP</div>
              <h3 className="bento-tile-title">Visual Lead Heat Map & Scoring</h3>
              <p className="bento-tile-text">
                Identify high-probability opportunities instantly. Real-time engagement scoring ranks prospects so your reps focus on deals ready to close.
              </p>
            </div>

            <div className="bento-heatmap-box">
              <div className="heatmap-cards-matrix">
                <div className="heat-item hot-deal pulse-border">
                  <Flame size={14} className="text-orange" />
                  <span>Acme Corp — <strong>98% Intent</strong></span>
                </div>
                <div className="heat-item hot-deal">
                  <Flame size={14} className="text-orange" />
                  <span>Nexus Tech — <strong>95% Intent</strong></span>
                </div>
                <div className="heat-item warm-deal">
                  <Zap size={14} className="text-blue" />
                  <span>Globex Inc — <strong>82% Intent</strong></span>
                </div>
                <div className="heat-item warm-deal">
                  <Zap size={14} className="text-blue" />
                  <span>Apex Retail — <strong>76% Intent</strong></span>
                </div>
                <div className="heat-item nurture-deal">
                  <Activity size={14} className="text-muted" />
                  <span>Initech Corp — <strong>44% Intent</strong></span>
                </div>
                <div className="heat-item nurture-deal">
                  <Activity size={14} className="text-muted" />
                  <span>Sloan Media — <strong>38% Intent</strong></span>
                </div>
              </div>

              <div className="heatmap-matrix-footer">
                <span className="legend-chip"><span className="dot dot-hot"></span> Hot Deals</span>
                <span className="legend-chip"><span className="dot dot-warm"></span> Warm Prospect</span>
                <span className="legend-chip"><span className="dot dot-nurture"></span> Nurture</span>
              </div>
            </div>
          </div>

          {/* Bento Box 2: Commercial Estimation & Proposals */}
          <div className="bento-tile">
            <div className="bento-tile-header">
              <div className="bento-category-tag">COMMERCIAL ESTIMATION</div>
              <h3 className="bento-tile-title">Quotation & Margin Calculator</h3>
              <p className="bento-tile-text">
                Calculate accurate pricing tiers, project margins dynamically, and generate downloadable commercial PDF contracts in seconds.
              </p>
            </div>

            <div className="bento-quotation-box">
              <div className="quote-tiers-bar">
                <button 
                  className={`quote-tier-btn ${selectedPlanTier === 'startup' ? 'selected' : ''}`}
                  onClick={() => setSelectedPlanTier('startup')}
                >
                  Startup <br /><strong>$49</strong>
                </button>
                <button 
                  className={`quote-tier-btn ${selectedPlanTier === 'growth' ? 'selected' : ''}`}
                  onClick={() => setSelectedPlanTier('growth')}
                >
                  Growth <br /><strong>$149</strong>
                </button>
                <button 
                  className={`quote-tier-btn ${selectedPlanTier === 'enterprise' ? 'selected' : ''}`}
                  onClick={() => setSelectedPlanTier('enterprise')}
                >
                  Enterprise <br /><strong>$299</strong>
                </button>
              </div>

              <div className="quote-calculation-summary">
                <div className="calc-item-row">
                  <span>Estimated Deal Value</span>
                  <strong className="text-white">$24,800</strong>
                </div>
                <div className="calc-item-row highlight-row">
                  <span>Gross Profit Margin</span>
                  <strong className="text-primary-blue">$17,500 | 70% Margin</strong>
                </div>
                <button className="btn-export-pdf">
                  <FileText size={14} /> Generate Proposal PDF
                </button>
              </div>
            </div>
          </div>

          {/* Bento Box 3: Live Sales Activity Timeline */}
          <div className="bento-tile">
            <div className="bento-tile-header">
              <div className="bento-category-tag">ACTIVITY TIMELINE</div>
              <h3 className="bento-tile-title">Real-time Sales Activity Stream</h3>
              <p className="bento-tile-text">
                Keep sales reps aligned with automatic meeting notes, logged call interactions, and stage updates.
              </p>
            </div>

            <div className="bento-activity-stream">
              <div className="activity-stream-item">
                <div className="activity-stream-dot blue"></div>
                <div className="activity-stream-info">
                  <div className="activity-title"><strong>Sarah M.</strong> generated Commercial Quote #342</div>
                  <div className="activity-timestamp">Acme Corp • 12:35 PM</div>
                </div>
              </div>
              <div className="activity-stream-item">
                <div className="activity-stream-dot green"></div>
                <div className="activity-stream-info">
                  <div className="activity-title"><strong>David K.</strong> closed deal: Globex ($15,000)</div>
                  <div className="activity-timestamp">Contract Signed • 12:31 PM</div>
                </div>
              </div>
              <div className="activity-stream-item">
                <div className="activity-stream-dot amber"></div>
                <div className="activity-stream-info">
                  <div className="activity-title"><strong>Follow-up scheduled:</strong> OmniTech Solutions</div>
                  <div className="activity-timestamp">Tomorrow at 10:00 AM</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bento Box 4: Enterprise Security & Multi-Factor Auth */}
          <div className="bento-tile">
            <div className="bento-tile-header">
              <div className="bento-category-tag">SECURITY & ROLES</div>
              <h3 className="bento-tile-title">Enterprise Security & Multi-Factor Auth</h3>
              <p className="bento-tile-text">
                Clean Go backend architecture with MFA OTP verification, SHA-256 tokens, JWT rotation, and granular RBAC.
              </p>
            </div>

            <div className="bento-security-box">
              <div className="security-shield-showcase">
                <ShieldCheck size={38} className="text-primary-blue" />
                <div className="shield-title">MFA & SSO Protected</div>
              </div>
              <div className="security-badges-matrix">
                <span className="sec-badge">✓ MFA OTP Verified</span>
                <span className="sec-badge">✓ SHA-256 Tokens</span>
                <span className="sec-badge">✓ Granular RBAC Roles</span>
                <span className="sec-badge">✓ Audit Logging</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions by Role / Team */}
      <section className="pmrg-solutions-section" id="solutions">
        <div className="section-headline-block">
          <div className="section-pill-tag">
            <span>TAILORED SOLUTIONS</span>
          </div>
          <h2 className="section-main-heading">Built for Every Role in Your Revenue Engine</h2>
          <p className="section-sub-heading">
            Whether you are an AE closing daily leads, a manager estimating margins, or a VP tracking pipeline health.
          </p>
        </div>

        <div className="solutions-cards-grid">
          {/* Solution 1 */}
          <div className="solution-card">
            <div className="solution-icon-wrap blue">
              <Users size={22} />
            </div>
            <h3 className="solution-card-title">For Sales Reps & AEs</h3>
            <p className="solution-card-desc">
              Prioritize hot opportunities with real-time intent heatmaps, log customer meetings in one click, and close deals faster without tedious manual entry.
            </p>
            <ul className="solution-perks-list">
              <li>✓ Dynamic Lead Heatmap Scoring</li>
              <li>✓ Real-time activity feeds & calls</li>
              <li>✓ Instant deal stage transitions</li>
            </ul>
          </div>

          {/* Solution 2 */}
          <div className="solution-card featured-solution">
            <div className="solution-icon-wrap amber">
              <DollarSign size={22} />
            </div>
            <h3 className="solution-card-title">For Commercial & Quoting Teams</h3>
            <p className="solution-card-desc">
              Standardize pricing rules, calculate gross profit margins dynamically, and generate downloadable commercial PDF contracts instantly.
            </p>
            <ul className="solution-perks-list">
              <li>✓ Multi-tier quotation builder</li>
              <li>✓ Live 70%+ margin estimator</li>
              <li>✓ Automated PDF proposal export</li>
            </ul>
          </div>

          {/* Solution 3 */}
          <div className="solution-card">
            <div className="solution-icon-wrap green">
              <BarChart3 size={22} />
            </div>
            <h3 className="solution-card-title">For VPs & Revenue Leaders</h3>
            <p className="solution-card-desc">
              Gain complete visibility over sales velocity, forecast quarterly revenue with plan vs. actual charts, and manage enterprise security with MFA and SSO.
            </p>
            <ul className="solution-perks-list">
              <li>✓ Predictive revenue forecasting</li>
              <li>✓ Team performance analytics</li>
              <li>✓ Enterprise MFA & Azure SSO</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="pmrg-testimonials-section" id="testimonials">
        <div className="section-headline-block">
          <div className="section-pill-tag">
            <span>CLIENT TESTIMONIALS</span>
          </div>
          <h2 className="section-main-heading">Loved by Fast-Growing Sales Teams</h2>
        </div>

        <div className="testimonials-cards-grid">
          <div className="testimonial-box">
            <div className="stars-rating-row">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={15} fill="#3B82F6" color="#3B82F6" />
              ))}
            </div>
            <p className="testimonial-quote-text">
              "The PMRG lead heatmap and instant commercial estimation cut our quote review cycle by 45%. It’s completely transformed how our sales reps prioritize high-value deals."
            </p>
            <div className="testimonial-author">
              <div className="author-avatar-badge">MR</div>
              <div className="author-details">
                <strong className="author-name">Marcus Reed</strong>
                <span className="author-title">VP of Revenue, StratEdge</span>
              </div>
            </div>
          </div>

          <div className="testimonial-box">
            <div className="stars-rating-row">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={15} fill="#3B82F6" color="#3B82F6" />
              ))}
            </div>
            <p className="testimonial-quote-text">
              "PMRG Solution provides the perfect balance of raw sales velocity and enterprise security. The MFA login, role control, and sleek interface make it our team's favorite tool."
            </p>
            <div className="testimonial-author">
              <div className="author-avatar-badge">EL</div>
              <div className="author-details">
                <strong className="author-name">Elena Lawson</strong>
                <span className="author-title">Head of Sales Ops, Synerzo</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action Banner */}
      <section className="pmrg-cta-banner">
        <div className="cta-banner-content">
          <div className="cta-mini-tag">✦ Instant 5-Minute Setup</div>
          <h2 className="cta-heading-title">Ready to accelerate your revenue pipeline?</h2>
          <p className="cta-description">
            Join hundreds of modern sales teams closing more deals with PMRG Sales Tracker.
          </p>
          <div className="cta-actions-group">
            <Link to="/login" className="btn-primary-glow">
              Login <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="pmrg-footer">
        <div className="footer-main-row">
          <div className="footer-brand-column">
            <Link to="/" className="pmrg-brand-link">
              <img 
                src="/logo.png" 
                alt="PMRG Solution" 
                className="pmrg-footer-logo" 
              />
            </Link>
            <p className="footer-tagline-text">
              Next-generation Sales CRM, Lead Heatmap Intelligence, and Commercial Estimation for high-velocity teams.
            </p>
          </div>

          <div className="footer-navigation-groups">
            <div className="footer-links-group">
              <h4>Product</h4>
              <a href="#features">Lead Heatmap</a>
              <a href="#features">Commercial Estimator</a>
              <a href="#features">Activity Timeline</a>
            </div>
            <div className="footer-links-group">
              <h4>Security</h4>
              <a href="#features">MFA Verification</a>
              <a href="#features">JWT Architecture</a>
              <a href="#features">Privacy Policy</a>
            </div>
            <div className="footer-links-group">
              <h4>Company</h4>
              <a href="#">About PMRG Solution</a>
              <a href="#">Documentation</a>
              <a href="#">Contact Support</a>
            </div>
          </div>
        </div>

        <div className="footer-copyright-bar">
          <p>© {new Date().getFullYear()} PMRG Solution CRM & Sales Tracker. All rights reserved.</p>
        </div>
      </footer>

      {/* Floating Scroll to Top Arrow Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="btn-scroll-top"
          aria-label="Scroll to top of page"
          title="Back to top"
        >
          <ChevronUp size={22} strokeWidth={2.5} />
        </button>
      )}

      {/* Floating AI Website Assistance Chatbot */}
      <LandingChatbot />
    </div>
  );
}

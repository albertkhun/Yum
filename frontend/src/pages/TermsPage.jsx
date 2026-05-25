import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, FileText, AlertCircle, Users, Lock, Phone, RefreshCw, Scale, ChevronRight } from 'lucide-react';

const LAST_UPDATED = 'May 25, 2026';
const COMPANY      = 'YumVR';
const EMAIL        = 'support.yumvr.tech@gmail.com';
const LOCATION     = 'Imphal, Manipur, India';

const sections = [
  {
    id: 'acceptance',
    icon: FileText,
    title: 'Acceptance of Terms',
    content: [
  `By accessing or using ${COMPANY} ("YumVR", "the Platform", "we", "us", or "our"), you agree to comply with and be legally bound by these Terms & Conditions. If you do not agree with any part of these terms, you must discontinue use of the platform immediately.`,

  `These Terms & Conditions apply to all visitors, users, property owners, tenants, advertisers, and any individuals accessing or using ${COMPANY}'s website, services, mobile experience, or related features.`,

  `We reserve the right to modify, update, or replace these terms at any time without prior notice. Continued use of the platform after changes become effective constitutes your acceptance of the updated Terms & Conditions.`,
],
  },
  {
    id: 'services',
    icon: Shield,
    title: 'Description of Services',
    content: [
      `${COMPANY} is a property rental discovery platform operating in Manipur, India. We provide a digital marketplace connecting property owners ("Owners") with individuals seeking rental accommodations ("Tenants").`,
      'Our services include: property listing creation and management, search and discovery tools, direct communication facilitation between owners and tenants, virtual reality property previews (where available), review and rating systems, and user account management.',
      `${COMPANY} acts solely as an intermediary. We do not own, manage, or control any listed properties, and we are not a party to any rental agreements made between Owners and Tenants.`,
    ],
  },
  {
    id: 'accounts',
    icon: Users,
    title: 'User Accounts & Eligibility',
    content: [
      'You must be at least 18 years of age to create an account and use our services. By registering, you confirm that all information you provide is accurate, current, and complete.',
      'You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately at ' + EMAIL + ' if you suspect any unauthorized access to your account.',
      'We reserve the right to suspend or terminate accounts that violate these terms, provide false information, engage in fraudulent activity, or misuse the platform in any way.',
      'Each person may maintain only one account. Creating multiple accounts to circumvent bans or restrictions is strictly prohibited.',
    ],
  },
  {
    id: 'owners',
    icon: Shield,
    title: 'Owner Responsibilities',
    content: [
      'Property owners listing on YumVR represent and warrant that: they have full legal authority to list and rent the property, all listing information is accurate and not misleading, the property complies with all applicable local laws and regulations in Manipur, and they will honor confirmed bookings and inquiries in good faith.',
      'Owners must not list properties that are already rented or unavailable without updating the listing status promptly. Listing the same property multiple times or creating duplicate listings is prohibited.',
      'Owners are solely responsible for setting fair rental prices, collecting rent, and managing all aspects of the tenancy. YumVR does not facilitate payment processing or guarantee rental income.',
      'All listings are subject to admin review and approval before going live on the platform. YumVR reserves the right to reject, remove, or modify any listing that violates these terms or community standards.',
    ],
  },
  {
    id: 'tenants',
    icon: Users,
    title: 'Tenant Responsibilities',
    content: [
      'Tenants using YumVR agree to use the platform only for legitimate property search purposes. Any contact information obtained through the platform must be used solely to inquire about the listed property.',
      'Tenants are responsible for conducting their own due diligence before entering into any rental agreement. YumVR does not verify the physical condition of properties beyond what owners submit.',
      'Leaving false, defamatory, or malicious reviews is strictly prohibited. Reviews must reflect genuine first-hand experiences with the property or owner.',
      'Tenants agree not to share, sell, or misuse the contact details of property owners obtained through the platform.',
    ],
  },
  {
    id: 'prohibited',
    icon: AlertCircle,
    title: 'Prohibited Conduct',
    content: [
      'The following activities are strictly prohibited on the YumVR platform:',
      '• Posting false, misleading, or fraudulent property listings\n• Harassment, abuse, or threatening behavior toward other users\n• Scraping, crawling, or automated data extraction from the platform\n• Attempting to bypass security measures or access restricted areas\n• Using the platform for any illegal purpose under Indian law\n• Soliciting payments outside the agreed rental process using deceptive means\n• Impersonating other users, businesses, or YumVR staff\n• Posting content that is obscene, defamatory, or violates third-party rights\n• Spamming users through contact details obtained via the platform',
    ],
  },
  {
    id: 'privacy',
    icon: Lock,
    title: 'Privacy & Data',
    content: [
      `${COMPANY} collects and processes personal data in accordance with applicable Indian data protection laws. By using our platform, you consent to the collection and use of your information as described in our Privacy Policy.`,
      'We collect information including but not limited to: name, email address, phone number, location data, property information submitted by owners, and usage data. This information is used to provide, improve, and personalize our services.',
      'We do not sell your personal data to third parties. Contact information shared between owners and tenants is provided for the sole purpose of facilitating legitimate rental inquiries.',
      'We implement reasonable technical and organizational measures to protect your data. However, no internet transmission is 100% secure, and we cannot guarantee absolute security.',
    ],
  },
  {
    id: 'content',
    icon: FileText,
    title: 'User Content & Intellectual Property',
    content: [
      'By submitting content to YumVR (including property photos, descriptions, and reviews), you grant us a non-exclusive, royalty-free, worldwide license to use, display, reproduce, and distribute that content for the purpose of operating the platform.',
      'You retain ownership of your content. You represent that you have all necessary rights to the content you submit and that it does not infringe on any third-party intellectual property rights.',
      `All platform design, code, branding, trademarks, and original content created by ${COMPANY} are our exclusive intellectual property. You may not copy, reproduce, or use our brand assets without written permission.`,
    ],
  },
  {
    id: 'disclaimers',
    icon: Scale,
    title: 'Disclaimers & Limitation of Liability',
    content: [
      `${COMPANY} provides the platform "as is" and "as available" without warranties of any kind, express or implied. We do not guarantee the accuracy, completeness, or reliability of any listing information.`,
      `${COMPANY} is not liable for: any direct or indirect damages arising from use of the platform, disputes between owners and tenants, the accuracy of listing information, loss of data, or interruption of service.`,
      'We are not responsible for the conduct of any user, whether online or offline. All rental agreements and transactions are solely between the owner and tenant.',
      'Our total liability to you for any claims arising from use of the platform shall not exceed the amount you have paid to us (if any) in the six months preceding the claim.',
    ],
  },
  {
    id: 'termination',
    icon: RefreshCw,
    title: 'Termination',
    content: [
      'You may delete your account at any time by contacting us at ' + EMAIL + '. Upon deletion, your personal data will be handled in accordance with our data retention policy.',
      'We reserve the right to suspend or terminate your access to the platform at our discretion, without notice, for conduct that we determine violates these terms, is harmful to other users, or is otherwise objectionable.',
      'Upon termination, all licenses granted to you under these terms will immediately cease. Provisions that by their nature should survive termination will remain in effect.',
    ],
  },
  {
    id: 'governing',
    icon: Scale,
    title: 'Governing Law & Disputes',
    content: [
      `These Terms and Conditions are governed by and construed in accordance with the laws of India. Any disputes arising from the use of ${COMPANY} shall be subject to the exclusive jurisdiction of the courts in Imphal, Manipur.`,
      'We encourage users to first contact us directly to resolve any disputes amicably. You may reach our support team at ' + EMAIL + ' and we will endeavor to respond within 7 business days.',
      'If a dispute cannot be resolved informally, it shall be settled by arbitration in accordance with the Arbitration and Conciliation Act, 1996 of India.',
    ],
  },
  {
    id: 'contact',
    icon: Phone,
    title: 'Contact Us',
    content: [
      `If you have any questions about these Terms and Conditions, please contact us:\n\nYumVR\n${LOCATION}\nEmail: ${EMAIL}`,
    ],
  },
];

export default function TermsPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <div className="tc-root">
      <div className="tc-hero">
        <div className="tc-hero-inner">
          <div className="tc-hero-badge">
            <Shield size={13} /> Legal
          </div>
          <h1 className="tc-hero-h1">Terms &amp; Conditions</h1>
          <p className="tc-hero-sub">
            Please read these terms carefully before using the YumVR platform.
          </p>
          <p className="tc-last-updated">Last updated: {LAST_UPDATED}</p>
        </div>
      </div>

      <div className="tc-body">
        <div className="tc-layout">

          <aside className="tc-sidebar">
            <div className="tc-sidebar-inner">
              <p className="tc-sidebar-label">On this page</p>
              <nav>
                {sections.map(({ id, title }) => (
                  <a key={id} href={`#${id}`} className="tc-sidebar-link">
                    <ChevronRight size={12} className="tc-sidebar-chevron" />
                    {title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          <main className="tc-main">
            <div className="tc-alert">
              <AlertCircle size={16} className="tc-alert-icon" />
              <p className="tc-alert-text">
                By using YumVR, you agree to these terms. If you do not agree, please discontinue use immediately.
              </p>
            </div>

            {sections.map(({ id, icon: Icon, title, content }) => (
              <section key={id} id={id} className="tc-section">
                <div className="tc-section-header">
                  <div className="tc-section-icon">
                    <Icon size={16} />
                  </div>
                  <h2 className="tc-section-title">{title}</h2>
                </div>
                <div className="tc-section-body">
                  {content.map((para, i) => (
                    <p key={i} className="tc-para">{para}</p>
                  ))}
                </div>
              </section>
            ))}

            <div className="tc-footer-note">
              <p>
                Questions about these terms?{' '}
                <a href={`mailto:${EMAIL}`} className="tc-link">{EMAIL}</a>
              </p>
              <Link to="/" className="tc-back-btn">← Back to Home</Link>
            </div>
          </main>

        </div>
      </div>
    </div>
  );
}

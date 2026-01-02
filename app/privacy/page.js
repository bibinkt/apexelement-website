'use client';

export default function PrivacyPolicy() {
  return (
    <div className="legal-page">
      <nav className="legal-nav">
        <a href="/" className="logo">
          <span>⚡</span>
          <span>ApexElement</span>
        </a>
      </nav>

      <main className="legal-content">
        <h1>Privacy Policy</h1>
        <p className="last-updated">Last Updated: January 2, 2025</p>

        <div className="privacy-highlight">
          <span className="privacy-icon">🔒</span>
          <div>
            <strong>Privacy First:</strong> Cyclara is designed from the ground up to protect your privacy.
            Your data never leaves your device. We don't collect, store, or have access to any of your personal information.
          </div>
        </div>

        <section>
          <h2>1. Introduction</h2>
          <p>
            This Privacy Policy explains how Cyclara ("the App"), developed by ApexElement ("we," "us," or "our"),
            handles information when you use our mobile application. We are committed to protecting your privacy
            and have designed Cyclara with a privacy-first architecture.
          </p>
          <p>
            <strong>The key principle of Cyclara is simple: Your data stays on your device.</strong>
          </p>
        </section>

        <section>
          <h2>2. Information We Do NOT Collect</h2>
          <p>
            Unlike many apps, Cyclara does not collect any personal information. Specifically, we do NOT collect:
          </p>
          <ul>
            <li><strong>Personal identifiers:</strong> No names, email addresses, phone numbers, or account information</li>
            <li><strong>Health data:</strong> No menstrual cycle data, mood logs, symptoms, or any health-related information</li>
            <li><strong>Device identifiers:</strong> No device IDs, advertising IDs, or unique identifiers</li>
            <li><strong>Usage analytics:</strong> No app usage patterns, session data, or behavioral analytics</li>
            <li><strong>Location data:</strong> No GPS, IP address, or location information</li>
            <li><strong>Contacts or calendar:</strong> No access to your contacts, calendar, or other personal data</li>
            <li><strong>AI conversation data:</strong> No chat logs or AI interactions are transmitted to any server</li>
          </ul>
        </section>

        <section>
          <h2>3. How Your Data is Stored</h2>
          <h3>3.1 Local Storage Only</h3>
          <p>
            All data you enter into Cyclara is stored exclusively in a local SQLite database on your device.
            This includes:
          </p>
          <ul>
            <li>Period and cycle tracking information</li>
            <li>Mood and symptom logs</li>
            <li>Notes and personal entries</li>
            <li>Conversations with the AI companion</li>
            <li>App preferences and settings</li>
          </ul>

          <h3>3.2 No Cloud Synchronization</h3>
          <p>
            Cyclara does not sync data to any cloud service. Your information remains solely on the device
            where you installed the App. This means:
          </p>
          <ul>
            <li>We cannot access your data</li>
            <li>Your data cannot be breached from our servers (because we have none storing your data)</li>
            <li>Government requests cannot compel us to provide data we don't have</li>
            <li>Your data is only as secure as your device</li>
          </ul>

          <h3>3.3 No Account Required</h3>
          <p>
            Cyclara does not require you to create an account or provide any identifying information to use
            the App. You can start using all features immediately after installation.
          </p>
        </section>

        <section>
          <h2>4. AI Companion Privacy</h2>
          <p>
            The AI companion feature ("Serene") operates with complete privacy:
          </p>
          <ul>
            <li><strong>On-Device Processing:</strong> The AI model runs entirely on your device using local machine learning frameworks.</li>
            <li><strong>No Server Communication:</strong> Your conversations are never sent to external servers for processing.</li>
            <li><strong>No Training Data:</strong> Your conversations are not used to train or improve AI models.</li>
            <li><strong>Local Storage:</strong> Chat history is stored locally and can be deleted at any time.</li>
          </ul>
        </section>

        <section>
          <h2>5. Your Control Over Your Data</h2>
          <p>
            Cyclara gives you complete control over your data:
          </p>
          <h3>5.1 Export Your Data</h3>
          <p>
            You can export all your data at any time in JSON format. This allows you to:
          </p>
          <ul>
            <li>Create personal backups</li>
            <li>Transfer data to a new device manually</li>
            <li>Review what information is stored</li>
          </ul>

          <h3>5.2 Delete Your Data</h3>
          <p>
            You have multiple deletion options:
          </p>
          <ul>
            <li><strong>Delete Chat History:</strong> Remove all AI conversations while keeping other data</li>
            <li><strong>Delete Mood Logs:</strong> Remove specific or all mood entries</li>
            <li><strong>Delete Cycle Data:</strong> Remove period tracking information</li>
            <li><strong>Delete Everything:</strong> Completely wipe all data from the App</li>
            <li><strong>Uninstall:</strong> Removing the App deletes all associated data from your device</li>
          </ul>
        </section>

        <section>
          <h2>6. Third-Party Services</h2>
          <p>
            Cyclara does not integrate with or send data to any third-party services:
          </p>
          <ul>
            <li><strong>No Analytics:</strong> We don't use Google Analytics, Firebase Analytics, Mixpanel, or any other analytics service</li>
            <li><strong>No Advertising:</strong> We don't display ads or use advertising SDKs</li>
            <li><strong>No Social Media:</strong> No Facebook, Google, or other social login or sharing features</li>
            <li><strong>No Crash Reporting:</strong> We don't use Crashlytics, Sentry, or similar services that collect user data</li>
          </ul>
        </section>

        <section>
          <h2>7. App Store Requirements</h2>
          <p>
            When you download Cyclara from the Apple App Store or Google Play Store, those platforms may
            collect certain information according to their own privacy policies. This is outside our control
            and not related to the App itself. We encourage you to review:
          </p>
          <ul>
            <li><a href="https://www.apple.com/legal/privacy/" target="_blank" rel="noopener noreferrer">Apple's Privacy Policy</a></li>
            <li><a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google's Privacy Policy</a></li>
          </ul>
        </section>

        <section>
          <h2>8. Children's Privacy</h2>
          <p>
            Cyclara is intended for users aged 13 and older. We do not knowingly collect any information
            from children under 13. Since all data is stored locally and we don't collect any data, there
            is no information to delete in the event a child under 13 uses the App.
          </p>
          <p>
            Parents or guardians who have concerns should manage app access through device parental controls.
          </p>
        </section>

        <section>
          <h2>9. Security</h2>
          <p>
            While we don't store your data on our servers, we've designed Cyclara with security in mind:
          </p>
          <ul>
            <li>Data is stored in the App's private storage area, inaccessible to other apps</li>
            <li>The App follows platform security best practices</li>
            <li>No network permissions are required for core functionality</li>
          </ul>
          <p>
            <strong>Your responsibility:</strong> Since data is stored on your device, we recommend:
          </p>
          <ul>
            <li>Using device passcode or biometric lock</li>
            <li>Keeping your device's operating system updated</li>
            <li>Regularly backing up your data using the export feature</li>
          </ul>
        </section>

        <section>
          <h2>10. International Users</h2>
          <p>
            Since Cyclara does not transmit data to any servers, there are no international data transfers
            to consider. Your data remains on your device regardless of your location.
          </p>
          <p>
            The App complies with major privacy regulations including GDPR, CCPA, and HIPAA principles
            by simply not collecting or processing personal data.
          </p>
        </section>

        <section>
          <h2>11. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Any changes will be reflected by updating
            the "Last Updated" date at the top of this page. We will also notify users of significant
            changes through the App or our website.
          </p>
          <p>
            Continued use of the App after changes constitutes acceptance of the updated Privacy Policy.
          </p>
        </section>

        <section>
          <h2>12. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy or Cyclara's privacy practices, please contact us:
          </p>
          <p>
            <strong>ApexElement</strong><br />
            Email: <a href="mailto:privacy@apexelement.ai">privacy@apexelement.ai</a><br />
            Website: <a href="https://apexelement.ai">https://apexelement.ai</a>
          </p>
        </section>

        <section>
          <h2>13. Summary</h2>
          <div className="summary-box">
            <h3>Privacy at a Glance</h3>
            <table>
              <tbody>
                <tr>
                  <td>Data Collection</td>
                  <td><strong>None</strong></td>
                </tr>
                <tr>
                  <td>Data Storage</td>
                  <td><strong>Local device only</strong></td>
                </tr>
                <tr>
                  <td>Data Sharing</td>
                  <td><strong>Never</strong></td>
                </tr>
                <tr>
                  <td>Cloud Sync</td>
                  <td><strong>No</strong></td>
                </tr>
                <tr>
                  <td>Account Required</td>
                  <td><strong>No</strong></td>
                </tr>
                <tr>
                  <td>Analytics</td>
                  <td><strong>None</strong></td>
                </tr>
                <tr>
                  <td>Advertising</td>
                  <td><strong>None</strong></td>
                </tr>
                <tr>
                  <td>Third Parties</td>
                  <td><strong>None</strong></td>
                </tr>
                <tr>
                  <td>AI Processing</td>
                  <td><strong>On-device only</strong></td>
                </tr>
                <tr>
                  <td>Data Deletion</td>
                  <td><strong>Full user control</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <footer className="legal-footer">
        <p>&copy; 2025 ApexElement. All rights reserved.</p>
        <div className="legal-links">
          <a href="/terms">Terms and Conditions</a>
          <a href="/">Back to Home</a>
        </div>
      </footer>

      <style jsx>{`
        .legal-page {
          min-height: 100vh;
          background: #f8fafc;
        }
        .legal-nav {
          background: white;
          padding: 16px 32px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .logo {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          color: #1a1a2e;
          font-size: 20px;
          font-weight: 700;
        }
        .legal-content {
          max-width: 800px;
          margin: 0 auto;
          padding: 48px 24px;
        }
        h1 {
          color: #1a1a2e;
          font-size: 36px;
          margin-bottom: 8px;
        }
        .last-updated {
          color: #666;
          font-size: 14px;
          margin-bottom: 24px;
        }
        .privacy-highlight {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          background: linear-gradient(135deg, #dcfce7 0%, #d1fae5 100%);
          border: 1px solid #86efac;
          border-radius: 12px;
          padding: 20px 24px;
          margin-bottom: 40px;
        }
        .privacy-icon {
          font-size: 32px;
        }
        .privacy-highlight strong {
          color: #166534;
        }
        .privacy-highlight div {
          color: #166534;
          line-height: 1.6;
        }
        section {
          margin-bottom: 32px;
        }
        h2 {
          color: #1a1a2e;
          font-size: 22px;
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 2px solid #e0e0e0;
        }
        h3 {
          color: #333;
          font-size: 18px;
          margin: 20px 0 12px 0;
        }
        p {
          color: #444;
          line-height: 1.7;
          margin-bottom: 16px;
        }
        ul {
          margin: 16px 0;
          padding-left: 24px;
        }
        li {
          color: #444;
          line-height: 1.7;
          margin-bottom: 8px;
        }
        a {
          color: #6366f1;
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline;
        }
        strong {
          color: #1a1a2e;
        }
        .summary-box {
          background: white;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          padding: 24px;
        }
        .summary-box h3 {
          margin-top: 0;
          margin-bottom: 16px;
          color: #1a1a2e;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        td {
          padding: 12px 16px;
          border-bottom: 1px solid #f0f0f0;
        }
        td:first-child {
          color: #666;
        }
        td:last-child {
          text-align: right;
          color: #166534;
        }
        tr:last-child td {
          border-bottom: none;
        }
        .legal-footer {
          background: #1a1a2e;
          color: white;
          padding: 32px;
          text-align: center;
        }
        .legal-footer p {
          color: #aaa;
          margin-bottom: 16px;
        }
        .legal-links {
          display: flex;
          justify-content: center;
          gap: 24px;
        }
        .legal-links a {
          color: #8b5cf6;
        }
        @media (max-width: 640px) {
          .legal-content {
            padding: 32px 16px;
          }
          h1 {
            font-size: 28px;
          }
          h2 {
            font-size: 20px;
          }
          .privacy-highlight {
            flex-direction: column;
            gap: 12px;
          }
        }
      `}</style>
    </div>
  );
}

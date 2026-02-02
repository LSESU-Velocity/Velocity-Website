import React from 'react';
import { LegalPageLayout } from './LegalPageLayout';

export const PrivacyPolicy: React.FC = () => {
  return (
    <LegalPageLayout title="Privacy Policy" lastUpdated="February 2026">
      <section>
        <h2>1. Who We Are</h2>
        <p>
          LSESU Velocity ("Velocity", "we", "us", "our") is a student society at the London School of Economics
          and Political Science Students' Union (LSESU). We operate the Velocity website and its associated
          tools at <a href="https://lsesuvelocity.com">lsesuvelocity.com</a>.
        </p>
        <p>
          For the purposes of UK data protection law, LSESU Velocity acts as the data controller for the personal
          data collected through this website.
        </p>
      </section>

      <section>
        <h2>2. What Data We Collect</h2>
        <p>We collect the following data when you use our website and tools:</p>
        <ul>
          <li><strong>User-submitted content</strong> — text you submit to our tools (such as the Launchpad) for AI-powered feedback.</li>
          <li><strong>Authentication cookie</strong> — a single cookie (<code>velocity_auth</code>) used to maintain your session.</li>
          <li><strong>IP addresses and basic request metadata</strong> — collected automatically by our hosting provider (Vercel) as part of standard web server logs.</li>
        </ul>
        <p>We do not collect names, email addresses, or other personal identifiers beyond what is listed above.</p>
      </section>

      <section>
        <h2>3. How We Use Your Data</h2>
        <p>We use the data we collect for the following purposes:</p>
        <ul>
          <li>To provide AI-generated feedback on your submissions via the Google Gemini API.</li>
          <li>To maintain your session and authenticate your access to our tools.</li>
          <li>To enforce rate limiting and prevent abuse of the service.</li>
          <li>To monitor and maintain the security and performance of the website.</li>
        </ul>
      </section>

      <section>
        <h2>4. Legal Basis for Processing</h2>
        <p>Under UK GDPR Article 6, we process your personal data on the following legal bases:</p>
        <ul>
          <li>
            <strong>Legitimate interests</strong> (Art. 6(1)(f)) — processing is necessary for the legitimate
            interests of operating the Velocity website and tools, including session management, security,
            and abuse prevention. These interests do not override your fundamental rights and freedoms.
          </li>
          <li>
            <strong>Consent</strong> (Art. 6(1)(a)) — by submitting content to our tools,
            you consent to that content being processed by the Google Gemini API to generate feedback.
            You may withdraw consent at any time by ceasing to use the service.
          </li>
        </ul>
      </section>

      <section>
        <h2>5. Third-Party Services</h2>
        <p>We use the following third-party services to operate the Velocity website and tools:</p>
        <ul>
          <li>
            <strong>Google Gemini API</strong> — content you submit to our tools is sent to Google's Gemini API to
            generate AI-powered feedback. Google's processing of this data is subject to the{' '}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
              Google Privacy Policy
            </a>.
          </li>
          <li>
            <strong>Firebase / Google Cloud</strong> — used for backend infrastructure and data storage.
            User-submitted content is encrypted at rest before being stored. Subject to the{' '}
            <a href="https://cloud.google.com/terms/cloud-privacy-notice" target="_blank" rel="noopener noreferrer">
              Google Cloud Privacy Notice
            </a>.
          </li>
          <li>
            <strong>Vercel</strong> — hosts the website and processes standard web server logs (IP addresses,
            request metadata). Subject to the{' '}
            <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">
              Vercel Privacy Policy
            </a>.
          </li>
        </ul>
      </section>

      <section>
        <h2>6. Cookies</h2>
        <p>
          We use a single cookie: <code>velocity_auth</code>. This is a strictly necessary, HttpOnly session
          cookie used to authenticate your access to our tools. It does not track you across websites
          and cannot be read by client-side JavaScript.
        </p>
        <p>
          We do not use any analytics cookies, advertising cookies, or third-party tracking cookies. Because
          <code> velocity_auth</code> is strictly necessary for the service to function, consent is not
          required under the UK Privacy and Electronic Communications Regulations (PECR).
        </p>
      </section>

      <section>
        <h2>7. Data Retention</h2>
        <p>
          Content submitted to our tools is stored in encrypted form for the duration necessary
          to provide the service. We periodically review and delete stored data that is no longer needed.
        </p>
        <p>
          Session cookies expire when you close your browser or after a set period of inactivity.
        </p>
        <p>
          Server logs retained by Vercel are subject to Vercel's own data retention policies.
        </p>
      </section>

      <section>
        <h2>8. Your Rights</h2>
        <p>Under UK GDPR, you have the following rights regarding your personal data:</p>
        <ul>
          <li><strong>Right of access</strong> — request a copy of the personal data we hold about you.</li>
          <li><strong>Right to rectification</strong> — request correction of inaccurate personal data.</li>
          <li><strong>Right to erasure</strong> — request deletion of your personal data.</li>
          <li><strong>Right to restrict processing</strong> — request that we limit how we use your data.</li>
          <li><strong>Right to data portability</strong> — request your data in a structured, machine-readable format.</li>
          <li><strong>Right to object</strong> — object to processing based on legitimate interests.</li>
          <li><strong>Right to withdraw consent</strong> — withdraw consent at any time where processing is based on consent.</li>
        </ul>
        <p>
          To exercise any of these rights, please contact us at{' '}
          <a href="mailto:velocity@lsesu.org">velocity@lsesu.org</a>.
          We will respond to your request within one month.
        </p>
      </section>

      <section>
        <h2>9. International Data Transfers</h2>
        <p>
          Your data may be processed in the United States by our third-party service providers (Google and
          Vercel). These transfers are protected by appropriate safeguards, including:
        </p>
        <ul>
          <li>The UK International Data Transfer Agreement (IDTA) or UK Addendum to EU Standard Contractual Clauses.</li>
          <li>Service provider compliance with applicable data protection frameworks.</li>
        </ul>
        <p>
          We take reasonable steps to ensure that your data is treated securely and in accordance with this
          privacy policy when transferred internationally.
        </p>
      </section>

      <section>
        <h2>10. Data Security</h2>
        <p>We take the security of your data seriously and implement the following measures:</p>
        <ul>
          <li><strong>Encryption at rest</strong> — user-submitted content is encrypted using AES-256-GCM before storage.</li>
          <li><strong>Encryption in transit</strong> — all data is transmitted over HTTPS.</li>
          <li><strong>Content Security Policy (CSP)</strong> — HTTP headers restrict the sources of executable content.</li>
          <li><strong>HttpOnly cookies</strong> — session cookies cannot be accessed by client-side scripts.</li>
          <li><strong>Rate limiting</strong> — protects against brute-force and denial-of-service attacks.</li>
        </ul>
        <p>
          While we implement appropriate technical and organisational measures to protect your data, no
          method of transmission over the Internet or electronic storage is 100% secure.
        </p>
      </section>

      <section>
        <h2>11. Children</h2>
        <p>
          The Velocity website and tools are intended for LSE students who are aged 18 or over. We do not knowingly
          collect personal data from anyone under the age of 18. If you believe we have inadvertently
          collected data from a minor, please contact us at{' '}
          <a href="mailto:velocity@lsesu.org">velocity@lsesu.org</a> and we will promptly delete it.
        </p>
      </section>

      <section>
        <h2>12. Changes to This Policy</h2>
        <p>
          We may update this privacy policy from time to time. Any changes will be posted on this page
          with an updated "Last updated" date. We encourage you to review this policy periodically.
        </p>
      </section>

      <section>
        <h2>13. Contact</h2>
        <p>
          If you have any questions about this privacy policy or our data practices, please contact us at:
        </p>
        <p>
          <a href="mailto:velocity@lsesu.org">velocity@lsesu.org</a>
        </p>
      </section>
    </LegalPageLayout>
  );
};

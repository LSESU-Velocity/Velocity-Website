import React from 'react';
import { LegalPageLayout } from './LegalPageLayout';

export const PrivacyPolicy: React.FC = () => {
  return (
    <LegalPageLayout title="Privacy Policy" lastUpdated="April 2026">
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
          <li><strong>User-submitted content</strong> — text you submit to our tools (such as Launchpad Lab) for AI-powered feedback.</li>
          <li><strong>IP addresses and basic request metadata</strong> — collected automatically by our hosting provider (Vercel) as part of standard web server logs.</li>
        </ul>
        <p>
          Launchpad Lab uses a Bring Your Own Key (BYOK) model. Your Google AI Studio API key is stored
          in your browser only (<code>sessionStorage</code> by default, or <code>localStorage</code> if
          you opt into device persistence). Your key is sent to our backend solely to authorize the Gemini
          API request and is never logged, stored on our servers, or returned in responses.
        </p>
        <p>
          Analysis results from Launchpad Lab are stored in your browser&rsquo;s <code>localStorage</code> only.
          They are not sent to or stored on our servers.
        </p>
        <p>
          The Automation Intake tool (<code>/automation-intake</code>) is different: it is intended for
          partner businesses, and any final submission is stored on Velocity&rsquo;s servers so we can
          follow up. In-progress drafts live only in your browser&rsquo;s <code>sessionStorage</code>
          until you press submit. When you submit, we collect your name, role, work email, and the
          business details you chose to share. Sensitive free-text fields (workflow descriptions,
          transcript, generated brief) are encrypted at rest with a key held only on our server;
          a small set of index fields (business name, website, sector, contact name and email,
          submission timestamps, workflow titles) is stored unencrypted so our team can route
          the submission internally.
        </p>
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
            <strong>Firebase / Google Cloud</strong> — used for backend infrastructure for non-Launchpad
            features. Launchpad Lab does not store user-submitted content in Firebase. Subject to the{' '}
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
        <h2>6. Cookies and Browser Storage</h2>
        <p>
          Launchpad Lab does not use login cookies or invite-code sessions. Instead, it uses browser storage:
        </p>
        <ul>
          <li><code>sessionStorage</code> — your API key (cleared when the tab closes), unless you opt into device persistence.</li>
          <li><code>localStorage</code> — your API key (if you chose "remember on this device") and saved analysis results.</li>
        </ul>
        <p>
          We do not use any analytics cookies, advertising cookies, or third-party tracking cookies.
        </p>
      </section>

      <section>
        <h2>7. Data Retention</h2>
        <p>
          Launchpad Lab analysis results are stored in your browser&rsquo;s <code>localStorage</code> only.
          You can delete them at any time from the Saved Lab Runs panel or by clearing your browser data.
          We do not retain copies on our servers.
        </p>
        <p>
          API keys stored in <code>sessionStorage</code> are cleared when you close the tab.
          Keys stored in <code>localStorage</code> (opt-in only) persist until you clear them.
        </p>
        <p>
          Automation Intake drafts in <code>sessionStorage</code> are cleared automatically on
          successful submission. Submitted Automation Intake records are retained on our servers
          until they have been reviewed and actioned by the Velocity team; you can request deletion
          at any time by emailing <a href="mailto:velocity@lsesu.org">velocity@lsesu.org</a>.
        </p>
        <p>
          Server logs retained by Vercel are subject to Vercel&rsquo;s own data retention policies.
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
          <li><strong>Encryption in transit</strong> — all data is transmitted over HTTPS.</li>
          <li><strong>Content Security Policy (CSP)</strong> — HTTP headers restrict the sources of executable content.</li>
          <li><strong>Client-side storage only</strong> — Launchpad Lab analysis results and API keys are stored
            in your browser (<code>sessionStorage</code> or <code>localStorage</code>). We do not store
            your submissions or API keys on our servers.</li>
          <li><strong>No server-side logging of keys</strong> — your Google AI Studio API key is used only to
            authorise the Gemini request and is never written to logs, databases, or response bodies.</li>
        </ul>
        <p>
          While we implement appropriate technical and organisational measures to protect your data, no
          method of transmission over the Internet or electronic storage is 100% secure. Browser-stored
          data is only as secure as your device and browser environment.
        </p>
      </section>

      <section>
        <h2>11. Children</h2>
        <p>
          The Velocity website and tools are intended for users aged 18 or over. The project is built by a
          student society at LSE, but Launchpad Lab is publicly available to anyone with a Google AI Studio
          API key. We do not knowingly collect personal data from anyone under the age of 18. If you believe
          we have inadvertently collected data from a minor, please contact us at{' '}
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

import React from 'react';
import { LegalPageLayout } from './LegalPageLayout';

export const LaunchpadPrivacySecurity: React.FC = () => {
  return (
    <LegalPageLayout title="Launchpad Privacy & Security" lastUpdated="May 2026">
      <section>
        <h2>1. How Launchpad Uses Your Key</h2>
        <p>
          Launchpad uses a browser-entered API key analysis workflow. Users provide an API key from a
          supported AI provider, and Velocity uses that key only to run the Launchpad analysis requested by
          the user. Velocity does not sell API access, does not pay for user model usage, and does not act as
          the billing provider for AI model calls.
        </p>
        <p>
          The current Launchpad deployment supports Google Gemini through Google AI Studio. The product can
          support other model providers later, but other provider adapters should only be shown as available
          when they are actually wired into the backend.
        </p>
      </section>

      <section>
        <h2>2. Key Handling</h2>
        <ul>
          <li>API keys are stored in browser <code>sessionStorage</code> by default and clear when the tab closes.</li>
          <li>Users can opt into device persistence, which stores the key in browser <code>localStorage</code>.</li>
          <li>The key is sent over HTTPS to the Velocity backend only to authorise the selected provider request.</li>
          <li>Velocity does not intentionally log, database-store, or return raw API keys in responses.</li>
          <li>Users can clear their stored key from the Launchpad key status control or by clearing browser storage.</li>
        </ul>
      </section>

      <section>
        <h2>3. Provider Terms, Billing, and Regions</h2>
        <p>
          Provider terms, billing requirements, rate limits, data handling, and regional restrictions vary.
          Users should only use API keys they are authorised to use and should review the provider terms for
          their account, region, and use case.
        </p>
        <h3>Google Gemini / AI Studio</h3>
        <p>
          Google&rsquo;s Gemini API terms state that users must be 18 or older, that API Clients must not be
          directed toward or likely accessed by under-18s, and that API Clients made available to users in the
          UK, EEA, or Switzerland may need to use Paid Services. Google defines Gemini API access as a Paid
          Service only when it is accessed through a Google Cloud project with an active billing account.
        </p>
        <p>
          Google also describes different data-use rules for unpaid and paid services. Users should read the{' '}
          <a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noopener noreferrer">
            Gemini API Additional Terms of Service
          </a>{' '}
          before using a Gemini key with Launchpad.
        </p>
        <h3>OpenAI and Anthropic</h3>
        <p>
          OpenAI and Anthropic are not enabled Launchpad adapters in the current deployment. If those adapters
          are added later, Launchpad should show provider-specific copy at key entry. OpenAI publishes API data
          controls covering training use and abuse monitoring retention, and Anthropic states that inputs and
          outputs from commercial products such as the Anthropic API are not used for model training by default.
        </p>
        <p>
          References:{' '}
          <a href="https://developers.openai.com/api/docs/guides/your-data" target="_blank" rel="noopener noreferrer">
            OpenAI API data controls
          </a>{' '}
          and{' '}
          <a href="https://privacy.claude.com/en/articles/7996868-is-my-data-used-for-model-training" target="_blank" rel="noopener noreferrer">
            Anthropic model training privacy note
          </a>.
        </p>
      </section>

      <section>
        <h2>4. Submitted Content</h2>
        <p>
          Startup ideas and clarification answers are sent to the selected AI provider for processing. Analysis
          results are stored in the user&rsquo;s browser only and are not stored on Velocity servers. Users should
          avoid submitting confidential business information, sensitive personal data, or content they are not
          authorised to share with the selected provider.
        </p>
      </section>

      <section>
        <h2>5. Security Limits</h2>
        <p>
          Launchpad uses HTTPS and client-side storage controls, but browser-stored data is only as secure as
          the user&rsquo;s device and browser profile. Users on shared or managed computers should avoid enabling
          device persistence and should clear the key after use.
        </p>
      </section>
    </LegalPageLayout>
  );
};

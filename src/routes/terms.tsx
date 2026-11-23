import { createFileRoute } from "@tanstack/react-router";
import { Block, LegalPage, mail } from "@/site/Legal";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service · Dry Run Cyber" },
      { name: "description", content: "The terms for using Dry Run Cyber, for businesses buying directly and through MSP partners." },
      { name: "theme-color", content: "#101319" },
    ],
    links: [{ rel: "icon", href: "/favicon.ico", sizes: "any" }],
  }),
  component: Terms,
});

const link = "text-site-paper underline decoration-white/25 underline-offset-4";

function Terms() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="November 23, 2026"
      lead={
        <>
          These terms are an agreement between Dry Run Cyber LLC ("Dry Run Cyber," "we") and the business that signs up or is signed up by an MSP partner
          ("Customer," "you"). By creating an account, accepting an order, or using the service, you agree to them.
        </>
      }
    >
      <Block title="1. The service">
        <p>
          Dry Run Cyber is security awareness training delivered as a 3D game, with a web portal for admins and reports that map each training decision to
          compliance controls (the "Service"). We may improve or change the Service, but we won't materially reduce the core training and reporting during a paid
          term.
        </p>
      </Block>

      <Block title="2. Accounts and people">
        <ol>
          <li>You choose who in your organization gets access ("Learners") and who manages it ("Admins").</li>
          <li>Sign-in uses one-time links sent to a work email. Keep your email accounts secure; you're responsible for activity under your accounts.</li>
          <li>Add only people who work for you or for whom you're arranging training. Remove people who leave.</li>
        </ol>
      </Block>

      <Block title="3. Fees and billing">
        <ol>
          <li>Direct customers pay per seat, billed yearly in advance, at the price on the order or pricing page.</li>
          <li>Fees are non-refundable except where these terms say otherwise. Taxes are yours, other than taxes on our income.</li>
          <li>Late payment can lead to suspension after 15 days' written notice.</li>
          <li>
            We'll give at least 30 days' notice of a price change, effective at your next renewal. Prices locked by a promotion stay locked for the stated period.
          </li>
        </ol>
      </Block>

      <Block title="4. Customers who buy through an MSP partner">
        <ol>
          <li>If an MSP manages your account, your contract and billing are with that MSP, not with us. These terms still govern your use of the Service.</li>
          <li>Your MSP can see your Learners' names, emails, progress and decisions, and can set branding and send invites on your behalf.</li>
          <li>You can ask us to move your account to another MSP or to direct billing. We'll keep your training records through the move.</li>
          <li>If the MSP stops paying us for your seats, we'll tell you and give you 30 days to move before access is suspended.</li>
        </ol>
      </Block>

      <Block title="5. Acceptable use">
        <p>You won't:</p>
        <ul>
          <li>copy, resell, or rebuild the Service outside a written agreement with us;</li>
          <li>reverse engineer it, probe it for vulnerabilities without our written permission, or bypass access limits;</li>
          <li>upload malware, or enter patient, customer, payment or other sensitive data the Service doesn't ask for;</li>
          <li>use it to harass anyone or break the law.</li>
        </ul>
        <p>Responsible security reports are welcome at {mail}.</p>
      </Block>

      <Block title="6. Ownership">
        <p>
          We own the Service, the game, its scenarios and content. You own your organization's data, including your training records ("Customer Data"). You give
          us permission to use Customer Data only to run, support, and improve the Service, and to produce de-identified, aggregated statistics that don't
          identify you or any person.
        </p>
        <p>If you send feedback, we may use it without owing you anything.</p>
      </Block>

      <Block title="7. Confidentiality">
        <p>
          Each side keeps the other's non-public information confidential, uses it only for this agreement, and shares it only with people who need it and are
          bound to keep it confidential. This doesn't cover information that is public, already known, independently built, or required by law to be disclosed
          (with notice where allowed).
        </p>
      </Block>

      <Block title="8. Data protection">
        <p>
          Our{" "}
          <a href="/privacy" className={link}>
            Privacy Policy
          </a>{" "}
          explains what we collect. Where we process personal data for you, our Data Processing Addendum applies and is part of these terms. Email {mail} for a
          copy to sign.
        </p>
      </Block>

      <Block title="9. Training, not a guarantee">
        <p>
          The Service trains people and records that training. It does not guarantee that a breach won't happen, that you'll pass an audit, or that you meet any
          law or framework. Control mappings are our good-faith mapping, and you decide how to use them in your compliance program.
        </p>
      </Block>

      <Block title="10. Warranties and disclaimers">
        <p>
          We'll provide the Service with reasonable skill and care. Otherwise, to the extent the law allows, it is provided "as is" without other warranties,
          including merchantability, fitness for a particular purpose, and non-infringement.
        </p>
      </Block>

      <Block title="11. Limits of liability">
        <p>To the extent the law allows:</p>
        <ol>
          <li>Neither side is liable for indirect, incidental, special, consequential or punitive damages, or for lost profits, revenue or data.</li>
          <li>Each side's total liability is capped at the fees paid or owed for the Service in the 12 months before the claim.</li>
          <li>These limits don't apply to your payment obligations, a breach of Section 5, or either side's fraud or willful misconduct.</li>
        </ol>
      </Block>

      <Block title="12. Indemnity">
        <p>
          We'll defend you against third-party claims that the Service infringes their intellectual property, and pay resulting damages. You'll defend us against
          third-party claims arising from Customer Data you supply or your breach of Section 5.
        </p>
      </Block>

      <Block title="13. Term and ending">
        <ol>
          <li>Paid plans renew for the same term unless either side gives notice 30 days before renewal.</li>
          <li>Either side can end the agreement for a material breach not fixed within 30 days of notice.</li>
          <li>After the agreement ends, you have 60 days to export your training records. Then we delete Customer Data, except what the law requires us to keep.</li>
        </ol>
      </Block>

      <Block title="14. General">
        <ul>
          <li>
            <b>Governing law:</b> Florida law, with courts in Sarasota County, Florida, unless your MSP agreement says otherwise.
          </li>
          <li>
            <b>Changes:</b> we'll post updated terms and email Admins at least 30 days before material changes take effect.
          </li>
          <li>
            <b>Assignment:</b> neither side assigns this agreement without consent, except in a merger or sale of the business.
          </li>
          <li>
            <b>Force majeure:</b> neither side is liable for delays caused by events beyond its reasonable control.
          </li>
          <li>
            <b>Notices:</b> to us at {mail}; to you at your Admin's email.
          </li>
          <li>
            <b>Entire agreement:</b> these terms, your order, and the DPA are the whole agreement and replace earlier discussions.
          </li>
        </ul>
        <p>Questions: {mail}.</p>
      </Block>
    </LegalPage>
  );
}

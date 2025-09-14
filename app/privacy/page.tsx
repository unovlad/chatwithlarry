import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/Footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Privacy Policy
          </h1>
          <p className="text-gray-600">
            Last updated: {new Date().toLocaleDateString("en-US")}
          </p>
        </div>

        <div className="prose prose-gray max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              1. Introduction
            </h2>
            <p className="text-gray-700 mb-4">
              This privacy policy describes how LarryAI ("we", "us", "our")
              collects, uses, and protects your personal information when using
              our service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              2. Information We Collect
            </h2>

            <h3 className="text-xl font-medium text-gray-900 mb-3">
              2.1 Information You Provide
            </h3>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li>Name and email address during registration</li>
              <li>Messages and requests you send through chat</li>
              <li>Documents or files you upload</li>
              <li>Other information you voluntarily provide</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-900 mb-3">
              2.2 Information We Collect Automatically
            </h3>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li>IP address and device information</li>
              <li>Browser type and operating system</li>
              <li>Pages you visit and time spent</li>
              <li>Cookies and similar technologies</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              3. How We Use Your Information
            </h2>
            <p className="text-gray-700 mb-4">
              We use the collected information to:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li>Provide and improve our AI service</li>
              <li>Respond to your requests and provide support</li>
              <li>Personalize your experience</li>
              <li>Analyze service usage to improve it</li>
              <li>Prevent fraud and ensure security</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              4. Information Sharing
            </h2>
            <p className="text-gray-700 mb-4">
              We do not sell, rent, or share your personal information with
              third parties, except in cases:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li>When you have given explicit consent</li>
              <li>To provide services (e.g., hosting or analytics)</li>
              <li>To comply with law or protect our rights</li>
              <li>In case of merger, acquisition, or asset sale</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              5. Information Protection
            </h2>
            <p className="text-gray-700 mb-4">
              We implement appropriate technical and organizational measures to
              protect your personal information from unauthorized access,
              alteration, disclosure, or destruction.
            </p>
            <p className="text-gray-700 mb-4">
              However, no method of transmission over the internet or electronic
              storage is 100% secure, so we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              6. Cookies and Similar Technologies
            </h2>
            <p className="text-gray-700 mb-4">
              We use cookies and similar technologies to:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li>Remember your settings</li>
              <li>Analyze service usage</li>
              <li>Improve functionality</li>
              <li>Personalize content</li>
            </ul>
            <p className="text-gray-700 mb-4">
              You can control cookies through your browser settings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              7. Your Rights
            </h2>
            <p className="text-gray-700 mb-4">
              Depending on your location, you may have the following rights:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li>Access to your personal information</li>
              <li>Correction of inaccurate information</li>
              <li>Deletion of your information</li>
              <li>Restriction of processing your information</li>
              <li>Data portability</li>
              <li>Withdrawal of consent</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              8. Data Retention
            </h2>
            <p className="text-gray-700 mb-4">
              We retain your personal information as long as necessary to
              provide the service or comply with legal obligations. When
              information is no longer needed, we securely delete it.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              9. International Transfers
            </h2>
            <p className="text-gray-700 mb-4">
              Your information may be transferred and processed in countries
              different from your country of residence. We implement appropriate
              measures to protect your information during international
              transfers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              10. Changes to This Policy
            </h2>
            <p className="text-gray-700 mb-4">
              We may update this privacy policy from time to time. We will
              notify you of any changes by publishing the new policy on this
              page and updating the "Last updated" date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              11. Contact Information
            </h2>
            <p className="text-gray-700 mb-4">
              If you have questions about this privacy policy or want to
              exercise your rights, contact us:
            </p>
            <p className="text-gray-700">
              Email:{" "}
              <a
                href="mailto:hello@larryai.com"
                className="text-blue-600 hover:underline"
              >
                hello@larryai.com
              </a>
            </p>
          </section>
        </div>
      </div>
      <Footer fixed={false} marginTop={false} />
    </div>
  );
}

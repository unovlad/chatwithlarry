import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/Footer";

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p className="text-gray-600">
            Last updated: {new Date().toLocaleDateString("en-US")}
          </p>
        </div>

        <div className="prose prose-gray max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="text-gray-700 mb-4">
              By using LarryAI (&quot;Service&quot;), you agree to these terms
              of use. If you do not agree to any part of these terms, do not use
              our service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              2. Service Description
            </h2>
            <p className="text-gray-700 mb-4">
              LarryAI is an AI chatbot that provides interactive responses based
              on information you provide. The service uses artificial
              intelligence to generate responses and may store your conversation
              history.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              3. Registration and Accounts
            </h2>
            <p className="text-gray-700 mb-4">
              Some features of the service may require creating an account. You
              agree to provide accurate and up-to-date information during
              registration.
            </p>
            <p className="text-gray-700 mb-4">
              You are responsible for maintaining the confidentiality of your
              password and for all activities that occur under your account.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              4. Acceptable Use
            </h2>
            <p className="text-gray-700 mb-4">
              You agree to use the service in accordance with the law and not
              to:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li>Provide false, misleading, or harmful information</li>
              <li>Use the service for illegal purposes</li>
              <li>Attempt to gain unauthorized access to the system</li>
              <li>Transmit malicious code or viruses</li>
              <li>Violate intellectual property rights</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              5. Content and Intellectual Property
            </h2>
            <p className="text-gray-700 mb-4">
              You retain rights to content you provide through the service. By
              providing content, you grant LarryAI a non-exclusive license to
              use this content to provide the service.
            </p>
            <p className="text-gray-700 mb-4">
              All rights to the service itself, including software, design, and
              functionality, belong to LarryAI.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              6. Disclaimer
            </h2>
            <p className="text-gray-700 mb-4">
              The service is provided &quot;as is&quot; without warranties of
              any kind. LarryAI does not guarantee the accuracy, reliability, or
              suitability of AI responses for your specific needs.
            </p>
            <p className="text-gray-700 mb-4">
              Use information from the service at your own risk.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              7. Limitation of Liability
            </h2>
            <p className="text-gray-700 mb-4">
              LarryAI shall not be liable for any direct, indirect, incidental,
              or consequential damages arising from the use or inability to use
              the service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              8. Changes to Terms
            </h2>
            <p className="text-gray-700 mb-4">
              We reserve the right to change these terms at any time. Changes
              take effect from the moment they are published on the website.
              Continued use of the service after changes means your agreement to
              the new terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              9. Termination
            </h2>
            <p className="text-gray-700 mb-4">
              We may terminate or suspend your access to the service at any time
              without prior notice for violation of these terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              10. Contact Information
            </h2>
            <p className="text-gray-700 mb-4">
              If you have questions about these terms, contact us:
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

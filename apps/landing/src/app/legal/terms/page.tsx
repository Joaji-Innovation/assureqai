import { CosmicButton } from "@/components/landing/CosmicButton";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TermsOfService() {
  return (
    <main className="min-h-screen bg-white dark:bg-black text-neutral-900 dark:text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 opacity-0 dark:opacity-20 pointer-events-none mix-blend-color-dodge">
           <div className="absolute w-[200%] h-[150%] left-[-50%] bottom-[-20%] bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" 
                style={{ transform: "rotateX(80deg)" }}
           />
      </div>

      <div className="container relative z-10 mx-auto px-4 py-20 max-w-4xl">
        <div className="mb-12">
            <Link href="/" className="inline-flex items-center gap-2 text-neutral-500 dark:text-muted-foreground hover:text-neutral-900 dark:hover:text-white transition-colors mb-8">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
            </Link>

            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">Terms of Service</h1>
            <p className="text-muted-foreground text-lg">Last updated: December 24, 2025</p>
        </div>

        <div className="prose dark:prose-invert max-w-none prose-headings:font-bold prose-h2:text-2xl prose-h3:text-xl prose-p:text-neutral-600 dark:prose-p:text-muted-foreground/80 prose-li:text-neutral-600 dark:prose-li:text-muted-foreground/80">
            <section className="mb-12">
                <h2>1. Acceptance of the Terms of Service</h2>
                <p>
                    These terms of service are entered into by and between You and Joaji Inc. (&quot;Company,&quot; &quot;we,&quot; or &quot;us&quot;). 
                    The following terms and conditions (these &quot;Terms of Service&quot;), govern your access to and use of our website and services.
                </p>
                <p>
                    Please read the Terms of Service carefully before you start to use the Website. By using the Website or by clicking to accept or agree to the Terms of Service 
                    when this option is made available to you, you accept and agree to be bound and abide by these Terms of Service and our Privacy Policy.
                </p>
            </section>

            <section className="mb-12">
                <h2>2. Accessing the Website and Account Security</h2>
                <p>
                    We reserve the right to withdraw or amend this Website, and any service or material we provide on the Website, in our sole discretion without notice. 
                    We will not be liable if for any reason all or any part of the Website is unavailable at any time or for any period.
                </p>
                <p>
                    To access the Website or some of the resources it offers, you may be asked to provide certain registration details or other information. 
                    It is a condition of your use of the Website that all the information you provide on the Website is correct, current, and complete.
                </p>
            </section>

            <section className="mb-12">
                <h2>3. Intellectual Property Rights</h2>
                <p>
                    The Website and its entire contents, features, and functionality (including but not limited to all information, software, text, displays, images, video, and audio, 
                    and the design, selection, and arrangement thereof) are owned by the Company, its licensors, or other providers of such material and are protected by 
                    international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.
                </p>
            </section>

            <section className="mb-12">
                <h2>4. User Accounts</h2>
                <p>
                    When You create an account with Us, You must provide Us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of Your account on Our Service.
                </p>
                <p>
                    You are responsible for safeguarding the password that You use to access the Service and for any activities or actions under Your password, whether Your password is with Our Service or a Third-Party Social Media Service.
                </p>
                <p>
                    You agree not to disclose Your password to any third party. You must notify Us immediately upon becoming aware of any breach of security or unauthorized use of Your account.
                </p>
            </section>

            <section className="mb-12">
                <h2>5. Prohibited Uses</h2>
                <p>You may use the Website only for lawful purposes and in accordance with these Terms of Service. You agree not to use the Website:</p>
                <ul>
                    <li>In any way that violates any applicable federal, state, local, or international law or regulation.</li>
                    <li>For the purpose of exploiting, harming, or attempting to exploit or harm minors in any way by exposing them to inappropriate content, asking for personally identifiable information, or otherwise.</li>
                    <li>To transmit, or procure the sending of, any advertising or promotional material, including any &quot;junk mail&quot;, &quot;chain letter&quot;, &quot;spam&quot;, or any other similar solicitation.</li>
                    <li>To impersonate or attempt to impersonate the Company, a Company employee, another user, or any other person or entity.</li>
                    <li>To engage in any other conduct that restricts or inhibits anyone&apos;s use or enjoyment of the Website, or which, as determined by us, may harm the Company or users of the Website or expose them to liability.</li>
                </ul>
            </section>

            <section className="mb-12">
                <h2>6. Service Availability & SLAs</h2>
                <p>
                    We aim to provide a reliable service and offer a 99.9% uptime SLA for our Enterprise Plan customers. For other plans, we use reasonable efforts to maintain the availability of the Service. 
                    However, we may experience hardware, software, or other problems or need to perform maintenance related to the Service, resulting in interruptions, delays, or errors.
                </p>
                <p>
                    We reserve the right to change, revise, update, suspend, discontinue, or otherwise modify the Service at any time or for any reason without notice to You. 
                    You agree that we have no liability whatsoever for any loss, damage, or inconvenience caused by your inability to access or use the Service during any downtime or discontinuance of the Service.
                </p>
            </section>

            <section className="mb-12">
                <h2>7. Limitation on Liability</h2>
                <p>
                    In no event will the Company, its affiliates, or their licensors, service providers, employees, agents, officers, or directors be liable for damages of any kind, 
                    under any legal theory, arising out of or in connection with your use, or inability to use, the website, any websites linked to it, any content on the website 
                    or such other websites, including any direct, indirect, special, incidental, consequential, or punitive damages.
                </p>
            </section>

            <section className="mb-12">
                <h2>8. Termination</h2>
                <p>
                    We may terminate or suspend Your Account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if You breach these Terms of Service.
                    Upon termination, Your right to use the Service will cease immediately. If You wish to terminate Your Account, You may simply discontinue using the Service.
                </p>
            </section>

            <section className="mb-12">
                <h2>9. Indemnification</h2>
                <p>
                    You agree to defend, indemnify, and hold harmless the Company, its affiliates, licensors, and service providers, and their respective officers, directors, employees, contractors, agents, licensors, suppliers, successors, and assigns from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including reasonable attorneys&apos; fees) arising out of or relating to your violation of these Terms of Service or your use of the Website.
                </p>
            </section>

            <section className="mb-12">
                <h2>10. Governing Law & Dispute Resolution</h2>
                <p>
                    All matters relating to the Website and these Terms of Service, and any dispute or claim arising therefrom or related thereto 
                    (in each case, including non-contractual disputes or claims), shall be governed by and construed in accordance with the laws of India 
                    without giving effect to any choice or conflict of law provision or rule.
                </p>
                <p>
                    Any legal suit, action, or proceeding arising out of, or related to, these Terms of Service or the Website shall be instituted exclusively in the courts of Bengaluru, India.
                </p>
            </section>

            <section className="mb-12">
                <h2>11. Contact Us</h2>
                <p>
                    If you have any questions about these Terms, please contact us at <a href="mailto:support@assureqai.com" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">support@assureqai.com</a>.
                </p>
            </section>
        </div>
      </div>
    </main>
  );
}

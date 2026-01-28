import { CosmicButton } from "@/components/landing/CosmicButton";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PrivacyPolicy() {
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

            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground text-lg">Last updated: December 24, 2025</p>
        </div>

        <div className="prose dark:prose-invert max-w-none prose-headings:font-bold prose-h2:text-2xl prose-h3:text-xl prose-p:text-neutral-600 dark:prose-p:text-muted-foreground/80 prose-li:text-neutral-600 dark:prose-li:text-muted-foreground/80">
            <section className="mb-12">
                <h2>1. Introduction</h2>
                <p>
                    Joaji Inc. (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) respects your privacy and is committed to protecting it through our compliance with this policy. 
                    This policy describes the types of information we may collect from you or that you may provide when you visit the website 
                    or use our AI-powered QA services (collectively, our &quot;Services&quot;) and our practices for collecting, using, maintaining, protecting, and disclosing that information.
                </p>
            </section>

            <section className="mb-12">
                <h2>2. Information We Collect</h2>
                <p>We collect several types of information from and about users of our Services, including:</p>
                <ul>
                    <li><strong>Personal Information:</strong> Name, email address, postal address, phone number, and other identifiers by which you may be contacted online or offline.</li>
                    <li><strong>Business Data:</strong> Call recordings, transcripts, and other operational data you upload for analysis.</li>
                    <li><strong>Usage Data:</strong> Information about your internet connection, the equipment you use to access our Services, and usage details.</li>
                </ul>
            </section>

            <section className="mb-12">
                <h2>3. How We Use Your Information</h2>
                <p>We use information that we collect about you or that you provide to us, including any personal information:</p>
                <ul>
                    <li>To present our Services and its contents to you.</li>
                    <li>To provide you with information, products, or services that you request from us.</li>
                    <li>To fulfill any other purpose for which you provide it.</li>
                    <li>To carry out our obligations and enforce our rights arising from any contracts entered into between you and us, including for billing and collection.</li>
                    <li>To notify you about changes to our Services or any products or services we offer or provide though it.</li>
                </ul>
            </section>

            <section className="mb-12">
                <h2>4. Data Retention</h2>
                <p>
                    We retain your personal data only for as long as is necessary for the purposes set out in this Privacy Policy. 
                    We will retain and use your personal data to the extent necessary to comply with our legal obligations 
                    (for example, if we are required to retain your data to comply with applicable laws), resolve disputes, and enforce our legal agreements and policies.
                </p>
                <p>
                    Usage Data is generally retained for a shorter period of time, except when this data is used to strengthen the security or to improve the functionality of our Service, 
                    or we are legally obligated to retain this data for longer time periods.
                </p>
            </section>

            <section className="mb-12">
                <h2>5. International Transfer of Data</h2>
                <p>
                    Your information, including Personal Data, is processed at the Company&apos;s operating offices and in any other places where the parties involved in the processing are located. 
                    It means that this information may be transferred to — and maintained on — computers located outside of your state, province, country or other governmental jurisdiction 
                    where the data protection laws may differ than those from your jurisdiction.
                </p>
                <p>
                    Your consent to this Privacy Policy followed by your submission of such information represents your agreement to that transfer. 
                    The Company will take all steps reasonably necessary to ensure that your data is treated securely and in accordance with this Privacy Policy 
                    and no transfer of your Personal Data will take place to an organization or a country unless there are adequate controls in place 
                    including the security of your data and other personal information.
                </p>
            </section>

             <section className="mb-12">
                <h2>6. Your Data Protection Rights (GDPR & CCPA)</h2>
                <p>
                    Joaji Inc. aims to take reasonable steps to allow you to correct, amend, delete, or limit the use of your Personal Data.
                </p>
                <p>If you wish to be informed what Personal Data we hold about you and if you want it to be removed from our systems, please contact us.</p>
                <p>In certain circumstances, you have the following data protection rights:</p>
                <ul>
                    <li><strong>The right to access, update or to delete the information we have on you.</strong></li>
                    <li><strong>The right of rectification.</strong> You have the right to have your information rectified if that information is inaccurate or incomplete.</li>
                    <li><strong>The right to object.</strong> You have the right to object to our processing of your Personal Data.</li>
                    <li><strong>The right of restriction.</strong> You have the right to request that we restrict the processing of your personal information.</li>
                    <li><strong>The right to data portability.</strong> You have the right to be provided with a copy of the information we have on you in a structured, machine-readable and commonly used format.</li>
                    <li><strong>The right to withdraw consent.</strong> You also have the right to withdraw your consent at any time where Joaji Inc. relied on your consent to process your personal information.</li>
                </ul>
            </section>

            <section className="mb-12">
                <h2>7. Cookies and Tracking Technologies</h2>
                <p>
                    We use Cookies and similar tracking technologies to track the activity on our Service and store certain information. Tracking technologies used are beacons, tags, and scripts to collect and track information and to improve and analyze our Service.
                </p>
                <p>
                    You can instruct your browser to refuse all Cookies or to indicate when a Cookie is being sent. However, if you do not accept Cookies, You may not be able to use some parts of our Service.
                </p>
            </section>

            <section className="mb-12">
                <h2>8. Children&apos;s Privacy</h2>
                <p>
                    Our Service does not address anyone under the age of 18 (&quot;Children&quot;).
                </p>
                <p>
                    We do not knowingly collect personally identifiable information from anyone under the age of 18. If you are a parent or guardian and you are aware that your Children has provided us with Personal Data, please contact us. 
                    If we become aware that we have collected Personal Data from children without verification of parental consent, we take steps to remove that information from our servers.
                </p>
            </section>

            <section className="mb-12">
                <h2>9. Data Security</h2>
                <p>
                    We have implemented measures designed to secure your personal information from accidental loss and from unauthorized access, use, alteration, and disclosure. 
                    All information you provide to us is stored on our secure servers behind firewalls. Any payment transactions will be encrypted using SSL technology.
                </p>
            </section>

            <section className="mb-12">
                <h2>10. Contact Information</h2>
                <p>
                    To ask questions or comment about this privacy policy and our privacy practices, contact us at: <a href="mailto:support@assureqai.com" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">support@assureqai.com</a>.
                </p>
            </section>
        </div>
      </div>
    </main>
  );
}

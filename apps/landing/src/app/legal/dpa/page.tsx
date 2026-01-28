import { CosmicButton } from "@/components/landing/CosmicButton";
import { ArrowLeft, Download } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DPA() {
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

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">Data Processing Agreement</h1>
                <Button variant="outline" className="border-neutral-200 dark:border-white/10 hover:bg-neutral-100 dark:hover:bg-white/5 text-neutral-900 dark:text-white gap-2">
                    <Download className="w-4 h-4" />
                    Download PDF
                </Button>
            </div>
            <p className="text-muted-foreground text-lg">Last updated: December 24, 2025</p>
        </div>

        <div className="prose dark:prose-invert max-w-none prose-headings:font-bold prose-h2:text-2xl prose-h3:text-xl prose-p:text-neutral-600 dark:prose-p:text-muted-foreground/80 prose-li:text-neutral-600 dark:prose-li:text-muted-foreground/80">
            <section className="mb-12">
                <h2>1. Preamble</h2>
                <p>
                    This Data Processing Agreement (&quot;DPA&quot;) forms part of the Terms of Service between Joaji Inc. (&quot;Processor&quot;) and the Customer (&quot;Controller&quot;) 
                    to reflect the parties&apos; agreement with regard to the processing of personal data.
                </p>
            </section>

            <section className="mb-12">
                <h2>2. Definitions</h2>
                <p>
                    &quot;GDPR&quot; means Regulation (EU) 2016/679 of the European Parliament and of the Council. 
                    The terms &quot;Controller&quot;, &quot;Processor&quot;, &quot;Data Subject&quot;, &quot;Personal Data&quot;, &quot;Processing&quot;, and &quot;Personal Data Breach&quot; shall have the meanings given to them in the GDPR.
                </p>
            </section>

            <section className="mb-12">
                <h2>3. Processing of Personal Data</h2>
                <p>
                    The Processor shall process Personal Data only on behalf of the Controller and in accordance with the written instructions of the Controller 
                    (including as set forth in the Agreement and this DPA), unless otherwise required by applicable law.
                </p>
                <p>The subject matter, nature, and purpose of the processing, the type of Personal Data, and categories of Data Subjects are set out in Annex 1.</p>
            </section>

             <section className="mb-12">
                <h2>4. Security Measures</h2>
                <p>
                    The Processor shall implement appropriate technical and organizational measures to ensure a level of security appropriate to the risk, 
                    taking into account the state of the art, the costs of implementation, and the nature, scope, context, and purposes of processing.
                </p>
            </section>

            <section className="mb-12">
                <h2>6. Audit Rights</h2>
                <p>
                    The Processor shall make available to the Controller on request all information necessary to demonstrate compliance with this DPA, 
                    and shall allow for and contribute to audits, including inspections, by the Controller or an auditor mandated by the Controller 
                    in relation to the Processing of the Personal Data.
                </p>
            </section>

            <section className="mb-12">
                <h2>7. Data Subject Rights</h2>
                <p>
                    The Processor shall, to the extent legally permitted, promptly notify the Controller if it receives a request from a Data Subject to exercise their rights (to access, correct, amend, or delete personal data). 
                    The Processor shall not respond to any such Data Subject request without the Controller&apos;s prior written consent, except to confirm that the request relates to the Controller.
                </p>
            </section>

            <section className="mb-12">
                <h2>8. Personal Data Breach</h2>
                <p>
                    The Processor shall notify the Controller without undue delay after becoming aware of a Personal Data Breach affecting the Controller&apos;s Personal Data. 
                    The Processor shall provide the Controller with sufficient information to allow the Controller to meet any obligations to report or inform Data Subjects of the Personal Data Breach.
                </p>
            </section>

             <section className="mb-12">
                <h2>9. Term and Termination</h2>
                <p>
                    This DPA shall remain in effect as long as the Processor processes Personal Data on behalf of the Controller. 
                    Upon termination of the Principal Agreement, the Processor shall delete or return all Personal Data to the Controller, at the choice of the Controller, 
                    unless applicable law requires storage of the Personal Data.
                </p>
            </section>

            <div className="border border-neutral-200 dark:border-white/10 rounded-xl p-8 bg-neutral-50 dark:bg-white/5 my-12">
                <h3>Annex 1: Details of Processing</h3>
                <ul className="mt-4 space-y-2 list-disc pl-5">
                    <li><strong>Subject Matter:</strong> The subject matter of the data processing is the performance of the Services pursuant to the Agreement.</li>
                    <li><strong>Duration:</strong> As defined in the Agreement.</li>
                    <li><strong>Nature and Purpose:</strong> Automated Quality Assurance, Audio Analysis, Transcription, and Analytics.</li>
                    <li><strong>Data Categories:</strong> Audio recordings, Call transcripts, Metadata (time, duration, agent ID), Customer sentiment data.</li>
                    <li><strong>Data Subjects:</strong> Customers of the Controller (end-users) and Employees/Agents of the Controller.</li>
                </ul>
            </div>

            <div className="border border-neutral-200 dark:border-white/10 rounded-xl p-8 bg-neutral-50 dark:bg-white/5 mb-12">
                <h3>Annex 2: Security Measures</h3>
                <ul className="mt-4 space-y-2 list-disc pl-5">
                    <li><strong>Encryption:</strong> Data is encrypted in transit (TLS 1.2+) and at rest (AES-256).</li>
                    <li><strong>Access Control:</strong> Role-based access control (RBAC) and Multi-Factor Authentication (MFA) for administrative access.</li>
                    <li><strong>Vulnerability Management:</strong> Regular penetration testing and automated vulnerability scanning.</li>
                    <li><strong>Physical Security:</strong> Hosting provider (AWS/GCP/Azure) maintains SOC 2 Type II compliance.</li>
                </ul>
            </div>

            <section className="mb-12">
                <h2>Contact Information</h2>
                 <p>
                    For any inquiries regarding this DPA, please contact us at: <a href="mailto:support@assureqai.com" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">support@assureqai.com</a>.
                </p>
            </section>
        </div>
      </div>
    </main>
  );
}
